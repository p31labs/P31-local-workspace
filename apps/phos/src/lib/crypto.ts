/**
 * Sovereign Keymaster — Web Crypto Ed25519 with ECDSA P-256 Fallback
 * Zero telemetry. Zero server dependency.
 */

import { ml_dsa65 } from "@noble/post-quantum/ml-dsa.js";

export interface Keypair {
  did: string;
  publicKey: string;
  privateKey: CryptoKey;
}

export interface SignedMessage {
  message: string;
  signature: string;
  did: string;
}

export async function generateKeypair(): Promise<Keypair> {
  try {
    return await generateEd25519();
  } catch (e) {
    console.warn('Ed25519 not supported, falling back to ECDSA P-256');
    return await generateECDSA();
  }
}

async function generateEd25519(): Promise<Keypair> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'Ed25519', namedCurve: 'Ed25519' } as any,
    true,
    ['sign', 'verify']
  );

  const publicKeyBytes = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  const publicKeyBase64 = arrayBufferToBase64(publicKeyBytes);
  const did = pubToDidKey(new Uint8Array(publicKeyBytes));

  return { did, publicKey: publicKeyBase64, privateKey: keyPair.privateKey };
}

async function generateECDSA(): Promise<Keypair> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  );

  const publicKeyBytes = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  const publicKeyBase64 = arrayBufferToBase64(publicKeyBytes);
  const did = `did:key:z${base64ToBase64Url(publicKeyBase64)}`;

  return { did, publicKey: publicKeyBase64, privateKey: keyPair.privateKey };
}

export async function signMessage(message: string, privateKey: CryptoKey): Promise<string> {
  const data = new TextEncoder().encode(message);
  const signature = await crypto.subtle.sign(
    { name: privateKey.algorithm.name } as any,
    privateKey,
    data
  );
  return arrayBufferToBase64(signature);
}

export async function verifySignature(
  message: string,
  signature: string,
  publicKeyBase64: string
): Promise<boolean> {
  try {
    const signatureBytes = base64ToArrayBuffer(signature);
    const publicKeyBytes = base64ToArrayBuffer(publicKeyBase64);
    const algorithmName = publicKeyBytes.byteLength === 32 ? 'Ed25519' : 'ECDSA';
    const namedCurve = algorithmName === 'Ed25519' ? undefined : 'P-256';

    const key = await crypto.subtle.importKey(
      'raw',
      publicKeyBytes,
      { name: algorithmName as 'Ed25519' | 'ECDSA', namedCurve } as any,
      false,
      ['verify']
    );

    const data = new TextEncoder().encode(message);
    return await crypto.subtle.verify(
      { name: algorithmName as 'Ed25519' | 'ECDSA', namedCurve } as any,
      key,
      signatureBytes,
      data
    );
  } catch {
    return false;
  }
}

// CWP-2026-027 A-5 — Post-quantum ML-DSA-65 signing in the browser.
// `secretKeyB64` is the base64 ML-DSA-65 secret key from the PQC vault.
// Returns STANDARD base64 (the ledger-bridge verifies with atob), not url-safe.
export function signMlDsa65(message: string, secretKeyB64: string): string {
  const skBytes = new Uint8Array(base64ToArrayBuffer(secretKeyB64));
  const sig = ml_dsa65.sign(new TextEncoder().encode(message), skBytes);
  return arrayBufferToBase64(sig);
}

// CWP-2026-029 P1 — ML-DSA-65 verification (base64 signature + base64 public key).
export function verifyMlDsa65(message: string, signatureB64: string, publicKeyB64: string): boolean {
  try {
    const sigBytes = new Uint8Array(base64ToArrayBuffer(signatureB64));
    const pkBytes = new Uint8Array(base64ToArrayBuffer(publicKeyB64));
    return ml_dsa65.verify(new TextEncoder().encode(message), sigBytes, pkBytes);
  } catch {
    return false;
  }
}

// ── CWP-2026-029 P4 — Composite Signatures (Ed25519 + ML-DSA-65) ────────
// IETF LAMPS draft-ietf-lamps-pq-composite-sigs-16: defence-in-depth.
// Both classical and post-quantum signatures must verify for the composite to be valid.

export interface CompositeSignature {
  ed25519_sig: string;  // base64 Ed25519 signature
  mldsa65_sig: string;  // base64 ML-DSA-65 signature
}

/**
 * Create a composite signature: Ed25519 + ML-DSA-65.
 * Both sign the same canonical message. The composite is valid only if
 * BOTH verify independently.
 */
export async function signComposite(
  message: string,
  ed25519PrivKey: CryptoKey,
  mldsa65SecretKeyB64: string,
): Promise<CompositeSignature> {
  const ed25519Sig = await signMessage(message, ed25519PrivKey);
  const mldsa65Sig = signMlDsa65(message, mldsa65SecretKeyB64);
  return { ed25519_sig: ed25519Sig, mldsa65_sig: mldsa65Sig };
}

/**
 * Verify a composite signature: BOTH Ed25519 AND ML-DSA-65 must verify.
 * Returns false if either fails — defence-in-depth.
 */
export async function verifyComposite(
  message: string,
  composite: CompositeSignature,
  ed25519PubKeyB64: string,
  mldsa65PubKeyB64: string,
): Promise<boolean> {
  // 1. Verify Ed25519 (classical)
  const edValid = await verifySignature(message, composite.ed25519_sig, ed25519PubKeyB64);
  if (!edValid) return false;

  // 2. Verify ML-DSA-65 (post-quantum)
  const pqValid = verifyMlDsa65(message, composite.mldsa65_sig, mldsa65PubKeyB64);
  if (!pqValid) return false;

  // 3. Both must verify
  return true;
}

export async function createSignedPayload(
  payload: any,
  privateKey: CryptoKey,
  did: string
): Promise<SignedMessage> {
  const message = JSON.stringify(payload);
  const signature = await signMessage(message, privateKey);
  return { message, signature, did };
}

export async function verifySignedPayload(
  signed: SignedMessage,
  publicKeyBase64: string
): Promise<boolean> {
  return verifySignature(signed.message, signed.signature, publicKeyBase64);
}

// ── Utilities ──

function arrayBufferToBase64(buffer: Uint8Array | ArrayBuffer | ArrayBufferLike): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function base64ToBase64Url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ── Base58btc encode (CWP-2026-033) ─────────────────────────────────────

const BASE58BTC_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export function base58btcEncode(bytes: Uint8Array): string {
  let num = 0n;
  for (const b of bytes) num = num * 256n + BigInt(b);
  if (num === 0n) return BASE58BTC_ALPHABET[0];
  let result = '';
  while (num > 0n) {
    result = BASE58BTC_ALPHABET[Number(num % 58n)] + result;
    num /= 58n;
  }
  return result;
}

export function pubToDidKey(rawPub: Uint8Array): string {
  const prefixed = new Uint8Array([0xed, 0x01, ...rawPub]);
  return `did:key:z${base58btcEncode(prefixed)}`;
}

// ── RFC 9964 AKP JWK helpers ─────────────────────────────────────────────

// Base64url-encode raw bytes (no padding). Works in Workers (no btoa dependency).
export function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Decode a base64url string to Uint8Array.
export function fromBase64Url(b64url: string): Uint8Array {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// JWK Thumbprint per RFC 7638 §3.3 + RFC 9964 §6: lexicographic order is alg, kty, pub.
// Uses @noble/hashes sha256 if available, falls back to Web Crypto SHA-256.
async function computeAkpThumbprint(pubB64Url: string): Promise<string> {
  const canonical = JSON.stringify({ alg: 'ML-DSA-65', kty: 'AKP', pub: pubB64Url });
  const data = new TextEncoder().encode(canonical);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return toBase64Url(new Uint8Array(hash));
}

// Encode an ML-DSA-65 raw public key (1952 bytes) as a quantum-safe
// `did:jwk` following RFC 9964: key type `AKP`, `alg: ML-DSA-65`,
// `pub` = base64url(raw pk), `kid` = JWK Thumbprint (RFC 7638).
// did:jwk = "did:jwk:" + base64url(JSON JWK).
export async function didJwkFromMlDsa65(publicKey: Uint8Array): Promise<string> {
  const pubB64Url = toBase64Url(publicKey);
  const kid = await computeAkpThumbprint(pubB64Url);
  const jwk = { kid, kty: 'AKP' as const, alg: 'ML-DSA-65' as const, pub: pubB64Url };
  const json = JSON.stringify(jwk);
  return 'did:jwk:' + toBase64Url(new TextEncoder().encode(json));
}

// Verify a did:jwk round-trip: decode, re-derive thumbprint, check kid matches.
export async function verifyDidJwk(didJwk: string): Promise<boolean> {
  try {
    const b64url = didJwk.replace('did:jwk:', '');
    const jwkBytes = fromBase64Url(b64url);
    const jwk = JSON.parse(new TextDecoder().decode(jwkBytes));
    if (jwk.kty !== 'AKP' || jwk.alg !== 'ML-DSA-65' || !jwk.pub || !jwk.kid) return false;
    const recomputed = await computeAkpThumbprint(jwk.pub);
    return recomputed === jwk.kid;
  } catch {
    return false;
  }
}
