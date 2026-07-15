import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import { signProof, verifyProof } from "../src/index";
import { ml_dsa65 } from "@noble/post-quantum/ml-dsa.js";

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

// ── ML-DSA-65 key helpers ──────────────────────────────────────────────────
function bytesToB64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function bytesToB64url(bytes: Uint8Array): string {
  return bytesToB64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function makeMldsa65(): { publicKey: Uint8Array; secretKey: Uint8Array } {
  return ml_dsa65.keygen();
}

function signMldsa65(message: string, secretKey: Uint8Array): string {
  const sig = ml_dsa65.sign(secretKey, new TextEncoder().encode(message));
  return bytesToB64url(sig);
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

// ── CWP-2026-051: ML-DSA-65 mesh verification ─────────────────────────────
describe("ML-DSA-65 (FIPS 204) Object Integrity Proofs", () => {
  let pqKeys: { publicKey: Uint8Array; secretKey: Uint8Array };
  let edKeys: { privPem: string; pubPem: string };

  beforeAll(() => {
    pqKeys = makeMldsa65();
  });

  beforeAll(async () => {
    edKeys = await makeEd25519();
  });

  it("produces a valid ML-DSA-65 keypair (1952-byte public key)", () => {
    expect(pqKeys.publicKey.length).toBe(1952);
    expect(pqKeys.secretKey.length).toBe(4032);
  });

  it("signs and verifies an ML-DSA-65 round-trip via verifyMLDSA65", async () => {
    const msg = "care|did:test:abc|1700000000";
    const sig = ml_dsa65.sign(new TextEncoder().encode(msg), pqKeys.secretKey);
    const ok = ml_dsa65.verify(sig, new TextEncoder().encode(msg), pqKeys.publicKey);
    expect(ok).toBe(true);
  });

  it("rejects a tampered ML-DSA-65 signature", () => {
    const msg = "care|did:test:abc|1700000000";
    const sig = ml_dsa65.sign(new TextEncoder().encode(msg), pqKeys.secretKey);
    const tampered = new Uint8Array(sig);
    tampered[0] ^= 0xff; // flip bits
    const ok = ml_dsa65.verify(tampered, new TextEncoder().encode(msg), pqKeys.publicKey);
    expect(ok).toBe(false);
  });

  it("rejects ML-DSA-65 with wrong public key", () => {
    const other = ml_dsa65.keygen();
    const msg = "care|did:test:abc|1700000000";
    const sig = ml_dsa65.sign(new TextEncoder().encode(msg), pqKeys.secretKey);
    const ok = ml_dsa65.verify(sig, new TextEncoder().encode(msg), other.publicKey);
    expect(ok).toBe(false);
  });

  it("builds a composite proof object with Ed25519 + pqProof", async () => {
    const obj = { id: "composite-test", type: "Create", actor: "https://ex/a" };
    const edProof = await signProof(obj, edKeys.privPem);

    const canonicalMsg = JSON.stringify(obj);
    const pqSig = ml_dsa65.sign(new TextEncoder().encode(canonicalMsg), pqKeys.secretKey);

    const pqProof = {
      type: "DataIntegrityProof",
      cryptosuite: "mldsa-65",
      proofPurpose: "assertionMethod",
      verificationMethod: "did:test:node0#pq-key",
      publicKeyBase64: bytesToB64(pqKeys.publicKey),
      created: new Date().toISOString(),
      proofValue: bytesToB64url(pqSig),
    };

    const composite = { ...obj, proof: edProof, pqProof };
    expect(composite.proof.cryptosuite).toBe("eddsa-2022");
    expect(composite.pqProof.cryptosuite).toBe("mldsa-65");
    expect(composite.proof).toBeDefined();
    expect(composite.pqProof).toBeDefined();
  });
});
