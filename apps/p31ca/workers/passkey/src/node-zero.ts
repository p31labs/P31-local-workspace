/**
 * Minimal env slice for hardware routes (avoid circular imports with src/index.ts).
 */
export interface HardwareEnv {
  CHALLENGES: KVNamespace;
  DB: D1Database;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
} as const;

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
  const pad = (4 - (b.length % 4)) % 4;
  return Uint8Array.from(atob(b + '='.repeat(pad)), c => c.charCodeAt(0));
}

function isValidOpaqueSubjectId(s: string): boolean {
  if (s.length > 120) return false;
  return /^u_[a-f0-9]{32}$/.test(s) || /^guest_[a-f0-9]{20}$/.test(s);
}

/** Ed25519 raw public key = 32 bytes (b64url-encoded). */
export function assertEd25519PubkeyB64Url(s: string): Uint8Array {
  const raw = fromB64url(s);
  if (raw.length !== 32) throw new Error('ed25519_public_key_b64url must decode to 32 bytes');
  return raw;
}

function newHwPairingId(): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  return `hw_${b64url(b)}`;
}

function newM2MPreviewToken(): string {
  const b = crypto.getRandomValues(new Uint8Array(32));
  return `p31.hw.${b64url(b)}`;
}

function generateSixDigitCode(): string {
  const a = new Uint8Array(4);
  crypto.getRandomValues(a);
  const n = (a[0]! << 24 | a[1]! << 16 | a[2]! << 8 | a[3]!) >>> 0;
  return String(100000 + (n % 900000));
}

interface KvChallenge {
  ed25519_public_key_b64url: string;
  device_label?: string;
  created_at_ms: number;
}

const KV_PREFIX = 'hw_pair:';

/**
 * POST /api/hardware/challenge — firmware registers Ed25519 pubkey, receives short pairing code.
 */
export async function postHardwareChallenge(env: HardwareEnv, body: Record<string, unknown>): Promise<Response> {
  if (body.schema !== 'p31.nodeZero.pairChallenge/0.1.0') {
    return json({ error: 'expected schema p31.nodeZero.pairChallenge/0.1.0' }, 400);
  }
  const pkStr = body.ed25519_public_key_b64url;
  if (typeof pkStr !== 'string') return json({ error: 'missing ed25519_public_key_b64url' }, 400);
  try {
    assertEd25519PubkeyB64Url(pkStr);
  } catch (e) {
    return json({ error: String((e as Error).message) }, 400);
  }

  const deviceLabel = typeof body.device_label === 'string' ? body.device_label.slice(0, 80) : undefined;

  let code = '';
  for (let attempt = 0; attempt < 16; attempt++) {
    code = generateSixDigitCode();
    const key = KV_PREFIX + code;
    const existing = await env.CHALLENGES.get(key);
    if (existing) continue;

    const payload: KvChallenge = {
      ed25519_public_key_b64url: pkStr,
      device_label:              deviceLabel,
      created_at_ms:             Date.now(),
    };

    await env.CHALLENGES.put(key, JSON.stringify(payload), { expirationTtl: 600 });
    return json({
      schema:           'p31.nodeZero.pairChallengeResponse/0.1.0',
      pairing_code:     code,
      expires_in_sec:   600,
      device_label_ack: deviceLabel ?? null,
    });
  }

  return json({ error: 'pairing_code collision — retry' }, 503);
}

/**
 * POST /api/hardware/pair — operator approves binding (opaque subject_id + code + pubkey match).
 */
export async function postHardwarePair(env: HardwareEnv, body: Record<string, unknown>): Promise<Response> {
  if (body.schema !== 'p31.nodeZero.pairApprove/0.1.0') {
    return json({ error: 'expected schema p31.nodeZero.pairApprove/0.1.0' }, 400);
  }

  const subjectId = body.subject_id;
  if (typeof subjectId !== 'string' || !isValidOpaqueSubjectId(subjectId)) {
    return json({ error: 'invalid or missing subject_id' }, 400);
  }

  const code = body.pairing_code;
  if (typeof code !== 'string' || !/^\d{6}$/.test(code)) {
    return json({ error: 'pairing_code must be a 6-digit string' }, 400);
  }

  const pkIncoming = body.ed25519_public_key_b64url;
  if (typeof pkIncoming !== 'string') return json({ error: 'missing ed25519_public_key_b64url' }, 400);

  let rawPk: Uint8Array;
  try {
    rawPk = assertEd25519PubkeyB64Url(pkIncoming);
  } catch (e) {
    return json({ error: String((e as Error).message) }, 400);
  }
  if (rawPk.length !== 32) return json({ error: 'unexpected key length' }, 400);

  const kvKey = KV_PREFIX + code;
  const raw = await env.CHALLENGES.get(kvKey);
  if (!raw) return json({ error: 'unknown or expired pairing_code' }, 404);

  let ch: KvChallenge;
  try {
    ch = JSON.parse(raw) as KvChallenge;
  } catch {
    return json({ error: 'pairing KV corrupt' }, 500);
  }

  if (ch.ed25519_public_key_b64url !== pkIncoming) {
    return json({ error: 'ed25519_public_key_b64url does not match pending challenge' }, 403);
  }

  const pairing_id = newHwPairingId();
  const now = Date.now();

  await env.DB.prepare(
    `INSERT INTO hardware_pairings
      (id, subject_id, ed25519_pubkey_b64url, device_label, created_at, revoked_at)
     VALUES (?, ?, ?, ?, ?, NULL)`
  ).bind(
    pairing_id,
    subjectId,
    pkIncoming,
    ch.device_label ?? null,
    now,
  ).run();

  await env.CHALLENGES.delete(kvKey);

  return json({
    schema:          'p31.nodeZero.pairApproveResponse/0.1.0',
    ok:              true,
    pairing_id,
    subject_id:      subjectId,
    m2m_bearer_stub: newM2MPreviewToken(),
    note:            'm2m_bearer_stub is not a full JWT — contract v0 mock; k4-personal policy sync is out of band.',
  });
}

/**
 * POST /api/hardware/telemetry — minimal heartbeat (validates shape; v0 no persistence).
 */
export async function postHardwareTelemetry(body: Record<string, unknown>): Promise<Response> {
  if (body.schema !== 'p31.nodeZero.telemetry/0.1.0') {
    return json({ error: 'expected schema p31.nodeZero.telemetry/0.1.0' }, 400);
  }

  if (typeof body.device_id !== 'string' || body.device_id.length < 4) {
    return json({ error: 'device_id required' }, 400);
  }
  if (typeof body.uptime_sec !== 'number' || body.uptime_sec < 0) {
    return json({ error: 'uptime_sec invalid' }, 400);
  }
  const allowed = new Set(['nominal', 'warn', 'fault', 'unknown']);
  if (typeof body.sensor_state !== 'string' || !allowed.has(body.sensor_state)) {
    return json({ error: 'sensor_state must be nominal|warn|fault|unknown' }, 400);
  }
  if (typeof body.larmor_hz !== 'number' || !Number.isFinite(body.larmor_hz)) {
    return json({ error: 'larmor_hz invalid' }, 400);
  }
  if (typeof body.ts_ms !== 'number') {
    return json({ error: 'ts_ms invalid' }, 400);
  }

  return json({
    schema: 'p31.nodeZero.telemetryAck/0.1.0',
    ok:     true,
    echoed: false,
    note:   'v0 acknowledged only — no KV/D1 telemetry store in Worker yet',
  }, 202);
}
