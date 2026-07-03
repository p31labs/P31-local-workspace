import { persistentMap } from '@nanostores/persistent';
import { generateKeypair, type Keypair } from '../lib/crypto';
import { saveKey, loadKey, deleteKey, hasKey } from '../lib/keyVault';

export interface IdentityState {
  did: string;
  displayName: string;
  publicKey: string;
  isRegistered: 'true' | 'false';
  joinedAt: string;
  keysGenerated: 'true' | 'false';
  [key: string]: string | undefined;
}

export const identityStore = persistentMap<IdentityState>('phos:identity:', {
  did: '',
  displayName: '',
  publicKey: '',
  isRegistered: 'false',
  joinedAt: '',
  keysGenerated: 'false',
});

let privateKeyCache: CryptoKey | null = null;
let cacheInitialized = false;

export async function loadPrivateKey(): Promise<CryptoKey | null> {
  if (privateKeyCache) return privateKeyCache;
  if (cacheInitialized) {
    // Cache was checked but empty — try one more time in case key was stored after first check
    privateKeyCache = await loadKey();
    if (privateKeyCache) cacheInitialized = true;
    return privateKeyCache;
  }
  cacheInitialized = true;
  privateKeyCache = await loadKey();
  return privateKeyCache;
}

export function getPrivateKey(): CryptoKey | null {
  return privateKeyCache;
}

export function isValidDID(did: string | null | undefined): boolean {
  return typeof did === 'string' && did.startsWith('did:key:');
}

export function ensurePrivateKey(): CryptoKey {
  if (!privateKeyCache) {
    throw new Error('No private key available — complete the Abdication Ritual first');
  }
  return privateKeyCache;
}

export function hasPrivateKey(): boolean {
  return privateKeyCache !== null;
}

export async function generateAndStoreIdentity(displayName: string): Promise<void> {
  const keypair = await generateKeypair();
  await saveKey(keypair.privateKey);
  privateKeyCache = keypair.privateKey;
  cacheInitialized = true;

  identityStore.set({
    did: keypair.did,
    displayName,
    publicKey: keypair.publicKey,
    isRegistered: 'true',
    joinedAt: new Date().toISOString(),
    keysGenerated: 'true',
  });
}

export async function clearIdentity(): Promise<void> {
  await deleteKey();
  privateKeyCache = null;
  cacheInitialized = false;
  identityStore.set({
    did: '',
    displayName: '',
    publicKey: '',
    isRegistered: 'false',
    joinedAt: '',
    keysGenerated: 'false',
  });
}

export function getIdentityState(): IdentityState {
  return identityStore.get();
}

export async function isSovereign(): Promise<boolean> {
  const state = identityStore.get();
  if (state.isRegistered !== 'true') return false;
  if (state.keysGenerated !== 'true') return false;
  return await hasKey();
}
