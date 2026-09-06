/**
 * X3DH Helper — Ephemeral key exchange for 2-party handover
 *
 * Uses Web Crypto API (X25519) to derive a shared secret.
 */

export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'X25519' },
    true,
    ['deriveKey']
  );
}

export async function exportPublicKey(key: CryptoKey): Promise<Uint8Array> {
  const raw = await crypto.subtle.exportKey('raw', key);
  return new Uint8Array(raw);
}

export async function importPublicKey(raw: Uint8Array): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'raw',
    raw,
    { name: 'ECDH', namedCurve: 'X25519' },
    false,
    []
  );
}

export async function computeSharedSecret(
  privateKey: CryptoKey,
  remotePublicKey: Uint8Array
): Promise<CryptoKey> {
  const remoteKey = await importPublicKey(remotePublicKey);
  return await crypto.subtle.deriveKey(
    { name: 'ECDH', public: remoteKey },
    privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}
