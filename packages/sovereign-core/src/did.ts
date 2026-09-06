const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Encode(bytes: Uint8Array): string {
  const num = BigInt(0);
  let value = 0n;
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8n) | BigInt(bytes[i]);
  }
  let encoded = '';
  while (value > 0n) {
    const mod = value % 58n;
    encoded = BASE58_ALPHABET[Number(mod)] + encoded;
    value = value / 58n;
  }
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    encoded = '1' + encoded;
  }
  return encoded || '1';
}

export async function generateDidKey(): Promise<string> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'Ed25519' },
    true,
    ['sign', 'verify']
  );
  const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const publicKeyBytes = new Uint8Array(publicKeyBuffer);
  const rawKeyBytes = publicKeyBytes.slice(publicKeyBytes.length - 32);
  const prefixedKey = new Uint8Array([0xed, 0x01, ...rawKeyBytes]);
  const publicKeyBase58 = base58Encode(prefixedKey);

  const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  localStorage.setItem('willow:did:key', JSON.stringify({
    publicKey: btoa(String.fromCharCode(...publicKeyBytes)),
    privateKey: btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer))),
  }));

  return `did:key:z${publicKeyBase58}`;
}

export async function getOrCreateDid(): Promise<string> {
  const STORAGE_KEY = 'willow:did';
  let did = localStorage.getItem(STORAGE_KEY);
  if (!did) {
    did = await generateDidKey();
    localStorage.setItem(STORAGE_KEY, did);
  }
  return did;
}

export async function signWithDid(did: string, message: string): Promise<string | null> {
  try {
    const keyData = localStorage.getItem('willow:did:key');
    if (!keyData) return null;
    const keyPair = JSON.parse(keyData) as CryptoKeyPair;
    const encoder = new TextEncoder();
    const signature = await crypto.subtle.sign(
      { name: 'Ed25519' },
      keyPair.privateKey,
      encoder.encode(message)
    );
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  } catch {
    return null;
  }
}

export async function exportKeyPair(): Promise<CryptoKeyPair | null> {
  try {
    const keyData = localStorage.getItem('willow:did:key');
    if (!keyData) return null;
    return JSON.parse(keyData) as CryptoKeyPair;
  } catch {
    return null;
  }
}

export async function storeKeyPair(keyPair: CryptoKeyPair): Promise<void> {
  const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  const stored = {
    publicKey: btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer))),
    privateKey: btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer))),
  };
  localStorage.setItem('willow:did:key', JSON.stringify(stored));
}
