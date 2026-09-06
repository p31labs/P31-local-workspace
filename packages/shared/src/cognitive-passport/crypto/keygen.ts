import { generateEd25519Keypair, type P31Keypair } from './sign';
export type { P31Keypair };

export function exportPublicKey(keypair: P31Keypair): string {
  const bytes = Array.from(new Uint8Array(keypair.publicKey));
  return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function exportPrivateKeyEncrypted(
  keypair: P31Keypair,
  passphrase: string,
): { encrypted: Uint8Array; salt: Uint8Array; iv: Uint8Array } {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const passphraseKey = deriveKey(passphrase, salt);

  const plaintext = encoder.encode(
    JSON.stringify({
      type: 'Ed25519',
      privateKey: Array.from(keypair.privateKey),
      publicKey: Array.from(keypair.publicKey),
      created_at: new Date().toISOString(),
    }),
  );

  const encrypted = encryptWithKey(passphraseKey, iv, plaintext);

  return { encrypted, salt, iv };
}

function deriveKey(passphrase: string, salt: Uint8Array): CryptoKey {
  throw new Error('Argon2id not available in this environment — use CLI keygen instead');
}

function encryptWithKey(_key: CryptoKey, _iv: Uint8Array, _plaintext: Uint8Array): Uint8Array {
  throw new Error('XChaCha20-Poly1305 not available in this environment');
}

export interface StoredKeypair {
  publicKeyHex: string;
  encryptedPrivateKey: string;
  saltHex: string;
  ivHex: string;
  created_at: string;
}

export async function generateKeypairCLI(): Promise<StoredKeypair> {
  const keypair = await generateEd25519Keypair();
  const publicKeyHex = exportPublicKey(keypair);
  return {
    publicKeyHex,
    encryptedPrivateKey: '',
    saltHex: '',
    ivHex: '',
    created_at: new Date().toISOString(),
  };
}
