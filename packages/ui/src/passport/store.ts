/**
 * @file store — IndexedDB persistence for the Cognitive Passport bundle.
 *
 * Uses RAW IndexedDB (no idb-keyval dependency) to match the proven pattern in
 * `packages/spaceship-earth/src/services/genesisIdentity.ts`. Stores two
 * records: the Ed25519 private key (JWK) and the passport content document.
 *
 * Sovereign, local-first: no network. Each app origin has its own store; port
 * a passport across apps via `exportBundle()` / `importBundle()`.
 */

import type { CognitivePassport } from './schema';
import type { Ed25519Identity } from './identity';

const DB_NAME = 'p31-passport';
const STORE = 'data';
const KEY_IDENTITY = 'identity';
const KEY_PASSPORT = 'passport';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGet<T>(db: IDBDatabase, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

function idbPut(db: IDBDatabase, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function idbDelete(db: IDBDatabase, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export interface StoredIdentity {
  did: string;
  publicKey: string;
  privateKeyJwk: JsonWebKey;
  publicKeyJwk: JsonWebKey;
}

/** Save the cryptographic identity (private key) to IndexedDB. */
export async function saveIdentity(identity: Ed25519Identity): Promise<void> {
  const db = await openDB();
  const stored: StoredIdentity = {
    did: identity.did,
    publicKey: identity.publicKey,
    privateKeyJwk: identity.privateKeyJwk,
    publicKeyJwk: identity.publicKeyJwk,
  };
  await idbPut(db, KEY_IDENTITY, stored);
  db.close();
}

/** Load the stored identity, or null if none exists. */
export async function loadIdentity(): Promise<StoredIdentity | null> {
  const db = await openDB();
  const stored = await idbGet<StoredIdentity>(db, KEY_IDENTITY);
  db.close();
  return stored ?? null;
}

/** Save the passport content document. */
export async function savePassport(passport: CognitivePassport): Promise<void> {
  const db = await openDB();
  await idbPut(db, KEY_PASSPORT, { ...passport, updated: new Date().toISOString() });
  db.close();
}

/** Load the passport content, or null if none exists. */
export async function loadPassport(): Promise<CognitivePassport | null> {
  const db = await openDB();
  const p = await idbGet<CognitivePassport>(db, KEY_PASSPORT);
  db.close();
  return p ?? null;
}

export interface StoredBundle {
  identity: StoredIdentity;
  passport: CognitivePassport;
}

/** Load the full bundle (identity + passport), or null. */
export async function loadBundle(): Promise<StoredBundle | null> {
  const [identity, passport] = await Promise.all([loadIdentity(), loadPassport()]);
  if (!identity || !passport) return null;
  return { identity, passport };
}

/** Export the full bundle as a portable JSON string (for cross-app import). */
export async function exportBundle(): Promise<string | null> {
  const bundle = await loadBundle();
  if (!bundle) return null;
  return JSON.stringify(bundle, null, 2);
}

/** Import a previously-exported bundle. Overwrites any existing local passport. */
export async function importBundle(json: string): Promise<StoredBundle> {
  const bundle = JSON.parse(json) as StoredBundle;
  if (!bundle?.identity?.did || !bundle?.passport) {
    throw new Error('Invalid passport bundle');
  }
  const db = await openDB();
  await idbPut(db, KEY_IDENTITY, bundle.identity);
  await idbPut(db, KEY_PASSPORT, bundle.passport);
  db.close();
  return bundle;
}

const KEY_CREDENTIALS = 'pqc_credentials';
const DB_VERSION = 2;

function openDBV2(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export interface StoredCredential {
  did: string;
  credential: Record<string, unknown>;
  issuedAt: string;
  algorithm: string;
}

export async function saveCredential(cred: StoredCredential): Promise<void> {
  const db = await openDBV2();
  const existing = (await idbGet<StoredCredential[]>(db, KEY_CREDENTIALS)) || [];
  existing.push(cred);
  await idbPut(db, KEY_CREDENTIALS, existing);
  db.close();
}

export async function listCredentials(): Promise<StoredCredential[]> {
  const db = await openDBV2();
  const creds = await idbGet<StoredCredential[]>(db, KEY_CREDENTIALS);
  db.close();
  return creds || [];
}

/** Wipe all local passport data (identity + content). Irreversible. */
export async function clearPassport(): Promise<void> {
  const db = await openDB();
  await idbDelete(db, KEY_IDENTITY);
  await idbDelete(db, KEY_PASSPORT);
  await idbDelete(db, KEY_CREDENTIALS);
  db.close();
}
