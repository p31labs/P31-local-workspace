/**
 * SpIn Mesh — X3DH Double‑Blind Handshake
 *
 * Generates ephemeral X25519 key pairs, performs a three‑way Diffie‑Hellman
 * exchange brokered by the Matchmaking DO, and derives a shared group secret.
 *
 * Upon `handover_complete` event, the DO destroys the secret and chat history
 * (double‑blind: parties never learn persistent identity of each other).
 */

export interface KeyPair {
  publicKey: Uint8Array;   // 32 B X25519
  privateKey: Uint8Array;  // 32 B
}

export function generateKeyPair(): KeyPair {
  // Web Crypto: X25519 key pair (ephemeral)
  return crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'X25519' },
    true,
    ['deriveKey']
  ).then(async key => {
    const pub = await crypto.subtle.exportKey('raw', key.publicKey as CryptoKey);
    const priv = await crypto.subtle.exportKey('raw', key.privateKey as CryptoKey);
    return { publicKey: new Uint8Array(pub), privateKey: new Uint8Array(priv) };
  }) as Promise<KeyPair>;
}

/**
 * Compute shared secret from own private key and remote public key.
 */
export async function computeSharedSecret(privateKey: Uint8Array, remotePublicKey: Uint8Array): Promise<CryptoKey> {
  const importedPub = await crypto.subtle.importKey(
    'raw',
    remotePublicKey,
    { name: 'ECDH', namedCurve: 'X25519' },
    false,
    []
  );
  const importedPriv = await crypto.subtle.importKey(
    'raw',
    privateKey,
    { name: 'ECDH', namedCurve: 'X25519' },
    true,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'ECDH', public: importedPub },
    importedPriv,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Derive a symmetric group secret from pairwise shared secrets (3‑party).
 * Uses HKDF‑SHA256 to combine keys.
 */
export async function deriveGroupSecret(sharedSecrets: CryptoKey[]): Promise<CryptoKey> {
  // Concatenate raw keys to form HKDF input
  const raw = await Promise.all(sharedSecrets.map(k => crypto.subtle.exportKey('raw', k)));
  const concatenated = new Uint8Array(raw.reduce((sum, arr) => sum + arr.length, 0));
  let offset = 0;
  for (const arr of raw) {
    concatenated.set(new Uint8Array(arr), offset);
    offset += arr.length;
  }

  const base = await crypto.subtle.importKey(
    'raw',
    concatenated,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', info: new TextEncoder().encode('spin-group-secret') },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * After successful handover, instruct DO to destroy secret and chat history.
 */
export async function destroyHandover(doUrl: string, handoverId: string): Promise<void> {
  await fetch(`${doUrl}/handover/${handoverId}/destroy`, { method: 'POST' });
}
