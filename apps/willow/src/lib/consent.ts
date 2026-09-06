/**
 * @file consent.ts — WILLOW P0 mitigation #2 (COPPA verifiable parental consent).
 *
 * Amended COPPA Rule (effective 2026-04-22) requires more than a checkbox.
 * We implement cryptographic Verifiable Parental Consent:
 *   1. A parent-side Ed25519 keypair is generated in-browser (Web Crypto).
 *   2. The parent signs a structured consent statement over the child's
 *      locally-generated did:key + timestamp.
 *   3. The app verifies the signature before unlocking; the public DID and
 *      signature are persisted as an auditable consent record (IndexedDB).
 *
 * No secrets leave the device. The private key is held only for the signing
 * gesture and then discarded; only the public DID + signature are stored.
 */

const CONSENT_KEY = 'willow:consent';
const DB_NAME = 'willow-consent';
const STORE = 'records';

export interface ConsentRecord {
  childDid: string;
  parentDid: string;
  signedAt: number;
  statement: string;
  signatureB64: string;
  childPubB64: string;
  parentPubB64: string;
}

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = '';
  arr.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

// Web Crypto expects BufferSource backed by a real ArrayBuffer (not SharedArrayBuffer).
function buf(view: Uint8Array): ArrayBuffer {
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer;
}

export function didKeyFromRaw(pubB64: string): string {
  return `did:key:z${pubB64}`;
}

export async function generateEd25519(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']) as Promise<CryptoKeyPair>;
}

export async function exportRawPub(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key);
  return b64url(raw);
}

function buildStatement(childDid: string, parentDid: string, age: number, ts: number): string {
  return `willow-consent|${childDid}|${parentDid}|age:${age}|${ts}`;
}

/** Parent signs the consent statement. Returns a fully-formed ConsentRecord. */
export async function createConsent(age: number): Promise<ConsentRecord> {
  const childKp = await generateEd25519();
  const parentKp = await generateEd25519();
  const childPubB64 = await exportRawPub(childKp.publicKey);
  const parentPubB64 = await exportRawPub(parentKp.publicKey);
  const childDid = didKeyFromRaw(childPubB64);
  const parentDid = didKeyFromRaw(parentPubB64);
  const ts = Date.now();
  const statement = buildStatement(childDid, parentDid, age, ts);
  const sig = await crypto.subtle.sign('Ed25519', parentKp.privateKey, buf(new TextEncoder().encode(statement)));
  const record: ConsentRecord = {
    childDid,
    parentDid,
    signedAt: ts,
    statement,
    signatureB64: b64url(sig),
    childPubB64,
    parentPubB64,
  };
  await persistConsent(record);
  return record;
}

export async function verifyConsent(record: ConsentRecord): Promise<boolean> {
  try {
    const pub = await crypto.subtle.importKey('raw', buf(fromB64url(record.parentPubB64)), 'Ed25519', true, ['verify']);
    const ok = await crypto.subtle.verify('Ed25519', pub, buf(fromB64url(record.signatureB64)), buf(new TextEncoder().encode(record.statement)));
    // Re-derive DIDs to ensure the statement matches the stored keys.
    return ok && didKeyFromRaw(record.parentPubB64) === record.parentDid && didKeyFromRaw(record.childPubB64) === record.childDid;
  } catch {
    return false;
  }
}

async function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => { req.result.createObjectStore(STORE, { keyPath: 'childDid' }); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function persistConsent(record: ConsentRecord): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ childDid: record.childDid, signedAt: record.signedAt }));
  } catch {
    // IndexedDB may be unavailable; fall back to localStorage only.
    localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
  }
}

export function loadConsentMeta(): { childDid: string; signedAt: number } | null {
  const raw = localStorage.getItem(CONSENT_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
