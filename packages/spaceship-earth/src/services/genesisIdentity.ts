/**
 * @file genesisIdentity — Persistent Ed25519 identity backed by IndexedDB.
 *
 * Key derivation:
 *   Uses the Web Crypto API (`crypto.subtle`) with the Ed25519 algorithm.
 *   - `generateKey()` — creates a new extractable Ed25519 keypair
 *   - Private key is stored as JWK in IndexedDB (DB: "p31-genesis", store: "keys")
 *   - Public key is exported as raw bytes and encoded as a DID
 *
 * DID format:
 *   `did:key:z6Mk...` — W3C DID Key Method v0.7
 *   Encoding: raw 32-byte Ed25519 public key prefixed with multicodec varint 0xed01,
 *   then base58btc-encoded (bs58) and prefixed with `z` (multibase prefix for base58btc).
 *   Example: did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK
 *
 * bs58 implementation:
 *   Inline minimal encoder/decoder (no external dependency) using the standard
 *   Bitcoin base58 alphabet: 123456789ABC...XYZ abc...xyz (no 0, O, I, l).
 *
 * Cross-device portability:
 *   `exportIdentityJWK()` — returns the private key as a JWK string for backup
 *   `importIdentityJWK()` — restores a keypair from a JWK string
 *   Workflow: operator exports JWK on device A → imports on device B → same DID
 *
 * Security note:
 *   Keys are `extractable: true` by design — sovereignty requires portability.
 *   IndexedDB is not encrypted at the OS level; the threat model assumes physical
 *   device security (locked tablet). For higher assurance, see VaultRoom AES-256.
 */

// ── Minimal BS58 encoder/decoder (avoids external dep) ──

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
  // Leading zeros
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

function bs58Decode(str: string): Uint8Array {
  const bytes = [0];
  for (const char of str) {
    const idx = BS58_ALPHABET.indexOf(char);
    if (idx === -1) throw new Error(`Invalid BS58 char: ${char}`);
    let carry = idx;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  // Leading ones (bs58 '1' = leading zero byte)
  const leadingOnes = str.match(/^1*/)?.[0].length ?? 0;
  const result = new Uint8Array(leadingOnes + bytes.length);
  // Leading zeros already zeroed
  for (let i = 0; i < bytes.length; i++) {
    result[leadingOnes + bytes.length - 1 - i] = bytes[i];
  }
  return result;
}

// ── Multicodec prefix for Ed25519 public key ──
const ED25519_PREFIX = new Uint8Array([0xed, 0x01]);

// ── IndexedDB helpers ──

const DB_NAME = 'p31-genesis';
const STORE_NAME = 'keys';
const KEY_ID = 'identity';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGet<T>(db: IDBDatabase, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

function idbPut(db: IDBDatabase, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ── Identity state ──

interface StoredIdentity {
  privateKeyJWK: JsonWebKey;
  publicKeyJWK: JsonWebKey;
  did: string;
}

let _privateKey: CryptoKey | null = null;
let _publicKey: CryptoKey | null = null;
let _did: string | null = null;

// ── Public API ──

/**
 * Boot the genesis identity. Loads from IndexedDB if exists, generates new if not.
 * Returns the DID string.
 */
export async function boot(): Promise<string> {
  const db = await openDB();

  // Try loading existing identity
  const stored = await idbGet<StoredIdentity>(db, KEY_ID);
  if (stored) {
    _privateKey = await crypto.subtle.importKey(
      'jwk', stored.privateKeyJWK,
      { name: 'Ed25519' }, true, ['sign'],
    );
    _publicKey = await crypto.subtle.importKey(
      'jwk', stored.publicKeyJWK,
      { name: 'Ed25519' }, true, ['verify'],
    );
    _did = stored.did;
    db.close();
    console.log('[GenesisIdentity] loaded from IndexedDB:', _did);
    return _did;
  }

  // Generate new Ed25519 keypair (extractable for persistence)
  const keypair = await crypto.subtle.generateKey(
    { name: 'Ed25519' }, true, ['sign', 'verify'],
  );
  _privateKey = keypair.privateKey;
  _publicKey = keypair.publicKey;

  // Derive DID from public key
  const rawPub = new Uint8Array(await crypto.subtle.exportKey('raw', _publicKey));
  const prefixed = new Uint8Array(ED25519_PREFIX.length + rawPub.length);
  prefixed.set(ED25519_PREFIX, 0);
  prefixed.set(rawPub, ED25519_PREFIX.length);
  _did = `did:key:z${bs58Encode(prefixed)}`;

  // Persist to IndexedDB
  const privateKeyJWK = await crypto.subtle.exportKey('jwk', _privateKey);
  const publicKeyJWK = await crypto.subtle.exportKey('jwk', _publicKey);
  await idbPut(db, KEY_ID, { privateKeyJWK, publicKeyJWK, did: _did } satisfies StoredIdentity);
  db.close();

  console.log('[GenesisIdentity] generated new identity:', _did);
  return _did;
}

/**
 * Sign arbitrary data with the local private key.
 * Returns raw signature bytes.
 */
export async function sign(data: Uint8Array): Promise<Uint8Array> {
  if (!_privateKey) throw new Error('GenesisIdentity not booted');
  const sig = await crypto.subtle.sign('Ed25519', _privateKey, data as BufferSource);
  return new Uint8Array(sig);
}

/**
 * Get the current DID string. Throws if not booted.
 */
export function getDID(): string {
  if (!_did) throw new Error('GenesisIdentity not booted');
  return _did;
}

/**
 * Export the private key as JWK (for cross-device transfer).
 */
export async function exportKeyJWK(): Promise<JsonWebKey> {
  if (!_privateKey) throw new Error('GenesisIdentity not booted');
  return crypto.subtle.exportKey('jwk', _privateKey);
}

/**
 * Import a private key JWK, re-derive public key + DID, persist to IndexedDB.
 */
export async function importKeyJWK(jwk: JsonWebKey): Promise<string> {
  _privateKey = await crypto.subtle.importKey(
    'jwk', jwk, { name: 'Ed25519' }, true, ['sign'],
  );

  // Derive public key from private: re-import as keypair by exporting the
  // private JWK which includes the public component
  const pubJwk = { ...jwk, d: undefined, key_ops: ['verify'] };
  _publicKey = await crypto.subtle.importKey(
    'jwk', pubJwk, { name: 'Ed25519' }, true, ['verify'],
  );

  const rawPub = new Uint8Array(await crypto.subtle.exportKey('raw', _publicKey));
  const prefixed = new Uint8Array(ED25519_PREFIX.length + rawPub.length);
  prefixed.set(ED25519_PREFIX, 0);
  prefixed.set(rawPub, ED25519_PREFIX.length);
  _did = `did:key:z${bs58Encode(prefixed)}`;

  // Persist
  const db = await openDB();
  const privateKeyJWK = await crypto.subtle.exportKey('jwk', _privateKey);
  const publicKeyJWK = await crypto.subtle.exportKey('jwk', _publicKey);
  await idbPut(db, KEY_ID, { privateKeyJWK, publicKeyJWK, did: _did } satisfies StoredIdentity);
  db.close();

  console.log('[GenesisIdentity] imported key, DID:', _did);
  return _did;
}

// ── Utility: hex encode/decode ──

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// ── Utility: Extract public key bytes from a did:key DID ──

export function didToPublicKeyBytes(did: string): Uint8Array {
  if (!did.startsWith('did:key:z')) {
    throw new Error('Invalid DID format: must start with did:key:z');
  }
  const encoded = did.slice('did:key:z'.length);
  const decoded = bs58Decode(encoded);
  // Strip 0xed01 prefix
  if (decoded[0] !== 0xed || decoded[1] !== 0x01) {
    throw new Error('Invalid DID: not an Ed25519 public key');
  }
  return decoded.slice(2);
}
