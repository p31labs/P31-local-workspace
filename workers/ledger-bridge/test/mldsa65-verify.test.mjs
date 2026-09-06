// CWP-2026-027 A — Node e2e test for the ML-DSA-65 verify path used by
// ledger-bridge /care-proof (mldsa65_sig). Mirrors src/index.ts verifyMLDSA65:
//   b64url decode -> ml_dsa65.verify(sig, msg, pub).
// CWP-2026-029 P4 — Composite signature tests (Ed25519 + ML-DSA-65 defence-in-depth).
import { test } from "node:test";
import assert from "node:assert/strict";
import { ml_dsa65 } from "@noble/post-quantum/ml-dsa.js";

function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function verifyMLDSA65(message, sigB64, pubB64) {
  try {
    return ml_dsa65.verify(
      b64ToBytes(sigB64),
      new TextEncoder().encode(message),
      b64ToBytes(pubB64),
    );
  } catch {
    return false;
  }
}

// Standard base64 — matches the worker's b64ToBytes(atob) used for sigs/pub
// in /care-proof. PHOS transmits ML-DSA-65 sig + pub as standard base64.
function bytesToB64(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function buildProofMessage(did, users, tProx, qRes, tasks, entropyRoots) {
  const j = (a) => a.map((v) => String(v)).join(",");
  return `proof|${did}|${j(users)}|${j(tProx)}|${j(qRes)}|${j(tasks)}|${j(entropyRoots)}`;
}

test("ML-DSA-65 signature verifies over the canonical care-proof message", () => {
  const keys = ml_dsa65.keygen();
  const did = "did:key:zABC";
  const users = ["0x1111111111111111111111111111111111111111"];
  const msg = buildProofMessage(did, users, [5], [7], [3], [
    "0x" + "ab".repeat(32),
  ]);
  const sig = ml_dsa65.sign(new TextEncoder().encode(msg), keys.secretKey);

  const ok = verifyMLDSA65(msg, bytesToB64(sig), bytesToB64(keys.publicKey));
  assert.equal(ok, true, "valid ML-DSA-65 sig must verify");
});

test("tampered message fails ML-DSA-65 verification", () => {
  const keys = ml_dsa65.keygen();
  const msg = buildProofMessage(
    "did:key:zABC",
    ["0x1111111111111111111111111111111111111111"],
    [5],
    [7],
    [3],
    ["0x" + "ab".repeat(32)],
  );
  const sig = ml_dsa65.sign(new TextEncoder().encode(msg), keys.secretKey);
  const tampered = msg + "|EXTRA";
  const ok = verifyMLDSA65(tampered, bytesToB64(sig), bytesToB64(keys.publicKey));
  assert.equal(ok, false, "tampered message must fail");
});

test("wrong public key fails ML-DSA-65 verification", () => {
  const keys = ml_dsa65.keygen();
  const other = ml_dsa65.keygen();
  const msg = buildProofMessage(
    "did:key:zABC",
    ["0x1111111111111111111111111111111111111111"],
    [5],
    [7],
    [3],
    ["0x" + "ab".repeat(32)],
  );
  const sig = ml_dsa65.sign(new TextEncoder().encode(msg), keys.secretKey);
  const ok = verifyMLDSA65(msg, bytesToB64(sig), bytesToB64(other.publicKey));
  assert.equal(ok, false, "sig under wrong key must fail");
});

// ── CWP-2026-029 P4: Composite signature (Ed25519 + ML-DSA-65) ──────────

test("composite signature: both Ed25519 and ML-DSA-65 must verify", async () => {
  // Generate Ed25519 keypair (Web Crypto)
  const edKP = await crypto.subtle.generateKey("Ed25519", false, ["sign", "verify"]);

  // Generate ML-DSA-65 keypair (@noble/post-quantum)
  const pqKP = ml_dsa65.keygen();

  const msg = "composite-test|proof|did:key:zTest";

  // Sign with Ed25519
  const edSig = new Uint8Array(await crypto.subtle.sign("Ed25519", edKP.privateKey, new TextEncoder().encode(msg)));
  const edSigB64 = bytesToB64(edSig);

  // Sign with ML-DSA-65
  const pqSig = ml_dsa65.sign(new TextEncoder().encode(msg), pqKP.secretKey);
  const pqSigB64 = bytesToB64(pqSig);

  // Export Ed25519 public key
  const edPubRaw = new Uint8Array(await crypto.subtle.exportKey("raw", edKP.publicKey));
  const edPubB64 = bytesToB64(edPubRaw);
  const pqPubB64 = bytesToB64(pqKP.publicKey);

  // Verify both independently
  const edOk = await crypto.subtle.verify("Ed25519", edKP.publicKey, edSig, new TextEncoder().encode(msg));
  assert.equal(edOk, true, "Ed25519 must verify");

  const pqOk = ml_dsa65.verify(pqSig, new TextEncoder().encode(msg), pqKP.publicKey);
  assert.equal(pqOk, true, "ML-DSA-65 must verify");

  // Composite: both must verify
  assert.equal(edOk && pqOk, true, "composite must pass when both verify");
});

test("composite signature: fails when only ML-DSA-65 verifies (Ed25519 missing)", async () => {
  const edKP = await crypto.subtle.generateKey("Ed25519", false, ["sign", "verify"]);
  const pqKP = ml_dsa65.keygen();
  const msg = "composite-negative|proof|did:key:zTest";

  const pqSig = ml_dsa65.sign(new TextEncoder().encode(msg), pqKP.secretKey);
  const pqOk = ml_dsa65.verify(pqSig, new TextEncoder().encode(msg), pqKP.publicKey);
  assert.equal(pqOk, true, "ML-DSA-65 alone must verify");

  // But without Ed25519, composite is incomplete
  // Simulate: Ed25519 verification with wrong key
  const otherEdKP = await crypto.subtle.generateKey("Ed25519", false, ["sign", "verify"]);
  const fakeEdSig = new Uint8Array(await crypto.subtle.sign("Ed25519", otherEdKP.privateKey, new TextEncoder().encode(msg)));
  const edOk = await crypto.subtle.verify("Ed25519", edKP.publicKey, fakeEdSig, new TextEncoder().encode(msg));
  assert.equal(edOk, false, "Ed25519 with wrong key must fail");

  // Composite must fail because Ed25519 failed
  assert.equal(edOk && pqOk, false, "composite must fail when Ed25519 fails");
});

test("composite signature: fails when only Ed25519 verifies (ML-DSA-65 wrong key)", async () => {
  const edKP = await crypto.subtle.generateKey("Ed25519", false, ["sign", "verify"]);
  const pqKP = ml_dsa65.keygen();
  const pqOther = ml_dsa65.keygen();
  const msg = "composite-negative2|proof|did:key:zTest";

  const edSig = new Uint8Array(await crypto.subtle.sign("Ed25519", edKP.privateKey, new TextEncoder().encode(msg)));
  const edOk = await crypto.subtle.verify("Ed25519", edKP.publicKey, edSig, new TextEncoder().encode(msg));
  assert.equal(edOk, true, "Ed25519 must verify");

  // ML-DSA-65 with wrong key
  const pqSig = ml_dsa65.sign(new TextEncoder().encode(msg), pqKP.secretKey);
  const pqOk = ml_dsa65.verify(pqSig, new TextEncoder().encode(msg), pqOther.publicKey);
  assert.equal(pqOk, false, "ML-DSA-65 with wrong key must fail");

  // Composite must fail
  assert.equal(edOk && pqOk, false, "composite must fail when ML-DSA-65 fails");
});
