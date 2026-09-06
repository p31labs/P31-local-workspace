import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import app, { verifyProof } from "../src/index";

function toPem(der: ArrayBuffer, kind: "PUBLIC KEY" | "PRIVATE KEY"): string {
  const b = new Uint8Array(der);
  let bin = "";
  for (let i = 0; i < b.length; i++) bin += String.fromCharCode(b[i]);
  const b64 = btoa(bin);
  return `-----BEGIN ${kind}-----\n${b64.match(/.{1,64}/g)!.join("\n")}\n-----END ${kind}-----`;
}

class MockD1 {
  creds = new Map<string, any>();
  prepare(sql: string) {
    const make = (args: any[]) => ({
      run: async () => {
        if (sql.includes("INSERT OR REPLACE INTO credentials")) {
          const [id, issuer, subject, type, sdjwt, activity, created_at, revoked] = args;
          this.creds.set(id, { id, issuer, subject, type, sdjwt, activity, created_at, revoked: revoked ?? 0 });
        } else if (sql.includes("UPDATE credentials SET revoked")) {
          const [id] = args;
          const row = this.creds.get(id);
          if (row) row.revoked = 1;
        } else if (sql.includes("ALTER TABLE credentials")) {
          /* no-op on mock */
        }
        return {};
      },
      first: async () => {
        if (sql.includes("SELECT id, revoked FROM credentials WHERE id")) {
          const row = this.creds.get(args[0]);
          return row ? { id: row.id, revoked: row.revoked } : null;
        }
        return sql.includes("SELECT * FROM credentials WHERE id") ? this.creds.get(args[0]) || null : null;
      },
      all: async () => ({ results: sql.includes("FROM credentials") ? [...this.creds.values()] : [] }),
    });
    const direct = make([]);
    return { ...direct, bind: (...args: any[]) => make(args) };
  }
}

let env: any;
beforeAll(async () => {
  const kp = (await crypto.subtle.generateKey("Ed25519", true, ["sign", "verify"])) as CryptoKeyPair;
  env = {
    LOVE_DB: new MockD1(),
    ACTOR_PRIVATE_KEY: toPem(await crypto.subtle.exportKey("pkcs8", kp.privateKey), "PRIVATE KEY"),
    ACTOR_PUBLIC_KEY: toPem(await crypto.subtle.exportKey("spki", kp.publicKey), "PUBLIC KEY"),
  };
});

beforeEach(() => {
  vi.stubGlobal("fetch", (url: string) => {
    if (url.includes("/credential/issue"))
      return Promise.resolve(new Response(JSON.stringify({ sdjwt: "fake.sdjwt.value" }), { status: 200 }));
    if (url.includes("/credential/verify"))
      return Promise.resolve(new Response(JSON.stringify({ verified: true, claims: { a: 1 } }), { status: 200 }));
    return Promise.resolve(new Response("", { status: 404 }));
  });
});
afterEach(() => vi.unstubAllGlobals());

const post = (path: string, body: unknown) =>
  app.request(path, {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: "Bearer test" },
    body: JSON.stringify(body),
  }, env);

describe("BadgeFed-style credentialing (Phase 2)", () => {
  it("issues, searches, and verifies a credential end-to-end", async () => {
    const issue = await post("/credential/issue", { subject: "did:example:alice", claims: { skill: "care" }, type: "CareCredential" });
    expect(issue.status).toBe(201);
    const ij = await issue.json();
    expect(ij.sdjwt).toBe("fake.sdjwt.value");
    expect(ij.activity.proof.type).toBe("DataIntegrityProof");
    expect(ij.activity.object.evidence.sdjwt).toBe("fake.sdjwt.value");

    const search = await app.request("/credential/search?subject=did:example:alice", {}, env);
    const sj = await search.json();
    expect(sj.results.length).toBe(1);
    expect(sj.results[0].id).toBe(ij.id);

    const verify = await post("/credential/verify", { id: ij.id });
    const vj = await verify.json();
    expect(vj.integrityProof).toBe(true);
    expect(vj.verified).toBe(true);
  });

  it("rejects issue without subject/claims", async () => {
    const r = await post("/credential/issue", { subject: "x" });
    expect(r.status).toBe(400);
  });

  it("exposes EUDI credential service endpoints in the actor DID document", async () => {
    const res = await app.request("/actor", {}, env);
    const doc = await res.json();
    const services = (doc.service || []).map((s: any) => s.type);
    expect(services).toContain("CredentialIssuer");
    expect(services).toContain("CredentialVerifier");
  });

  it("revokes a credential and reflects it via the EUDI revocation endpoint", async () => {
    const issue = await post("/credential/issue", { subject: "did:example:carol", claims: { skill: "care" }, type: "CareCredential" });
    const ij = await issue.json();

    const before = await app.request(`/credential/revocation/${encodeURIComponent(ij.id)}`, {}, env);
    expect((await before.json()).status).toBe("valid");

    const revoke = await app.request(`/credential/revoke/${encodeURIComponent(ij.id)}`, { method: "POST" }, env);
    expect(revoke.status).toBe(200);
    expect((await revoke.json()).revoked).toBe(true);

    const after = await app.request(`/credential/revocation/${encodeURIComponent(ij.id)}`, {}, env);
    const aj = await after.json();
    expect(aj.status).toBe("invalid");
    expect(aj.revoked).toBe(true);
  });
});

describe("Outbound activity integrity (Phase 3)", () => {
  it("signs published activities and verifies them on inbound", async () => {
    const pub = await post("/publish", { sdjwt: "s.sdjwt", subject: "did:example:bob" });
    expect(pub.status).toBe(201);
    const activity = (await pub.json()).activity;
    expect(activity.proof.type).toBe("DataIntegrityProof");

    const inbox = await app.request("/inbox", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(activity) }, env);
    expect(inbox.status).toBe(202);
  });

  it("rejects inbound activities with a bad proof", async () => {
    const pub = await post("/publish", { sdjwt: "s.sdjwt", subject: "did:example:bob" });
    const activity = (await pub.json()).activity;
    activity.object.content = "tampered";
    const inbox = await app.request("/inbox", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(activity) }, env);
    expect(inbox.status).toBe(422);
  });
});

describe("EUDI gaps closed (CWP-2026-048)", () => {
  it("serves an aggregated Status List 2021 bitstring at /credential/revocation/list", async () => {
    const res = await app.request("/credential/revocation/list", {}, env);
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.type).toBe("VerifiableCredential");
    expect(j.credentialSubject.type).toBe("StatusList2021");
    expect(typeof j.credentialSubject.encodedList).toBe("string");
    expect(j.credentialSubject.statusPurpose).toBe("revocation");
  });

  it("serves a did:web DID Document at /.well-known/did.json", async () => {
    const res = await app.request("/.well-known/did.json", {}, env);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/did+json");
    const doc = await res.json();
    expect(doc.id).toBe("did:web:federation.p31ca.org");
    const types = (doc.service || []).map((s: any) => s.type);
    expect(types).toContain("CredentialIssuer");
    expect(types).toContain("CredentialVerifier");
  });

  it("returns 404 for unknown pilot on /pilot/:did/status", async () => {
    const res = await app.request(`/pilot/${encodeURIComponent("did:web:ghost.example")}/status`, {}, env);
    expect(res.status).toBe(404);
    expect((await res.json()).found).toBe(false);
  });
});
