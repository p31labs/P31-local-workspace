/**
 * P31 Passkey Worker — v2
 *
 * POST /api/passkey/register-begin   → PublicKeyCredentialCreationOptions
 * POST /api/passkey/register-finish  → { ok: true, userId } | { error }
 * POST /api/passkey/auth-begin       → PublicKeyCredentialRequestOptions
 * POST /api/passkey/auth-finish      → { ok: true, userId } | { error }
 *
 * GET  /api/education/progress/:subject_id → p31.educationProgress/0.1.0 (D1-backed; same Worker + DB mount)
 *
 * POST /api/hardware/challenge      → Node Zero pairing challenge (KV) — firmware
 * POST /api/hardware/pair         → operator approves pubkey → D1 hardware_pairings
 * POST /api/hardware/telemetry    → heartbeat (validated; v0 no store)
 *
 * v2 improvements:
 *   - Minimal CBOR decoder (no WASM dependency)
 *   - authData parsed: rpIdHash verified, COSE key extracted
 *   - COSE key stored as JWK JSON (not raw attestationObject)
 *   - auth-finish: full SubtleCrypto signature verification (ES256 + RS256)
 */

import {
  postHardwareChallenge,
  postHardwarePair,
  postHardwareTelemetry,
} from './node-zero.ts';

export interface Env {
  CHALLENGES: KVNamespace;
  DB:         D1Database;
  RP_NAME:    string;
  RP_ID:      string;
}

// ── CORS & HELPERS ────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function fromB64url(s: string): Uint8Array {
  const b = s.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(b), c => c.charCodeAt(0));
}

// ── MINIMAL CBOR DECODER ─────────────────────────────────────────────────────
// Handles unsigned int, negative int, byte string, text string, array, map.
// Sufficient for all WebAuthn attestation and COSE key structures.

function cborDecode(data: Uint8Array): unknown {
  let offset = 0;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  function readLen(info: number): number {
    if (info < 24) return info;
    if (info === 24) { const v = view.getUint8(offset); offset += 1; return v; }
    if (info === 25) { const v = view.getUint16(offset); offset += 2; return v; }
    if (info === 26) { const v = view.getUint32(offset); offset += 4; return v; }
    throw new Error(`Unsupported CBOR length encoding: ${info}`);
  }

  function read(): unknown {
    const initial = view.getUint8(offset++);
    const major   = initial >> 5;
    const info    = initial & 0x1f;
    const len     = readLen(info);

    switch (major) {
      case 0: return len;
      case 1: return -1 - len;
      case 2: {
        const bytes = data.slice(offset, offset + len);
        offset += len;
        return bytes;
      }
      case 3: {
        const bytes = data.slice(offset, offset + len);
        offset += len;
        return new TextDecoder().decode(bytes);
      }
      case 4: {
        const arr: unknown[] = [];
        for (let i = 0; i < len; i++) arr.push(read());
        return arr;
      }
      case 5: {
        const map = new Map<unknown, unknown>();
        for (let i = 0; i < len; i++) {
          const k = read();
          const v = read();
          map.set(k, v);
        }
        return map;
      }
      default:
        throw new Error(`Unsupported CBOR major type: ${major}`);
    }
  }

  return read();
}

// ── AUTH DATA PARSER ─────────────────────────────────────────────────────────

interface AuthDataResult {
  rpIdHash:     Uint8Array;
  flags:        number;
  signCount:    number;
  aaguid?:      Uint8Array;
  credentialId?: Uint8Array;
  coseKey?:     Map<unknown, unknown>;
}

function parseAuthData(raw: Uint8Array): AuthDataResult {
  const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
  let off = 0;

  const rpIdHash  = raw.slice(off, off + 32); off += 32;
  const flags     = raw[off++];
  const signCount = view.getUint32(off);      off += 4;

  const AT = (flags & 0x40) !== 0;
  const result: AuthDataResult = { rpIdHash, flags, signCount };

  if (AT && off < raw.length) {
    const aaguid = raw.slice(off, off + 16); off += 16;
    const credIdLen = view.getUint16(off);   off += 2;
    const credentialId = raw.slice(off, off + credIdLen); off += credIdLen;
    const coseKey = cborDecode(raw.slice(off)) as Map<unknown, unknown>;
    result.aaguid      = aaguid;
    result.credentialId = credentialId;
    result.coseKey     = coseKey;
  }

  return result;
}

// ── COSE KEY → JWK ───────────────────────────────────────────────────────────

interface StoredKey {
  alg: 'ES256' | 'RS256';
  jwk: JsonWebKey;
}

async function coseKeyToJwk(coseKey: Map<unknown, unknown>): Promise<StoredKey> {
  const alg = coseKey.get(3) as number; // COSE alg label

  if (alg === -7) {
    // ES256 — ECDSA P-256
    const x = coseKey.get(-2) as Uint8Array;
    const y = coseKey.get(-3) as Uint8Array;
    if (!x || !y) throw new Error('ES256 key missing x or y');
    const jwk: JsonWebKey = {
      kty: 'EC', crv: 'P-256',
      x:   b64url(x),
      y:   b64url(y),
      ext: true,
    };
    // Validate by importing
    await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    return { alg: 'ES256', jwk };
  }

  if (alg === -257) {
    // RS256 — RSASSA-PKCS1-v1_5
    const n = coseKey.get(-1) as Uint8Array;
    const e = coseKey.get(-2) as Uint8Array;
    if (!n || !e) throw new Error('RS256 key missing n or e');
    const jwk: JsonWebKey = {
      kty: 'RSA', alg: 'RS256',
      n:   b64url(n),
      e:   b64url(e),
      ext: true,
    };
    await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    return { alg: 'RS256', jwk };
  }

  throw new Error(`Unsupported COSE algorithm: ${alg}`);
}

async function importStoredKey(stored: StoredKey): Promise<CryptoKey> {
  if (stored.alg === 'ES256') {
    return crypto.subtle.importKey(
      'jwk', stored.jwk,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false, ['verify'],
    );
  }
  return crypto.subtle.importKey(
    'jwk', stored.jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['verify'],
  );
}

// ── REGISTER BEGIN ───────────────────────────────────────────────────────────

async function registerBegin(env: Env): Promise<Response> {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId    = crypto.getRandomValues(new Uint8Array(16));

  const challengeKey = `reg:${b64url(challenge)}`;
  await env.CHALLENGES.put(
    challengeKey,
    JSON.stringify({ type: 'registration', userId: b64url(userId) }),
    { expirationTtl: 300 },
  );

  return json({
    challenge:   b64url(challenge),
    rp:          { name: env.RP_NAME, id: env.RP_ID },
    user: {
      id:          b64url(userId),
      name:        'mesh-member',
      displayName: 'Mesh Member',
    },
    pubKeyCredParams: [
      { type: 'public-key', alg: -7   },  // ES256
      { type: 'public-key', alg: -257 },  // RS256
    ],
    authenticatorSelection: {
      residentKey:      'preferred',
      userVerification: 'preferred',
    },
    timeout: 60000,
  });
}

// ── REGISTER FINISH ──────────────────────────────────────────────────────────

async function registerFinish(env: Env, body: Record<string, unknown>): Promise<Response> {
  const { id, response: authResp } = body as {
    id: string;
    response: {
      clientDataJSON:    string;
      attestationObject: string;
      transports?:       string[];
    };
  };

  if (!id || !authResp?.clientDataJSON || !authResp?.attestationObject) {
    return json({ error: 'Missing fields' }, 400);
  }

  // 1. Decode and verify clientDataJSON
  const clientDataRaw = fromB64url(authResp.clientDataJSON);
  const clientData    = JSON.parse(new TextDecoder().decode(clientDataRaw)) as {
    type: string; challenge: string; origin: string;
  };

  if (clientData.type !== 'webauthn.create') return json({ error: 'Wrong type' }, 400);

  // 2. Verify challenge exists
  const challengeKey = `reg:${clientData.challenge}`;
  const stored       = await env.CHALLENGES.get(challengeKey, 'json') as { userId: string } | null;
  if (!stored) return json({ error: 'Challenge expired or invalid' }, 400);
  await env.CHALLENGES.delete(challengeKey);

  // 3. Decode attestation object
  const attObjRaw = fromB64url(authResp.attestationObject);
  let attObj: Map<unknown, unknown>;
  try {
    attObj = cborDecode(attObjRaw) as Map<unknown, unknown>;
  } catch {
    return json({ error: 'Invalid attestation object' }, 400);
  }

  const authDataRaw = attObj.get('authData') as Uint8Array | undefined;
  if (!authDataRaw) return json({ error: 'Missing authData' }, 400);

  // 4. Parse authData
  let authData: AuthDataResult;
  try {
    authData = parseAuthData(authDataRaw);
  } catch {
    return json({ error: 'Failed to parse authData' }, 400);
  }

  // 5. Verify rpIdHash
  const expectedRpIdHash = new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(env.RP_ID))
  );
  if (!authData.rpIdHash.every((b, i) => b === expectedRpIdHash[i])) {
    return json({ error: 'rpId hash mismatch' }, 400);
  }

  // 6. Check user-present flag
  if (!(authData.flags & 0x01)) return json({ error: 'User not present' }, 400);

  // 7. Extract and store COSE public key as JWK
  if (!authData.coseKey) return json({ error: 'No credential data in authData' }, 400);

  let storedKey: StoredKey;
  try {
    storedKey = await coseKeyToJwk(authData.coseKey);
  } catch (e) {
    return json({ error: `Unsupported key: ${(e as Error).message}` }, 400);
  }

  const aaguid = authData.aaguid ? b64url(authData.aaguid) : null;

  await env.DB.prepare(
    `INSERT OR IGNORE INTO credentials
       (id, user_id, public_key, alg, sign_count, aaguid, transports, backed_up, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`
  ).bind(
    id,
    stored.userId,
    JSON.stringify(storedKey),
    storedKey.alg,
    authData.signCount,
    aaguid,
    JSON.stringify(authResp.transports ?? []),
    Date.now(),
  ).run();

  return json({ ok: true, userId: stored.userId });
}

// ── AUTH BEGIN ───────────────────────────────────────────────────────────────

async function authBegin(env: Env): Promise<Response> {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const key       = `auth:${b64url(challenge)}`;
  await env.CHALLENGES.put(key, '1', { expirationTtl: 300 });

  return json({
    challenge:        b64url(challenge),
    rpId:             env.RP_ID,
    userVerification: 'preferred',
    timeout:          60000,
  });
}

// ── AUTH FINISH ──────────────────────────────────────────────────────────────

async function authFinish(env: Env, body: Record<string, unknown>): Promise<Response> {
  const { id, response: authResp } = body as {
    id: string;
    response: {
      clientDataJSON:    string;
      authenticatorData: string;
      signature:         string;
    };
  };

  if (!id || !authResp?.clientDataJSON || !authResp?.authenticatorData || !authResp?.signature) {
    return json({ error: 'Missing fields' }, 400);
  }

  // 1. Decode clientDataJSON and verify challenge
  const clientDataRaw = fromB64url(authResp.clientDataJSON);
  const clientData    = JSON.parse(new TextDecoder().decode(clientDataRaw)) as {
    type: string; challenge: string;
  };

  if (clientData.type !== 'webauthn.get') return json({ error: 'Wrong type' }, 400);

  const challengeKey = `auth:${clientData.challenge}`;
  const exists       = await env.CHALLENGES.get(challengeKey);
  if (!exists) return json({ error: 'Challenge expired or invalid' }, 400);
  await env.CHALLENGES.delete(challengeKey);

  // 2. Load credential
  const cred = await env.DB.prepare(
    'SELECT user_id, public_key, alg, sign_count FROM credentials WHERE id = ?'
  ).bind(id).first<{ user_id: string; public_key: string; alg: string; sign_count: number }>();

  if (!cred) return json({ error: 'Credential not found' }, 401);

  // 3. Decode authenticatorData and verify rpIdHash
  const authDataRaw = fromB64url(authResp.authenticatorData);
  let authData: AuthDataResult;
  try {
    authData = parseAuthData(authDataRaw);
  } catch {
    return json({ error: 'Failed to parse authenticatorData' }, 400);
  }

  const expectedRpIdHash = new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(env.RP_ID))
  );
  if (!authData.rpIdHash.every((b, i) => b === expectedRpIdHash[i])) {
    return json({ error: 'rpId hash mismatch' }, 400);
  }

  if (!(authData.flags & 0x01)) return json({ error: 'User not present' }, 400);

  // 4. Build signed data: authData || SHA-256(clientDataJSON)
  const clientDataHash = new Uint8Array(
    await crypto.subtle.digest('SHA-256', clientDataRaw)
  );
  const signedData = new Uint8Array(authDataRaw.length + 32);
  signedData.set(authDataRaw);
  signedData.set(clientDataHash, authDataRaw.length);

  // 5. Verify signature
  const signature   = fromB64url(authResp.signature);
  const storedKey   = JSON.parse(cred.public_key) as StoredKey;

  let cryptoKey: CryptoKey;
  try {
    cryptoKey = await importStoredKey(storedKey);
  } catch {
    return json({ error: 'Failed to import credential key' }, 500);
  }

  const algParams = storedKey.alg === 'ES256'
    ? { name: 'ECDSA', hash: 'SHA-256' }
    : { name: 'RSASSA-PKCS1-v1_5' };

  const valid = await crypto.subtle.verify(algParams, cryptoKey, signature, signedData);
  if (!valid) return json({ error: 'Signature verification failed' }, 401);

  // 6. Replay protection: sign_count must be greater than stored (if non-zero)
  if (authData.signCount > 0 && authData.signCount <= cred.sign_count) {
    return json({ error: 'Sign count replay detected' }, 401);
  }

  // 7. Update counter
  await env.DB.prepare(
    'UPDATE credentials SET sign_count = ?, last_used_at = ? WHERE id = ?'
  ).bind(authData.signCount || cred.sign_count + 1, Date.now(), id).run();

  return json({ ok: true, userId: cred.user_id });
}

// ── EDUCATION E3+ PROGRESS (D1) ────────────────────────────────────────────────

interface EducationProgressBody {
  schema: 'p31.educationProgress/0.1.0';
  subject_id: string;
  e3_track: ReadonlyArray<{
    id: string;
    title: string;
    lane: string;
    status: 'not_started' | 'in_progress' | 'completed';
    pct: number;
  }>;
  updated_at_ms: number;
}

const E3_TRACK_DEFAULT = [
  { id: 'e3-core-mesh', title: 'Core mesh concepts', lane: 'Conceptual', status: 'not_started' as const, pct: 0 },
  { id: 'e3-personal-k4', title: 'Personal K₄ literacy', lane: 'Operational', status: 'not_started' as const, pct: 0 },
  { id: 'e3-operator-runbooks', title: 'Operator runbooks', lane: 'Procedural', status: 'not_started' as const, pct: 0 },
];

function educationProgressEnvelope(subject_id: string): EducationProgressBody {
  const now = Date.now();
  return {
    schema:           'p31.educationProgress/0.1.0',
    subject_id,
    e3_track:         E3_TRACK_DEFAULT.map(row => ({
      ...row,
      pct: Math.max(0, Math.min(100, row.pct)),
    })),
    updated_at_ms:    now,
  };
}

function isValidOpaqueSubjectId(s: string): boolean {
  if (s.length > 120) return false;
  return (
    /^u_[a-f0-9]{32}$/.test(s) ||
    /^guest_[a-f0-9]{20}$/.test(s)
  );
}

async function fetchEducationProgress(env: Env, subjectId: string): Promise<Response> {
  if (!isValidOpaqueSubjectId(subjectId)) {
    return json({ error: 'invalid subject_id' }, 400);
  }

  const row = await env.DB.prepare(
    'SELECT payload_json, updated_at FROM education_progress WHERE subject_id = ?'
  ).bind(subjectId).first<{ payload_json: string; updated_at: number }>();

  if (!row) {
    const fresh = educationProgressEnvelope(subjectId);
    const payload = JSON.stringify(fresh);
    await env.DB.prepare(
      `INSERT INTO education_progress (subject_id, payload_json, updated_at) VALUES (?, ?, ?)`
    ).bind(subjectId, payload, fresh.updated_at_ms).run();

    return new Response(payload, {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  return new Response(row.payload_json, {
    status: 200,
    headers: {
      'Content-Type':                     'application/json',
      ...CORS_HEADERS,
      'Cache-Control':                  'private, max-age=0, must-revalidate',
      'Last-Modified':                  new Date(row.updated_at).toUTCString(),
    },
  });
}

// ── ROUTER ───────────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    const eduMatch = /^\/api\/education\/progress\/([^/?#]+)$/.exec(url.pathname);
    if (eduMatch && request.method === 'GET') {
      try {
        return await fetchEducationProgress(env, decodeURIComponent(eduMatch[1]));
      } catch (e) {
        return json({ error: String((e as Error).message || e) }, 500);
      }
    }

    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    let body: Record<string, unknown> = {};
    try {
      if (request.headers.get('content-type')?.includes('application/json')) {
        body = await request.json() as Record<string, unknown>;
      }
    } catch { /* empty body ok for begin endpoints */ }

    if (url.pathname.startsWith('/api/hardware/')) {
      try {
        switch (url.pathname) {
          case '/api/hardware/challenge':
            return await postHardwareChallenge(env, body);
          case '/api/hardware/pair':
            return await postHardwarePair(env, body);
          case '/api/hardware/telemetry':
            return await postHardwareTelemetry(body);
          default:
            return json({ error: 'Not found' }, 404);
        }
      } catch (e) {
        return json({ error: String((e as Error).message || e) }, 500);
      }
    }

    switch (url.pathname) {
      case '/api/passkey/register-begin':  return registerBegin(env);
      case '/api/passkey/register-finish': return registerFinish(env, body);
      case '/api/passkey/auth-begin':      return authBegin(env);
      case '/api/passkey/auth-finish':     return authFinish(env, body);
      default: return json({ error: 'Not found' }, 404);
    }
  },
};
