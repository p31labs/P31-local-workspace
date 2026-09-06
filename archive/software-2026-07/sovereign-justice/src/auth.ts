import { hexToBytes } from './hex';

interface D1Env {
  JUSTICE_D1?: D1Database;
}

let cachedKeys: Record<string, string> | null = null;
let cachedKeysExpiry = 0;
const CACHE_TTL_MS = 60_000;

const STATIC_KEYS: Record<string, string> = {
  'did:example:party-a': '0x0000000000000000000000000000000000000000000000000000000000000000',
  'did:example:party-b': '0x0000000000000000000000000000000000000000000000000000000000000000',
};

export async function getKnownKeys(env?: D1Env): Promise<Record<string, string>> {
  if (cachedKeys && Date.now() < cachedKeysExpiry) {
    return { ...STATIC_KEYS, ...cachedKeys };
  }

  if (env?.JUSTICE_D1) {
    try {
      const result = await env.JUSTICE_D1.prepare(
        'SELECT did, public_key_hex FROM auth_registry WHERE active = 1'
      ).all<{ did: string; public_key_hex: string }>();

      if (result.results && result.results.length > 0) {
        const dbKeys: Record<string, string> = {};
        for (const row of result.results) {
          dbKeys[row.did] = row.public_key_hex;
        }
        cachedKeys = dbKeys;
        cachedKeysExpiry = Date.now() + CACHE_TTL_MS;
        return { ...STATIC_KEYS, ...dbKeys };
      }
    } catch {
      // D1 not available or table doesn't exist — fall through to static
    }
  }

  return STATIC_KEYS;
}

export interface AuthResult {
  did: string;
  principal: string;
  payload: string;
  nonce?: string;
}

export interface AuthConfig {
  knownKeys: Record<string, string>;
  requireNonce?: boolean;
  nonceCache?: {
    has: (nonce: string) => Promise<boolean>;
    set: (nonce: string, ttlSeconds: number) => Promise<void>;
  };
  nonceTTL?: number;
}

export async function verifyDID(
  request: Request,
  config: AuthConfig
): Promise<AuthResult | Response> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Missing or invalid Authorization header' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const token = authHeader.split(' ')[1];
    let decoded: { did: string; signature: string; payload: string; nonce?: string };

    try {
      const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
      const padding = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
      const json = atob(base64 + padding);
      decoded = JSON.parse(json);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Malformed auth token: invalid base64 or JSON' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { did, signature, payload, nonce } = decoded;

    if (!did || !signature || !payload) {
      return new Response(
        JSON.stringify({ error: 'Malformed auth token: missing did, signature, or payload' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const publicKeyHex = config.knownKeys[did];
    if (!publicKeyHex) {
      return new Response(
        JSON.stringify({ error: 'DID not found in registry' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const isValid = await verifyEd25519(payload, signature, publicKeyHex);
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid cryptographic signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (config.requireNonce && nonce) {
      if (!config.nonceCache) {
        console.warn('[auth] Nonce required but no nonceCache provided');
      } else {
        if (await config.nonceCache.has(nonce)) {
          return new Response(
            JSON.stringify({ error: 'Nonce already used (replay attack detected)' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
        }
        await config.nonceCache.set(nonce, config.nonceTTL || 300);
      }
    }

    return { did, principal: publicKeyHex, payload, nonce };
  } catch (error) {
    console.error('[auth] Verification error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process authentication' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function verifyEd25519(
  data: string,
  signatureHex: string,
  publicKeyHex: string
): Promise<boolean> {
  try {
    const publicKeyBytes = hexToBytes(publicKeyHex);
    const signatureBytes = hexToBytes(signatureHex);
    const dataBytes = new TextEncoder().encode(data);

    const publicKey = await crypto.subtle.importKey(
      'raw', publicKeyBytes, { name: 'Ed25519' }, false, ['verify']
    );

    return crypto.subtle.verify('Ed25519', publicKey, signatureBytes, dataBytes);
  } catch (error) {
    console.error('[auth] Ed25519 verification error:', error);
    return false;
  }
}

export async function requireAuth(
  request: Request,
  config: AuthConfig
): Promise<AuthResult> {
  const result = await verifyDID(request, config);
  if (result instanceof Response) {
    throw result;
  }
  return result;
}

export function unauthorizedResponse(message?: string): Response {
  return new Response(
    JSON.stringify({ error: message || 'Unauthorized' }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Bearer realm="K4 Settlement"'
      }
    }
  );
}
