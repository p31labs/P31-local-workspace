/**
 * SpIn Mesh — Joy Attestation Crypto
 *
 * Uses Web Crypto API (subtleCrypto) to derive symmetric keys from item UUIDs
 * and encrypt/decrypt care narratives. Identity‑stripping: the key is derived
 * solely from the resource UUID; no persistent identity is used.
 */

export type JoyAttestation = {
  nonce: Uint8Array;     // 12‑byte GCM nonce
  ciphertext: Uint8Array; // encrypted blob
};

export async function deriveKey(uuid: string): Promise<CryptoKey> {
  // HKDF‑SHA256, salt = UTF‑8 UUID bytes, info = "joy-attestation"
  const enc = new TextEncoder();
  const salt = enc.encode(uuid);
  const info = enc.encode('joy-attestation');

  // Import salt as raw key material for HKDF
  const baseKey = await crypto.subtle.importKey(
    'raw',
    salt,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt,
      info
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptAttestation(uuid: string, plaintext: string, key?: CryptoKey): Promise<JoyAttestation> {
  const actualKey = key ?? await deriveKey(uuid);
  const enc = new TextEncoder();
  const data = enc.encode(plaintext);

  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    actualKey,
    data
  );

  return { nonce, ciphertext: new Uint8Array(ciphertext) };
}

export async function decryptAttestation(uuid: string, nonce: Uint8Array, ciphertext: Uint8Array, key?: CryptoKey): Promise<string> {
  const actualKey = key ?? await deriveKey(uuid);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: nonce },
    actualKey,
    ciphertext
  );
  const dec = new TextDecoder();
  return dec.decode(plaintext);
}

// Utility: encode attestation for storage (nonce || ciphertext) → base64 string
export function encodeAttestation(att: JoyAttestation): string {
  // Concatenate nonce + ciphertext, then base64url encode
  const combined = new Uint8Array(att.nonce.length + att.ciphertext.length);
  combined.set(att.nonce, 0);
  combined.set(att.ciphertext, att.nonce.length);
  return btoa(String.fromCharCode(...combined))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Utility: decode base64url string back to {nonce, ciphertext}
export function decodeAttestation(encoded: string): JoyAttestation {
  // base64url → base64
  const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - b64.length % 4) % 4);
  const binary = Uint8Array.from(atob(padded), c => c.charCodeAt(0));
  const nonce = binary.slice(0, 12);
  const ciphertext = binary.slice(12);
  return { nonce, ciphertext };
}
