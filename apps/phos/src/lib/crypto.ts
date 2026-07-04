/**
 * Sovereign Keymaster — Web Crypto Ed25519 with ECDSA P-256 Fallback
 * Zero telemetry. Zero server dependency.
 */

export interface Keypair {
  did: string;
  publicKey: string;
  privateKey: CryptoKey;
}

export interface SignedMessage {
  message: string;
  signature: string;
  did: string;
}

export async function generateKeypair(): Promise<Keypair> {
  try {
    return await generateEd25519();
  } catch (e) {
    console.warn('Ed25519 not supported, falling back to ECDSA P-256');
    return await generateECDSA();
  }
}

async function generateEd25519(): Promise<Keypair> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'Ed25519', namedCurve: 'Ed25519' } as any,
    true,
    ['sign', 'verify']
  );

  const publicKeyBytes = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  const publicKeyBase64 = arrayBufferToBase64(publicKeyBytes);
  const did = `did:key:z${base64ToBase64Url(publicKeyBase64)}`;

  return { did, publicKey: publicKeyBase64, privateKey: keyPair.privateKey };
}

async function generateECDSA(): Promise<Keypair> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  );

  const publicKeyBytes = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  const publicKeyBase64 = arrayBufferToBase64(publicKeyBytes);
  const did = `did:key:z${base64ToBase64Url(publicKeyBase64)}`;

  return { did, publicKey: publicKeyBase64, privateKey: keyPair.privateKey };
}

export async function signMessage(message: string, privateKey: CryptoKey): Promise<string> {
  const data = new TextEncoder().encode(message);
  const signature = await crypto.subtle.sign(
    { name: privateKey.algorithm.name } as any,
    privateKey,
    data
  );
  return arrayBufferToBase64(signature);
}

export async function verifySignature(
  message: string,
  signature: string,
  publicKeyBase64: string
): Promise<boolean> {
  try {
    const signatureBytes = base64ToArrayBuffer(signature);
    const publicKeyBytes = base64ToArrayBuffer(publicKeyBase64);
    const algorithmName = publicKeyBytes.byteLength === 32 ? 'Ed25519' : 'ECDSA';
    const namedCurve = algorithmName === 'Ed25519' ? undefined : 'P-256';

    const key = await crypto.subtle.importKey(
      'raw',
      publicKeyBytes,
      { name: algorithmName as 'Ed25519' | 'ECDSA', namedCurve } as any,
      false,
      ['verify']
    );

    const data = new TextEncoder().encode(message);
    return await crypto.subtle.verify(
      { name: algorithmName as 'Ed25519' | 'ECDSA', namedCurve } as any,
      key,
      signatureBytes,
      data
    );
  } catch {
    return false;
  }
}

export async function createSignedPayload(
  payload: any,
  privateKey: CryptoKey,
  did: string
): Promise<SignedMessage> {
  const message = JSON.stringify(payload);
  const signature = await signMessage(message, privateKey);
  return { message, signature, did };
}

export async function verifySignedPayload(
  signed: SignedMessage,
  publicKeyBase64: string
): Promise<boolean> {
  return verifySignature(signed.message, signed.signature, publicKeyBase64);
}

// ── Utilities ──

function arrayBufferToBase64(buffer: ArrayBuffer | ArrayBufferLike): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function base64ToBase64Url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
