/**
 * @file identity — Sovereign Ed25519 identity + did:key derivation.
 *
 * Ported from `packages/spaceship-earth/src/services/genesisIdentity.ts`
 * (proven, real Web Crypto Ed25519 + inline bs58 + multicodec 0xed01).
 *
 * Differences from genesisIdentity:
 *  - No module-level singleton; returns plain data objects so it is safe to
 *    call from any app (phos/willow/astro) and SSR-guarded.
 *  - Stores keys as JWK strings (JSON-serializable) so the caller can persist
 *    them however they like (IndexedDB, idb-keyval, etc.).
 *  - Public key is exported as raw bytes → base64url (matches passport schema).
 *
 * Security note: extractable keys, plaintext at rest. Threat model = locked
 * device. For higher assurance, wrap with OS-level encryption before persist.
 */

const BS58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function bs58Encode(bytes: Uint8Array): string {
  const digits = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let out = '';
  for (const byte of bytes) {
    if (byte !== 0) break;
    out += BS58_ALPHABET[0];
  }
  for (let i = digits.length - 1; i >= 0; i--) {
    out += BS58_ALPHABET[digits[i]];
  }
  return out;
}

const ED25519_PREFIX = new Uint8Array([0xed, 0x01]);

export function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export interface Ed25519Identity {
  /** W3C did:key method, self-certifying. */
  did: string;
  /** Base64url-encoded 32-byte Ed25519 public key (matches passport schema). */
  publicKey: string;
  /** Private key as JWK string (extractable by design — sovereignty needs portability). */
  privateKeyJwk: JsonWebKey;
  /** Public key as JWK string. */
  publicKeyJwk: JsonWebKey;
}

/**
 * Generate a brand-new Ed25519 identity and derive its did:key.
 * Runs entirely in the browser via Web Crypto. No network.
 */
export async function generateEd25519Identity(): Promise<Ed25519Identity> {
  const keypair = await crypto.subtle.generateKey(
    { name: 'Ed25519' },
    true,
    ['sign', 'verify'],
  );

  const rawPub = new Uint8Array(await crypto.subtle.exportKey('raw', keypair.publicKey));
  const prefixed = new Uint8Array(ED25519_PREFIX.length + rawPub.length);
  prefixed.set(ED25519_PREFIX, 0);
  prefixed.set(rawPub, ED25519_PREFIX.length);
  const did = `did:key:z${bs58Encode(prefixed)}`;

  const privateKeyJwk = await crypto.subtle.exportKey('jwk', keypair.privateKey);
  const publicKeyJwk = await crypto.subtle.exportKey('jwk', keypair.publicKey);

  return {
    did,
    publicKey: bytesToBase64Url(rawPub),
    privateKeyJwk,
    publicKeyJwk,
  };
}

/**
 * Re-derive the public identity (did + publicKey) from a stored private JWK.
 */
export async function identityFromPrivateJwk(jwk: JsonWebKey): Promise<Ed25519Identity> {
  const pubJwk: JsonWebKey = { ...jwk, d: undefined, key_ops: ['verify'] };
  const publicKey = await crypto.subtle.importKey('jwk', pubJwk, { name: 'Ed25519' }, true, ['verify']);

  const rawPub = new Uint8Array(await crypto.subtle.exportKey('raw', publicKey));
  const prefixed = new Uint8Array(ED25519_PREFIX.length + rawPub.length);
  prefixed.set(ED25519_PREFIX, 0);
  prefixed.set(rawPub, ED25519_PREFIX.length);
  const did = `did:key:z${bs58Encode(prefixed)}`;

  return {
    did,
    publicKey: bytesToBase64Url(rawPub),
    privateKeyJwk: jwk,
    publicKeyJwk: pubJwk,
  };
}

/**
 * Sign arbitrary data with a private JWK. Returns raw signature bytes.
 */
export async function signWithJwk(jwk: JsonWebKey, data: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'Ed25519' }, false, ['sign']);
  const sig = await crypto.subtle.sign('Ed25519', key, data as BufferSource);
  return new Uint8Array(sig);
}
