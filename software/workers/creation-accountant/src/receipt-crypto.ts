// Ed25519 receipt signing + D1 retry helpers for the CreationAccountant.
// Web Crypto only (Cloudflare Workers + Node webcrypto both support Ed25519).
// NOTE: GNU Taler Clause Blind Schnorr is deferred — this is plain Ed25519
// DID-attestation of the receipt payload (non-repudiation), not blind issuance.

function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// Sign a canonical receipt string with the worker's PKCS#8 Ed25519 private key.
export async function signReceipt(message: string, privateKeyPkcs8: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyPkcs8,
    { name: 'Ed25519' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('Ed25519', key, new TextEncoder().encode(message));
  return new Uint8Array(sig);
}

// Verify a receipt signature against the worker's SPKI Ed25519 public key.
export async function verifyReceipt(message: string, signature: Uint8Array, publicKeySpki: Uint8Array): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      'spki',
      publicKeySpki,
      { name: 'Ed25519' },
      false,
      ['verify'],
    );
    return await crypto.subtle.verify('Ed25519', key, signature, new TextEncoder().encode(message));
  } catch {
    return false;
  }
}

// Exponential backoff for transient D1 locks (matches love-ledger's withRetry).
export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, 100 * Math.pow(2, i)));
      }
    }
  }
  throw lastErr;
}

export { bytesToBase64, base64ToBytes };
