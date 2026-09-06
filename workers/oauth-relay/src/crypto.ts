const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEYLEN = 32;

export async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'Ed25519', namedCurve: 'Ed25519' },
    true,
    ['sign', 'verify'],
  );
}

export async function ed25519KeypairFromSeed(
  seed: Uint8Array,
): Promise<CryptoKeyPair> {
  const privateKey = await crypto.subtle.importKey(
    'raw',
    seed,
    'Ed25519',
    true,
    ['sign'],
  );

  const publicKeyRaw = await crypto.subtle.exportKey('raw', privateKey);

  const publicKey = await crypto.subtle.importKey(
    'raw',
    publicKeyRaw,
    { name: 'Ed25519', namedCurve: 'Ed25519' },
    true,
    ['verify'],
  );

  return { privateKey, publicKey };
}

export function base58Encode(buffer: Uint8Array): string {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = 0n;
  for (const byte of buffer) {
    num = num * 256n + BigInt(byte);
  }
  let str = '';
  while (num > 0n) {
    const remainder = Number(num % 58n);
    num = num / 58n;
    str = ALPHABET[remainder] + str;
  }
  for (const byte of buffer) {
    if (byte !== 0) break;
    str = ALPHABET[0] + str;
  }
  return str;
}

export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

export async function deriveDidKey(
  accessToken: string,
  perUserSalt: Uint8Array,
): Promise<string> {
  const seed = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: perUserSalt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(accessToken),
      'PBKDF2',
      false,
      ['deriveBits'],
    ),
    PBKDF2_KEYLEN * 8,
  );

  const seedBytes = new Uint8Array(seed);
  const { publicKey } = await ed25519KeypairFromSeed(seedBytes);

  const pubKeyBuf = await crypto.subtle.exportKey('raw', publicKey) as ArrayBuffer;
  const pubKeyRaw = new Uint8Array(pubKeyBuf);

  const prefixed = new Uint8Array(1 + pubKeyRaw.length);
  prefixed[0] = 0xed;
  prefixed.set(pubKeyRaw, 1);

  return `did:key:z${base58Encode(prefixed)}`;
}

export function verifyCodeChallenge(
  verifier: string,
  challenge: string,
  method: string,
): Promise<boolean> {
  if (method !== 'S256') return Promise.resolve(false);
  if (!/^[A-Za-z0-9\-._~]{43,128}$/.test(verifier)) return Promise.resolve(false);

  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);

  return crypto.subtle
    .digest('SHA-256', data)
    .then((digest) => {
      const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      return base64 === challenge;
    });
}

// ─── DPoP (RFC 9449) ───────────────────────────────────────────────

export function base64urlEncode(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64urlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function computeJwkThumbprint(jwk: JsonWebKey): Promise<string> {
  const canonical = JSON.stringify({
    crv: jwk.crv,
    kty: jwk.kty,
    x: jwk.x,
  });
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical));
  return base64urlEncode(digest);
}

export async function generateDPoPProof(
  method: string,
  url: string,
  accessToken: string,
  privateKey: CryptoKey,
  publicKeyJwk: JsonWebKey,
  nonce?: string,
): Promise<string> {
  const jkt = await computeJwkThumbprint(publicKeyJwk);
  const now = Math.floor(Date.now() / 1000);
  const jti = crypto.randomUUID();

  const header = {
    typ: 'dpop+jwt',
    alg: 'EdDSA',
    jwk: publicKeyJwk,
  };

  const payload: Record<string, unknown> = {
    jti,
    htm: method.toUpperCase(),
    htu: url.split('?')[0],
    iat: now,
    ath: await hashAccessToken(accessToken),
  };

  if (nonce) payload.nonce = nonce;

  const encodedHeader = base64urlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));

  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = await crypto.subtle.sign('Ed25519', privateKey, new TextEncoder().encode(signatureInput));
  const encodedSignature = base64urlEncode(new Uint8Array(signature));

  return `${signatureInput}.${encodedSignature}`;
}

export async function hashAccessToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return base64urlEncode(digest);
}

export async function verifyDPoPProof(
  proof: string,
  method: string,
  url: string,
  accessToken: string,
  expectedNonce?: string,
): Promise<{ valid: boolean; jkt: string }> {
  try {
    const parts = proof.split('.');
    if (parts.length !== 3) return { valid: false, jkt: '' };

    const [encodedHeader, encodedPayload, encodedSignature] = parts;

    const header = JSON.parse(new TextDecoder().decode(base64urlDecode(encodedHeader)));
    if (header.typ !== 'dpop+jwt' || header.alg !== 'EdDSA') {
      return { valid: false, jkt: '' };
    }

    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(encodedPayload)));

    // Verify timestamp (5-minute window)
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.iat !== 'number' || Math.abs(now - payload.iat) > 300) {
      return { valid: false, jkt: '' };
    }

    // Verify method
    if (payload.htm !== method.toUpperCase()) {
      return { valid: false, jkt: '' };
    }

    // Verify URL (exact match, no query params)
    const expectedUrl = url.split('?')[0].replace(/\/$/, '');
    const proofUrl = (payload.htu as string).replace(/\/$/, '');
    if (proofUrl !== expectedUrl) {
      return { valid: false, jkt: '' };
    }

    // Verify nonce if provided
    if (expectedNonce && payload.nonce !== expectedNonce) {
      return { valid: false, jkt: '' };
    }

    // Verify signature
    const publicKeyJwk = header.jwk;
    const publicKey = await crypto.subtle.importKey(
      'jwk',
      publicKeyJwk,
      { name: 'Ed25519', namedCurve: 'Ed25519' },
      false,
      ['verify'],
    );

    const signatureBytes = base64urlDecode(encodedSignature);
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const valid = await crypto.subtle.verify(
      'Ed25519',
      publicKey,
      signatureBytes,
      new TextEncoder().encode(signatureInput),
    );

    if (!valid) return { valid: false, jkt: '' };

    // Verify access token hash
    const expectedAth = await hashAccessToken(accessToken);
    if (payload.ath !== expectedAth) {
      return { valid: false, jkt: '' };
    }

    const jkt = await computeJwkThumbprint(publicKeyJwk);
    return { valid: true, jkt };
  } catch {
    return { valid: false, jkt: '' };
  }
}

export function generateNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return base64urlEncode(bytes.buffer);
}
