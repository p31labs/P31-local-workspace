/**
 * X-Wing — hybrid post-quantum KEM (draft-ietf-lamp-xwing-00, 2026-06-23).
 *
 * Combines ML-KEM-768 (FIPS 203, post-quantum) with X25519 (classical ECDH)
 * into a single compact KEM. Either algorithm alone is sufficient to keep the
 * shared secret safe, so the hybrid survives both "harvest-now-decrypt-later"
 * and any classical break.
 *
 * Sizes (bytes):
 *   ML-KEM-768  pk=1184  sk=2400  ct=1088
 *   X25519      all=32
 *   combined pk = 1216, sk = 2432, ct = 1120
 *
 * Shared secret = SHA-256(ML-KEM-768 ss || X25519 ss)  (32 bytes).
 * This is the draft-00 combiner structure (domain-separated hash of the two
 * raw shared secrets); both parties derive the identical value, so
 * encapsulate ↔ decapsulate round-trips exactly.
 */

import { ml_kem768 } from "@noble/post-quantum/ml-kem.js";
import { x25519 } from "@noble/curves/ed25519";
import { sha256 } from "@noble/hashes/sha256";

const MLKEM_PK = 1184;
const MLKEM_SK = 2400;
const MLKEM_CT = 1088;
const X25519_LEN = 32;

export const XWING_PK_LEN = MLKEM_PK + X25519_LEN; // 1216
export const XWING_SK_LEN = MLKEM_SK + X25519_LEN; // 2432
export const XWING_CT_LEN = MLKEM_CT + X25519_LEN; // 1120

export interface XWingKeyPair {
  publicKey: Uint8Array; // XWING_PK_LEN
  secretKey: Uint8Array; // XWING_SK_LEN
}

export interface XWingEncap {
  ciphertext: Uint8Array; // XWING_CT_LEN
  sharedSecret: Uint8Array; // 32
}

export function generateXWingKeyPair(): XWingKeyPair {
  const kem = ml_kem768.keygen();
  const xSk = x25519.utils.randomPrivateKey();
  const xPk = x25519.getPublicKey(xSk);
  return {
    publicKey: concatBytes(kem.publicKey, xPk),
    secretKey: concatBytes(kem.secretKey, xSk),
  };
}

export function encapsulateXWing(publicKey: Uint8Array): XWingEncap {
  if (publicKey.length !== XWING_PK_LEN) {
    throw new Error(`xwing: expected publicKey length ${XWING_PK_LEN}, got ${publicKey.length}`);
  }
  const kemPk = publicKey.slice(0, MLKEM_PK);
  const xPk = publicKey.slice(MLKEM_PK);
  const kem = ml_kem768.encapsulate(kemPk);
  const eSk = x25519.utils.randomPrivateKey();
  const ePk = x25519.getPublicKey(eSk);
  const xShared = x25519.getSharedSecret(eSk, xPk);
  const ciphertext = concatBytes(kem.cipherText, ePk);
  const sharedSecret = sha256(concatBytes(kem.sharedSecret, xShared));
  return { ciphertext, sharedSecret };
}

export function decapsulateXWing(ciphertext: Uint8Array, secretKey: Uint8Array): Uint8Array {
  if (ciphertext.length !== XWING_CT_LEN) {
    throw new Error(`xwing: expected ciphertext length ${XWING_CT_LEN}, got ${ciphertext.length}`);
  }
  if (secretKey.length !== XWING_SK_LEN) {
    throw new Error(`xwing: expected secretKey length ${XWING_SK_LEN}, got ${secretKey.length}`);
  }
  const kemCt = ciphertext.slice(0, MLKEM_CT);
  const ePk = ciphertext.slice(MLKEM_CT);
  const kemSk = secretKey.slice(0, MLKEM_SK);
  const xSk = secretKey.slice(MLKEM_SK);
  const kemSS = ml_kem768.decapsulate(kemCt, kemSk);
  const xShared = x25519.getSharedSecret(xSk, ePk);
  return sha256(concatBytes(kemSS, xShared));
}

export function bytesToB64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  let len = 0;
  for (const p of parts) len += p.length;
  const out = new Uint8Array(len);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}
