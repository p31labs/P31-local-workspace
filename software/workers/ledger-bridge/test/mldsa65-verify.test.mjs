// CWP-2026-027 A — Node e2e test for the ML-DSA-65 verify path used by
// ledger-bridge /care-proof (mldsa65_sig). Mirrors src/index.ts verifyMLDSA65:
//   b64url decode -> ml_dsa65.verify(sig, msg, pub).
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
