// spaceship-earth/worker/index.ts
// Spaceship Earth telemetry Worker — separate from BONDING Genesis Block relay.
//
// KV namespace: SPACESHIP_TELEMETRY (separate from BONDING_TELEMETRY)
// Server-side SHA-256 on all writes (same pattern as Genesis Block).
//
// Routes:
//   POST /session/start     → handleSessionStart
//   POST /session/heartbeat → handleSessionHeartbeat
//   POST /session/end       → handleSessionEnd
//   POST /state/:did        → handleStatePost (Ed25519-verified state push)
//   GET  /state/:did        → handleStateGet  (read latest verified state)

export interface Env {
  SPACESHIP_TELEMETRY: KVNamespace;
  OCTOPRINT_URL?: string;
  OCTOPRINT_API_KEY?: string;
  GCODE_ALLOWLIST?: string; // comma-separated filenames
}

// ── CORS ──

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function corsResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function optionsResponse(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// ── SHA-256 (server-side, independent of client) ──

async function sha256(data: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── KV key helpers ──

function sessionKey(sessionId: string): string {
  return `session:${sessionId}`;
}

// ── Types ──

interface SessionRecord {
  sessionId: string;
  startedAt: string;
  userAgent?: string;
  ip?: string;
  heartbeats: HeartbeatRecord[];
  endedAt?: string;
  serverHash: string;
}

interface HeartbeatRecord {
  room: string;
  durationMs: number;
  spoons: number;
  ts: string;
}

// ── Handlers ──

// POST /session/start — create session
async function handleSessionStart(req: Request, env: Env): Promise<Response> {
  let body: { timestamp?: string; userAgent?: string };
  try {
    body = await req.json() as typeof body;
  } catch {
    return corsResponse(JSON.stringify({ error: 'Invalid JSON' }), 400);
  }

  const sessionId = crypto.randomUUID();
  const startedAt = body.timestamp ?? new Date().toISOString();
  const canonical = JSON.stringify({ sessionId, startedAt });
  const serverHash = await sha256(canonical);

  const session: SessionRecord = {
    sessionId,
    startedAt,
    userAgent: req.headers.get('user-agent') ?? undefined,
    ip: req.headers.get('cf-connecting-ip') ?? undefined,
    heartbeats: [],
    serverHash,
  };

  await env.SPACESHIP_TELEMETRY.put(sessionKey(sessionId), JSON.stringify(session), {
    expirationTtl: 30 * 86400, // 30 days
  });

  return corsResponse(JSON.stringify({ ok: true, sessionId, serverHash }));
}

// POST /session/heartbeat — record room visit duration
async function handleSessionHeartbeat(req: Request, env: Env): Promise<Response> {
  let body: { sessionId?: string; room?: string; durationMs?: number; spoons?: number };
  try {
    body = await req.json() as typeof body;
  } catch {
    return corsResponse(JSON.stringify({ error: 'Invalid JSON' }), 400);
  }

  const { sessionId, room, durationMs, spoons } = body;
  if (!sessionId || !room || durationMs === undefined) {
    return corsResponse(JSON.stringify({ error: 'Missing fields' }), 400);
  }

  const raw = await env.SPACESHIP_TELEMETRY.get(sessionKey(sessionId));
  if (!raw) {
    return corsResponse(JSON.stringify({ error: 'Session not found' }), 404);
  }

  const session = JSON.parse(raw) as SessionRecord;
  const heartbeat: HeartbeatRecord = {
    room,
    durationMs,
    spoons: spoons ?? 0,
    ts: new Date().toISOString(),
  };
  session.heartbeats.push(heartbeat);

  const canonical = JSON.stringify({ sessionId, heartbeats: session.heartbeats });
  session.serverHash = await sha256(canonical);

  await env.SPACESHIP_TELEMETRY.put(sessionKey(sessionId), JSON.stringify(session), {
    expirationTtl: 30 * 86400,
  });

  return corsResponse(JSON.stringify({ ok: true, serverHash: session.serverHash }));
}

// POST /session/end — finalize session
async function handleSessionEnd(req: Request, env: Env): Promise<Response> {
  let body: { sessionId?: string };
  try {
    body = await req.json() as typeof body;
  } catch {
    return corsResponse(JSON.stringify({ error: 'Invalid JSON' }), 400);
  }

  const { sessionId } = body;
  if (!sessionId) {
    return corsResponse(JSON.stringify({ error: 'Missing sessionId' }), 400);
  }

  const raw = await env.SPACESHIP_TELEMETRY.get(sessionKey(sessionId));
  if (!raw) {
    return corsResponse(JSON.stringify({ error: 'Session not found' }), 404);
  }

  const session = JSON.parse(raw) as SessionRecord;
  session.endedAt = new Date().toISOString();

  const canonical = JSON.stringify({ sessionId, startedAt: session.startedAt, endedAt: session.endedAt, heartbeats: session.heartbeats });
  session.serverHash = await sha256(canonical);

  await env.SPACESHIP_TELEMETRY.put(sessionKey(sessionId), JSON.stringify(session), {
    expirationTtl: 365 * 86400, // 1 year for completed sessions
  });

  return corsResponse(JSON.stringify({ ok: true, serverHash: session.serverHash }));
}

// ── BS58 decoder (minimal, no dep) ──

const BS58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function bs58Decode(str: string): Uint8Array {
  const bytes = [0];
  for (const char of str) {
    const idx = BS58_ALPHABET.indexOf(char);
    if (idx === -1) throw new Error(`Invalid BS58 char: ${char}`);
    let carry = idx;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  const leadingOnes = str.match(/^1*/)?.[0].length ?? 0;
  const result = new Uint8Array(leadingOnes + bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    result[leadingOnes + bytes.length - 1 - i] = bytes[i];
  }
  return result;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Extract raw Ed25519 public key bytes from a did:key DID.
 * Format: did:key:z{bs58(0xed01 + 32-byte-pubkey)}
 */
function didToPublicKeyBytes(did: string): Uint8Array {
  if (!did.startsWith('did:key:z')) {
    throw new Error('Invalid DID format');
  }
  const encoded = did.slice('did:key:z'.length);
  const decoded = bs58Decode(encoded);
  if (decoded.length < 34 || decoded[0] !== 0xed || decoded[1] !== 0x01) {
    throw new Error('Invalid DID: not Ed25519');
  }
  return decoded.slice(2);
}

function stateKey(did: string): string {
  return `state:${did}`;
}

// ── State types ──

interface StatePayload {
  love: number;
  spoons: number;
  careScore: number;
  timestamp: number;
}

interface StateRecord {
  payload: StatePayload;
  serverHash: string;
  updatedAt: string;
}

// POST /state/:did — Ed25519-verified state push
async function handleStatePost(req: Request, env: Env, did: string): Promise<Response> {
  let body: { payload?: StatePayload; signature?: string };
  try {
    body = await req.json() as typeof body;
  } catch {
    return corsResponse(JSON.stringify({ error: 'Invalid JSON' }), 400);
  }

  const { payload, signature } = body;
  if (!payload || !signature || payload.timestamp === undefined) {
    return corsResponse(JSON.stringify({ error: 'Missing payload or signature' }), 400);
  }

  // Extract public key from DID
  let pubKeyBytes: Uint8Array;
  try {
    pubKeyBytes = didToPublicKeyBytes(did);
  } catch (err) {
    return corsResponse(JSON.stringify({ error: (err as Error).message }), 400);
  }

  // Import as Ed25519 public CryptoKey
  let pubKey: CryptoKey;
  try {
    pubKey = await crypto.subtle.importKey(
      'raw', pubKeyBytes,
      { name: 'Ed25519' }, false, ['verify'],
    );
  } catch {
    return corsResponse(JSON.stringify({ error: 'Failed to import public key' }), 400);
  }

  // Verify signature against canonical payload JSON
  const canonical = JSON.stringify(payload);
  const dataBytes = new TextEncoder().encode(canonical);
  const sigBytes = hexToBytes(signature);

  let valid: boolean;
  try {
    valid = await crypto.subtle.verify('Ed25519', pubKey, sigBytes, dataBytes);
  } catch {
    return corsResponse(JSON.stringify({ error: 'Signature verification failed' }), 400);
  }

  if (!valid) {
    return corsResponse(JSON.stringify({ error: 'SIGNATURE_INVALID' }), 403);
  }

  // Server-side hash for Daubert chain
  const serverHash = await sha256(canonical);

  const record: StateRecord = {
    payload,
    serverHash,
    updatedAt: new Date().toISOString(),
  };

  await env.SPACESHIP_TELEMETRY.put(stateKey(did), JSON.stringify(record), {
    expirationTtl: 90 * 86400, // 90 days
  });

  return corsResponse(JSON.stringify({ ok: true, serverHash }));
}

// GET /state/:did — read latest verified state
async function handleStateGet(env: Env, did: string): Promise<Response> {
  const raw = await env.SPACESHIP_TELEMETRY.get(stateKey(did));
  if (!raw) {
    return corsResponse(JSON.stringify({ error: 'No state for DID' }), 404);
  }
  return corsResponse(raw);
}

// ── Mint K4 types (WCD-M19) ──

interface MintK4Signature {
  did: string;
  signature: string;
}

interface MintK4Body {
  nonce: string;
  canonicalTimestamp: number;
  signatures: MintK4Signature[];
  gcodeFile: string;
}

interface SynthesisRecord {
  nonce: string;
  canonicalTimestamp: number;
  dids: string[];
  gcodeFile: string;
  serverHash: string;
  mintedAt: string;
}

// POST /api/mint-k4 — Verify 4 Ed25519 signatures, trigger 3D print
async function handleMintK4(req: Request, env: Env): Promise<Response> {
  let body: MintK4Body;
  try {
    body = await req.json() as MintK4Body;
  } catch {
    return corsResponse(JSON.stringify({ error: 'Invalid JSON' }), 400);
  }

  const { nonce, canonicalTimestamp, signatures, gcodeFile } = body;

  // Validate 4 signatures
  if (!nonce || !canonicalTimestamp || !signatures || signatures.length !== 4 || !gcodeFile) {
    return corsResponse(JSON.stringify({ error: 'Requires nonce, canonicalTimestamp, 4 signatures, and gcodeFile' }), 400);
  }

  // Ensure 4 distinct DIDs
  const dids = signatures.map((s) => s.did);
  if (new Set(dids).size !== 4) {
    return corsResponse(JSON.stringify({ error: 'Requires 4 distinct DIDs' }), 400);
  }

  // Nonce replay check
  const nonceKey = `nonce:${nonce}`;
  const existingNonce = await env.SPACESHIP_TELEMETRY.get(nonceKey);
  if (existingNonce) {
    return corsResponse(JSON.stringify({ error: 'REPLAY_DETECTED' }), 409);
  }

  // Construct canonical payload (sorted DIDs for deterministic verification)
  const canonical = JSON.stringify({
    nonce,
    canonicalTimestamp,
    dids: [...dids].sort(),
  });
  const dataBytes = new TextEncoder().encode(canonical);

  // Verify each signature
  for (let i = 0; i < 4; i++) {
    const { did, signature } = signatures[i];
    let pubKeyBytes: Uint8Array;
    try {
      pubKeyBytes = didToPublicKeyBytes(did);
    } catch {
      return corsResponse(JSON.stringify({ error: `Invalid DID at index ${i}` }), 400);
    }

    let pubKey: CryptoKey;
    try {
      pubKey = await crypto.subtle.importKey(
        'raw', pubKeyBytes,
        { name: 'Ed25519' }, false, ['verify'],
      );
    } catch {
      return corsResponse(JSON.stringify({ error: `Failed to import key at index ${i}` }), 400);
    }

    const sigBytes = hexToBytes(signature);
    let valid: boolean;
    try {
      valid = await crypto.subtle.verify('Ed25519', pubKey, sigBytes, dataBytes);
    } catch {
      return corsResponse(JSON.stringify({ error: `Verification error at index ${i}` }), 400);
    }

    if (!valid) {
      return corsResponse(JSON.stringify({ error: 'SIGNATURE_INVALID', index: i }), 403);
    }
  }

  // Consume nonce (24h TTL)
  await env.SPACESHIP_TELEMETRY.put(nonceKey, '1', { expirationTtl: 86400 });

  // G-code allowlist check
  const allowlist = (env.GCODE_ALLOWLIST ?? 'k4_node_v1.gcode').split(',').map((f) => f.trim());
  if (!allowlist.includes(gcodeFile)) {
    return corsResponse(JSON.stringify({ error: 'GCODE_NOT_ALLOWED' }), 403);
  }

  // OctoPrint integration (if configured)
  let printResult: string | null = null;
  if (env.OCTOPRINT_URL && env.OCTOPRINT_API_KEY) {
    // Preflight: check printer state
    try {
      const printerRes = await fetch(`${env.OCTOPRINT_URL}/api/printer`, {
        headers: { 'X-Api-Key': env.OCTOPRINT_API_KEY },
      });
      if (!printerRes.ok) {
        return corsResponse(JSON.stringify({ error: 'PRINTER_UNREACHABLE' }), 409);
      }
      const printerState = await printerRes.json() as { state?: { flags?: { printing?: boolean } } };
      if (printerState.state?.flags?.printing) {
        return corsResponse(JSON.stringify({ error: 'PRINTER_BUSY' }), 409);
      }
    } catch {
      return corsResponse(JSON.stringify({ error: 'PRINTER_CONNECTION_FAILED' }), 409);
    }

    // Fire print job
    try {
      const jobRes = await fetch(`${env.OCTOPRINT_URL}/api/files/local/${gcodeFile}`, {
        method: 'POST',
        headers: {
          'X-Api-Key': env.OCTOPRINT_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command: 'select', print: true }),
      });
      printResult = jobRes.ok ? 'PRINT_STARTED' : `PRINT_FAILED_${jobRes.status}`;
    } catch {
      printResult = 'PRINT_DISPATCH_ERROR';
    }
  }

  // Log synthesis to KV (365 days)
  const serverHash = await sha256(canonical);
  const synthesis: SynthesisRecord = {
    nonce,
    canonicalTimestamp,
    dids: [...dids].sort(),
    gcodeFile,
    serverHash,
    mintedAt: new Date().toISOString(),
  };
  await env.SPACESHIP_TELEMETRY.put(`synthesis:${nonce}`, JSON.stringify(synthesis), {
    expirationTtl: 365 * 86400,
  });

  return corsResponse(JSON.stringify({
    ok: true,
    nonce,
    serverHash,
    printResult: printResult ?? 'NO_PRINTER_CONFIGURED',
  }));
}

// ── Router ──

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    const path = url.pathname;

    if (method === 'OPTIONS') {
      return optionsResponse();
    }

    if (method === 'POST' && path === '/session/start') {
      return handleSessionStart(request, env);
    }

    if (method === 'POST' && path === '/session/heartbeat') {
      return handleSessionHeartbeat(request, env);
    }

    if (method === 'POST' && path === '/session/end') {
      return handleSessionEnd(request, env);
    }

    // M19: Reactor Core — K4 mint
    if (method === 'POST' && path === '/api/mint-k4') {
      return handleMintK4(request, env);
    }

    // /state/:did routes
    const stateMatch = path.match(/^\/state\/(.+)$/);
    if (stateMatch) {
      const did = decodeURIComponent(stateMatch[1]);
      if (method === 'POST') return handleStatePost(request, env, did);
      if (method === 'GET') return handleStateGet(env, did);
    }

    // R05: Health endpoint — CWP-2026-014
    if (method === 'GET' && path === '/health') {
      return corsResponse(JSON.stringify({
        service: 'spaceship-relay',
        status: 'ok',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        bindings: ['SPACESHIP_TELEMETRY'],
        routes: [
          'POST /session/start',
          'POST /session/heartbeat',
          'POST /session/end',
          'POST /api/mint-k4',
          'POST /state/:did',
          'GET  /state/:did',
          'GET  /health',
        ],
      }));
    }

    return corsResponse(JSON.stringify({ error: 'Not found' }), 404);
  },
};
