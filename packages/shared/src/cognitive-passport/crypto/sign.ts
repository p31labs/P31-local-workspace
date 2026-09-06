export interface MLDSASignature {
  signature: string;
  publicKey: string;
}

export interface PassportSignature {
  ed25519: string | null;
  ml_dsa: MLDSASignature | null;
  slhdsa128s: { signature: string; publicKey: string } | null;
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

  // ML-DSA-65 co-signature (graceful fallback to null if unavailable)
  let mlDsaSig: MLDSASignature | null = null;
  try {
    const { ml_dsa65 } = await import('@noble/post-quantum/ml-dsa');
    const stored = typeof localStorage !== 'undefined'
      ? localStorage.getItem('p31-ml-dsa-65-keypair')
      : null;
    if (stored) {
      const kp = JSON.parse(stored) as { secretKey: string; publicKey: string };
      const skBytes = Uint8Array.from(Buffer.from(kp.secretKey, 'hex'));
      const pqSig = ml_dsa65.sign(data, skBytes);
      mlDsaSig = {
        signature: Buffer.from(pqSig).toString('hex'),
        publicKey: kp.publicKey,
      };
    }
  } catch {
    // @noble/post-quantum not installed or keypair not in localStorage — degrade gracefully
  }

  // SLH-DSA-128s co-signature (graceful fallback to null if unavailable)
  let slhdsaSig: { signature: string; publicKey: string } | null = null;
  try {
    const { generateSLHDSA128sKeyPair, slhdsa128sSign } = await import('@p31/sovereign-primitives');
    const stored = typeof localStorage !== 'undefined'
      ? localStorage.getItem('p31-slhdsa-128s-keypair')
      : null;
    if (stored && typeof slhdsa128sSign === 'function') {
      const kp = JSON.parse(stored) as { secretKey: number[]; publicKey: number[] };
      const skBytes = Uint8Array.from(kp.secretKey);
      const sig = await slhdsa128sSign(data, skBytes);
      if (sig) {
        slhdsaSig = {
          signature: Buffer.from(sig).toString('hex'),
          publicKey: Buffer.from(kp.publicKey).toString('hex'),
        };
      }
    }
  } catch {
    // SLH-DSA not available or keypair not in localStorage — degrade gracefully
  }

  return {
    ed25519: sigHex,
    ml_dsa: mlDsaSig,
    slhdsa128s: slhdsaSig,
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
  const ed25519Valid = await ed25519.verifyAsync(sigBytes, data, publicKey);

  // ML-DSA-65 verification (if co-signature is present)
  if (signature.ml_dsa) {
    try {
      const { ml_dsa65 } = await import('@noble/post-quantum/ml-dsa');
      const pqSigBytes = Uint8Array.from(Buffer.from(signature.ml_dsa.signature, 'hex'));
      const pqPubBytes = Uint8Array.from(Buffer.from(signature.ml_dsa.publicKey, 'hex'));
      const pqValid = ml_dsa65.verify(pqSigBytes, data, pqPubBytes);
      if (!pqValid) return false;
    } catch {
      // ML-DSA-65 verification failed or library unavailable
      return false;
    }
  }

  // SLH-DSA-128s verification (if co-signature is present)
  if (signature.slhdsa128s) {
    try {
      const { slhdsa128sVerify } = await import('@p31/sovereign-primitives');
      const slhSigBytes = Uint8Array.from(Buffer.from(signature.slhdsa128s.signature, 'hex'));
      const slhPubBytes = Uint8Array.from(Buffer.from(signature.slhdsa128s.publicKey, 'hex'));
      const slhValid = await slhdsa128sVerify(data, slhSigBytes, slhPubBytes);
      if (!slhValid) return false;
    } catch {
      // SLH-DSA-128s verification failed or library unavailable
      return false;
    }
  }

  return ed25519Valid;
}
