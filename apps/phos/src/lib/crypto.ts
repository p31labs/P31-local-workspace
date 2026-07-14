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
  const did = `did:key:z${base64ToBase64Url(publicKeyBase64)}`;

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

// Encode an ML-DSA-65 raw public key (1952 bytes) as a quantum-safe
// `did:jwk` following IANA JOSE (RFC 9964): key type `AKP`, `alg: ML-DSA-65`,
// `pub` = base64url(raw pk). did:jwk = "did:jwk:" + base64url(JSON JWK).
export function didJwkFromMlDsa65(publicKey: Uint8Array): string {
  const toB64Url = (bytes: Uint8Array): string => {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return base64ToBase64Url(btoa(bin));
  };
  const jwk = { kty: 'AKP', alg: 'ML-DSA-65', pub: toB64Url(publicKey) };
  const json = JSON.stringify(jwk);
  return 'did:jwk:' + toB64Url(new TextEncoder().encode(json));
}
