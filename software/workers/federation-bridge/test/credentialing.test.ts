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
          const [id, issuer, subject, type, sdjwt, activity, created_at] = args;
          this.creds.set(id, { id, issuer, subject, type, sdjwt, activity, created_at });
        }
        return {};
      },
      first: async () => (sql.includes("SELECT * FROM credentials WHERE id") ? this.creds.get(args[0]) || null : null),
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

beforeAll(() => {
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
