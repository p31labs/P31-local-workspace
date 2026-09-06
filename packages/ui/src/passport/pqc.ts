/**
 * @file pqc.ts — ML-DSA-65 (FIPS 204) post-quantum identity generation.
 * Uses @noble/post-quantum for keygen. Stores in IndexedDB alongside Ed25519.
 */

import { ml_dsa65 } from '@noble/post-quantum/ml-dsa';

export interface MLDSA65Identity {
  did: string;
  publicKey: Uint8Array;
  secretKey: Uint8Array;
  created: string;
}

function bs58Encode(buf: Uint8Array): string {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = BigInt('0x' + Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join(''));
  let result = '';
  while (num > 0n) {
    result = ALPHABET[Number(num % 58n)] + result;
    num /= 58n;
  }
  for (const b of buf) { if (b === 0) result = '1' + result; else break; }
  return result;
}

export async function generateMLDSA65Identity(): Promise<MLDSA65Identity> {
  const keyPair = await ml_dsa65.keygen();

  // multicodec prefix for ML-DSA-65 public key (0x1305 = 4869 in decimal, provisional)
  const multicodec = new Uint8Array([0x13, 0x05]);
  const raw = new Uint8Array(multicodec.length + keyPair.publicKey.length);
  raw.set(multicodec, 0);
  raw.set(keyPair.publicKey, multicodec.length);

  const did = `did:key:z${bs58Encode(raw)}`;

  const store = openPQStore();
  await store('put', { did, publicKey: keyPair.publicKey, secretKey: keyPair.secretKey, created: new Date().toISOString() });

  return { did, publicKey: keyPair.publicKey, secretKey: keyPair.secretKey, created: new Date().toISOString() };
}

export async function loadMLDSA65Identity(): Promise<MLDSA65Identity | null> {
  const store = openPQStore();
  return store('get');
}

export async function clearMLDSA65Identity(): Promise<void> {
  const store = openPQStore();
  return store('clear');
}

function openPQStore() {
  return (op: string, data?: any): any => {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('p31-passport', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('pq_keys')) db.createObjectStore('pq_keys');
      };
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction('pq_keys', op === 'get' || op === 'clear' ? 'readwrite' : 'readwrite');
        const store = tx.objectStore('pq_keys');
        if (op === 'put') {
          store.put(data, 'current');
          tx.oncomplete = () => resolve(undefined);
        } else if (op === 'get') {
          const r = store.get('current');
          r.onsuccess = () => resolve(r.result || null);
          r.onerror = () => reject(r.error);
        } else if (op === 'clear') {
          store.clear();
          tx.oncomplete = () => resolve(undefined);
        }
      };
      req.onerror = () => reject(req.error);
    });
  };
}
