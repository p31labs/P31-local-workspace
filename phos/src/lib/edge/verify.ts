import { decodeBase58 } from './base58';

const ED25519_MULTICODEC_PREFIX = 0xed01;
const ED25519_2021_MULTICODEC_PREFIX = 0x23c;

export function extractPublicKeyFromDID(did: string): Uint8Array {
  const prefix = 'did:key:';
  if (!did.startsWith(prefix)) {
    throw new Error('Invalid DID format: must start with did:key:');
  }

  const encoded = did.slice(prefix.length);
  const decoded = decodeBase58(encoded);

  if (decoded.length < 2) {
    throw new Error('Invalid Ed25519 public key: too short');
  }

  const multicodec = (decoded[0] << 8) | decoded[1];

  // Support both legacy Ed25519 (0xed01) and Ed25519 Verification Key 2021 (0x23c)
  if (multicodec === ED25519_MULTICODEC_PREFIX) {
    // Legacy format: multicodec prefix + 32-byte public key
    return decoded.slice(2);
  }

  if (multicodec === ED25519_2021_MULTICODEC_PREFIX) {
    // Ed25519 Verification Key 2021: multicodec prefix + 32-byte public key
    return decoded.slice(2);
  }

  throw new Error(`Invalid Ed25519 public key: expected multicodec 0xed01 or 0x23c, got 0x${multicodec.toString(16)}`);
}

export async function verifyEd25519Signature(
  did: string,
  payload: string,
  signature: string
): Promise<boolean> {
  try {
    const publicKeyBytes = extractPublicKeyFromDID(did);

    const sliced = publicKeyBytes.buffer.slice(publicKeyBytes.byteOffset, publicKeyBytes.byteOffset + publicKeyBytes.byteLength);
    const ab = new ArrayBuffer(sliced.byteLength);
    new Uint8Array(ab).set(new Uint8Array(sliced));
    const publicKey = await crypto.subtle.importKey(
      'raw',
      ab,
      { name: 'Ed25519' },
      false,
      ['verify']
    );

    const payloadBytes = new TextEncoder().encode(payload);
    const signatureBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0));

    return await crypto.subtle.verify(
      'Ed25519',
      publicKey,
      signatureBytes,
      payloadBytes
    );
  } catch {
    return false;
  }
}

export async function verifyRequest(request: Request, didSource: string = 'did'): Promise<boolean> {
  const signature = request.headers.get('X-Signature');
  if (!signature) return false;

  const cloned = request.clone();
  let body: any;
  try {
    body = await cloned.json();
  } catch {
    return false;
  }

  const did = body[didSource] || body.voterDid || body.author || body.from || body.partyADid;
  if (!did || typeof did !== 'string' || !did.startsWith('did:key:')) {
    return false;
  }

  const payload = JSON.stringify(body);
  return verifyEd25519Signature(did, payload, signature);
}

export function unauthorizedResponse(message: string = 'Missing or invalid signature'): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  );
}
