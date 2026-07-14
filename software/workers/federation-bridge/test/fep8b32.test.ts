import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import { signProof, verifyProof } from "../src/index";

// ── Ed25519 key + PEM helpers ──────────────────────────────────────────────
function toPem(der: ArrayBuffer, kind: "PUBLIC KEY" | "PRIVATE KEY"): string {
  const b = new Uint8Array(der);
  let bin = "";
  for (let i = 0; i < b.length; i++) bin += String.fromCharCode(b[i]);
  const b64 = btoa(bin);
  const wrapped = b64.match(/.{1,64}/g)!.join("\n");
  return `-----BEGIN ${kind}-----\n${wrapped}\n-----END ${kind}-----`;
}

async function makeEd25519(): Promise<{ privPem: string; pubPem: string }> {
  const kp = (await crypto.subtle.generateKey("Ed25519", true, ["sign", "verify"])) as CryptoKeyPair;
  const privPem = toPem(await crypto.subtle.exportKey("pkcs8", kp.privateKey), "PRIVATE KEY");
  const pubPem = toPem(await crypto.subtle.exportKey("spki", kp.publicKey), "PUBLIC KEY");
  return { privPem, pubPem };
}

// ── FEP-8b32 (Phase 3) ────────────────────────────────────────────────────
describe("FEP-8b32 Object Integrity Proofs", () => {
  let keys: { privPem: string; pubPem: string };
  beforeAll(async () => {
    keys = await makeEd25519();
  });

  it("signs and verifies a round-trip proof", async () => {
    const obj = { id: "x", type: "Create", actor: "https://ex/a" };
    const proof = await signProof(obj, keys.privPem);
    expect(proof.type).toBe("DataIntegrityProof");
    expect(proof.cryptosuite).toBe("eddsa-2022");
    const signed = { ...obj, proof };
    expect(await verifyProof(signed, keys.pubPem)).toBe(true);
  });

  it("rejects a tampered object", async () => {
    const obj = { id: "x", type: "Create", actor: "https://ex/a" };
    const proof = await signProof(obj, keys.privPem);
    const tampered = { ...obj, actor: "https://evil/a", proof };
    expect(await verifyProof(tampered, keys.pubPem)).toBe(false);
  });

  it("rejects when proof is absent", async () => {
    expect(await verifyProof({ id: "x" }, keys.pubPem)).toBe(false);
  });

  it("verifies only with the matching public key", async () => {
    const other = await makeEd25519();
    const obj = { id: "y" };
    const proof = await signProof(obj, keys.privPem);
    expect(await verifyProof({ ...obj, proof }, other.pubPem)).toBe(false);
    expect(await verifyProof({ ...obj, proof }, keys.pubPem)).toBe(true);
  });
});
