export interface PassportSignature {
  ed25519: string | null;
  ml_dsa: string | null;
  key_fingerprint: string;
  signed_at: string;
}

export interface P31Keypair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export async function generateEd25519Keypair(): Promise<P31Keypair> {
  let ed25519: typeof import('@noble/ed25519');
  try {
    ed25519 = await import('@noble/ed25519');
  } catch {
    throw new Error('@noble/ed25519 not available — install it or use browser Web Crypto API fallback');
  }

  const privateKey = ed25519.utils.randomSecretKey();
  const publicKey = await ed25519.getPublicKeyAsync(privateKey);

  return { publicKey, privateKey };
}

export async function signPassport(
  payload: unknown,
  privateKey: Uint8Array,
  publicKey: Uint8Array,
): Promise<PassportSignature> {
  let ed25519: typeof import('@noble/ed25519');
  try {
    ed25519 = await import('@noble/ed25519');
  } catch {
    throw new Error('@noble/ed25519 not available');
  }

  const json = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const data = encoder.encode(json);

  const signature = await ed25519.signAsync(data, privateKey);
  const sigHex = Buffer.from(signature).toString('hex');
  const fpArray = Array.from(new Uint8Array(publicKey.slice(0, 8)));
  const keyFingerprint = fpArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return {
    ed25519: sigHex,
    ml_dsa: null,
    key_fingerprint: keyFingerprint,
    signed_at: new Date().toISOString(),
  };
}

export async function verifySignature(
  payload: unknown,
  signature: PassportSignature,
  publicKey: Uint8Array,
): Promise<boolean> {
  if (!signature.ed25519) {
    throw new Error('No Ed25519 signature to verify');
  }

  let ed25519: typeof import('@noble/ed25519');
  try {
    ed25519 = await import('@noble/ed25519');
  } catch {
    throw new Error('@noble/ed25519 not available');
  }

  const json = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const data = encoder.encode(json);

  const sigBytes = Uint8Array.from(Buffer.from(signature.ed25519, 'hex'));
  return await ed25519.verifyAsync(sigBytes, data, publicKey);
}
