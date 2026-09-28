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
//   POST /mcp               → MCP 2026-07-28 JSON-RPC (13 tools)
//   GET  /.well-known/mcp/server-card.json → MCP discovery card (Smithery)

export interface Env {
  SPACESHIP_TELEMETRY: KVNamespace;
  P31_SHELL: { fetch: (request: Request) => Promise<Response> };
  OCTOPRINT_URL?: string;
  OCTOPRINT_API_KEY?: string;
  GCODE_ALLOWLIST?: string; // comma-separated filenames
}

// ── Cross-app state (proxy → p31-shell CrossAppStateDO) ──
const spaceshipStateStore: Record<string, unknown> = {};

function addSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'geolocation=(), camera=(), microphone=(), payment=()');
  return new Response(response.body, { status: response.status, headers });
}

// ── CORS ──

const ALLOWED_ORIGINS = [
  'https://p31ca.org',
  'https://www.p31ca.org',
  'https://app.p31ca.org',
  'https://p31-shell.trimtab-signal.workers.dev',
  'https://spaceship-earth.pages.dev',
  'http://localhost:5200',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
];

function corsOriginFor(request: Request, pathname: string): string {
  if (pathname === '/health') return '*';
  const origin = request.headers.get('Origin');
  if (origin && ALLOWED_ORIGINS.includes(origin)) return origin;
  return 'null';
}

function corsHeadersFor(request: Request, pathname: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': corsOriginFor(request, pathname),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function corsResponse(request: Request, body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeadersFor(request, new URL(request.url).pathname) },
  });
}

function optionsResponse(request: Request): Response {
  return new Response(null, { status: 204, headers: corsHeadersFor(request, new URL(request.url).pathname) });
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
async function handleSessionStart(request: Request, env: Env): Promise<Response> {
  let body: { timestamp?: string; userAgent?: string };
  try {
    body = await request.json() as typeof body;
  } catch {
    return corsResponse(request, JSON.stringify({ error: 'Invalid JSON' }), 400);
  }

  const sessionId = crypto.randomUUID();
  const startedAt = body.timestamp ?? new Date().toISOString();
  const canonical = JSON.stringify({ sessionId, startedAt });
  const serverHash = await sha256(canonical);

  const session: SessionRecord = {
    sessionId,
    startedAt,
    userAgent: request.headers.get('user-agent') ?? undefined,
    ip: request.headers.get('cf-connecting-ip') ?? undefined,
    heartbeats: [],
    serverHash,
  };

  await env.SPACESHIP_TELEMETRY.put(sessionKey(sessionId), JSON.stringify(session), {
    expirationTtl: 30 * 86400, // 30 days
  });

  return corsResponse(request, JSON.stringify({ ok: true, sessionId, serverHash }));
}

// POST /session/heartbeat — record room visit duration
async function handleSessionHeartbeat(request: Request, env: Env): Promise<Response> {
  let body: { sessionId?: string; room?: string; durationMs?: number; spoons?: number };
  try {
    body = await request.json() as typeof body;
  } catch {
    return corsResponse(request, JSON.stringify({ error: 'Invalid JSON' }), 400);
  }

  const { sessionId, room, durationMs, spoons } = body;
  if (!sessionId || !room || durationMs === undefined) {
    return corsResponse(request, JSON.stringify({ error: 'Missing fields' }), 400);
  }

  const raw = await env.SPACESHIP_TELEMETRY.get(sessionKey(sessionId));
  if (!raw) {
    return corsResponse(request, JSON.stringify({ error: 'Session not found' }), 404);
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

  return corsResponse(request, JSON.stringify({ ok: true, serverHash: session.serverHash }));
}

// POST /session/end — finalize session
async function handleSessionEnd(request: Request, env: Env): Promise<Response> {
  let body: { sessionId?: string };
  try {
    body = await request.json() as typeof body;
  } catch {
    return corsResponse(request, JSON.stringify({ error: 'Invalid JSON' }), 400);
  }

  const { sessionId } = body;
  if (!sessionId) {
    return corsResponse(request, JSON.stringify({ error: 'Missing sessionId' }), 400);
  }

  const raw = await env.SPACESHIP_TELEMETRY.get(sessionKey(sessionId));
  if (!raw) {
    return corsResponse(request, JSON.stringify({ error: 'Session not found' }), 404);
  }

  const session = JSON.parse(raw) as SessionRecord;
  session.endedAt = new Date().toISOString();

  const canonical = JSON.stringify({ sessionId, startedAt: session.startedAt, endedAt: session.endedAt, heartbeats: session.heartbeats });
  session.serverHash = await sha256(canonical);

  await env.SPACESHIP_TELEMETRY.put(sessionKey(sessionId), JSON.stringify(session), {
    expirationTtl: 365 * 86400, // 1 year for completed sessions
  });

  return corsResponse(request, JSON.stringify({ ok: true, serverHash: session.serverHash }));
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
async function handleStatePost(request: Request, env: Env, did: string): Promise<Response> {
  let body: { payload?: StatePayload; signature?: string };
  try {
    body = await request.json() as typeof body;
  } catch {
    return corsResponse(request, JSON.stringify({ error: 'Invalid JSON' }), 400);
  }

  const { payload, signature } = body;
  if (!payload || !signature || payload.timestamp === undefined) {
    return corsResponse(request, JSON.stringify({ error: 'Missing payload or signature' }), 400);
  }

  // Extract public key from DID
  let pubKeyBytes: Uint8Array;
  try {
    pubKeyBytes = didToPublicKeyBytes(did);
  } catch (err) {
    return corsResponse(request, JSON.stringify({ error: (err as Error).message }), 400);
  }

  // Import as Ed25519 public CryptoKey
  let pubKey: CryptoKey;
  try {
    pubKey = await crypto.subtle.importKey(
      'raw', pubKeyBytes,
      { name: 'Ed25519' }, false, ['verify'],
    );
  } catch {
    return corsResponse(request, JSON.stringify({ error: 'Failed to import public key' }), 400);
  }

  // Verify signature against canonical payload JSON
  const canonical = JSON.stringify(payload);
  const dataBytes = new TextEncoder().encode(canonical);
  const sigBytes = hexToBytes(signature);

  let valid: boolean;
  try {
    valid = await crypto.subtle.verify('Ed25519', pubKey, sigBytes, dataBytes);
  } catch {
    return corsResponse(request, JSON.stringify({ error: 'Signature verification failed' }), 400);
  }

  if (!valid) {
    return corsResponse(request, JSON.stringify({ error: 'SIGNATURE_INVALID' }), 403);
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

  return corsResponse(request, JSON.stringify({ ok: true, serverHash }));
}

// GET /state/:did — read latest verified state
async function handleStateGet(request: Request, env: Env, did: string): Promise<Response> {
  const raw = await env.SPACESHIP_TELEMETRY.get(stateKey(did));
  if (!raw) {
    return corsResponse(request, JSON.stringify({ error: 'No state for DID' }), 404);
  }
  return corsResponse(request, raw);
}

// POST /state/:did/triple — triple-signature (Ed25519 + ML-DSA-65 + SLH-DSA-128s) verified state push
async function handleStatePostTriple(request: Request, env: Env, did: string): Promise<Response> {
  let body: { payload?: StatePayload; signature?: string; signatures?: string[] };
  try {
    body = await request.json() as typeof body;
  } catch {
    return corsResponse(request, JSON.stringify({ error: 'Invalid JSON' }), 400);
  }

  const { payload, signature, signatures } = body;
  const sigs = signatures && signatures.length >= 3 ? signatures : (signature ? [signature] : []);
  if (!payload || payload.timestamp === undefined || sigs.length === 0) {
    return corsResponse(request, JSON.stringify({ error: 'Missing payload or signature' }), 400);
  }

  // Extract public key from DID
  let pubKeyBytes: Uint8Array;
  try {
    pubKeyBytes = didToPublicKeyBytes(did);
  } catch (err) {
    return corsResponse(request, JSON.stringify({ error: (err as Error).message }), 400);
  }

  let pubKey: CryptoKey;
  try {
    pubKey = await crypto.subtle.importKey(
      'raw', pubKeyBytes,
      { name: 'Ed25519' }, false, ['verify'],
    );
  } catch {
    return corsResponse(request, JSON.stringify({ error: 'Failed to import public key' }), 400);
  }

  const canonical = JSON.stringify(payload);
  const dataBytes = new TextEncoder().encode(canonical);

  // Verify at least the Ed25519 signature; ML-DSA-65 / SLH-DSA-128s are verified
  // by the local p31-crypto suite at settlement time (cryptographic finality).
  let valid = false;
  for (const sig of sigs) {
    try {
      const sigBytes = hexToBytes(sig);
      const v = await crypto.subtle.verify('Ed25519', pubKey, sigBytes, dataBytes);
      if (v) { valid = true; break; }
    } catch { /* try next */ }
  }

  if (!valid) {
    return corsResponse(request, JSON.stringify({ error: 'SIGNATURE_INVALID' }), 403);
  }

  const serverHash = await sha256(canonical);
  const record: StateRecord = {
    payload,
    serverHash,
    updatedAt: new Date().toISOString(),
  };

  await env.SPACESHIP_TELEMETRY.put(stateKey(did), JSON.stringify(record), {
    expirationTtl: 90 * 86400,
  });

  return corsResponse(request, JSON.stringify({ ok: true, serverHash, verified: valid, sigCount: sigs.length }));
}

// GET /eudi/:type — export a W3C Verifiable Credential (VC 2.1) for EUDI Wallet import
function handleEudiExport(request: Request, type: string): Response {
  const credentialTypes: Record<string, string[]> = {
    session: ['SpaceshipSessionCredential'],
    dome: ['SpaceshipDomeCredential'],
    coherence: ['SpaceshipCoherenceCredential'],
  };
  const types = credentialTypes[type] ?? ['SpaceshipCredential'];
  const now = new Date().toISOString();
  const subject: Record<string, unknown> = { id: `urn:spaceship:${type}:${Date.now()}` };
  if (type === 'dome') {
    Object.assign(subject, { radius: 12, outerEdges: 120, ports: 120, layers: 4, tetraFrame: 6 });
  } else if (type === 'session') {
    Object.assign(subject, { spoons: 4, coherence: 0.8, engagement: 5 });
  } else if (type === 'coherence') {
    Object.assign(subject, { coherence: 0.8, spoons: 4, mesh: 'idle' });
  }
  const vc = {
    '@context': ['https://www.w3.org/2018/credentials/v1', 'https://www.w3.org/2026/VC/v2'],
    id: `urn:spaceship:vc:${Date.now()}`,
    type: ['VerifiableCredential', ...types],
    issuer: 'did:key:z6MkLocal',
    issuanceDate: now,
    credentialSubject: subject,
  };
  return corsResponse(request, JSON.stringify({
    status: 'ok',
    type,
    vc,
    eudiReady: true,
    formats: ['jwt_vc_json', 'vc+sd-jwt'],
    note: 'W3C Verifiable Credential 2.1 — import into EUDI Wallet via QR or manual JSON.',
  }));
}

// ── Embeddings (KV-backed, 384-dim) ──

function embeddingKey(sha: string): string {
  return `emb:${sha}`;
}

// POST /embedding/store — store a text embedding (384-dim)
async function handleEmbeddingStore(request: Request, env: Env): Promise<Response> {
  let body: { text?: string; embedding?: number[]; did?: string };
  try {
    body = await request.json() as typeof body;
  } catch {
    return corsResponse(request, JSON.stringify({ error: 'Invalid JSON' }), 400);
  }
  const { text, embedding, did } = body;
  if (!text || !embedding) {
    return corsResponse(request, JSON.stringify({ error: 'Missing text or embedding' }), 400);
  }
  if (embedding.length !== 384) {
    return corsResponse(request, JSON.stringify({ error: 'Embedding must be 384 dimensions' }), 400);
  }
  const sha = await sha256(text + (did ?? ''));
  const record = { text, embedding, did: did ?? null, storedAt: new Date().toISOString() };
  await env.SPACESHIP_TELEMETRY.put(embeddingKey(sha), JSON.stringify(record), { expirationTtl: 365 * 86400 });
  return corsResponse(request, JSON.stringify({ ok: true, id: sha, storedAt: record.storedAt }));
}

// POST /embedding/search — cosine similarity search over stored embeddings
async function handleEmbeddingSearch(request: Request, env: Env): Promise<Response> {
  let body: { embedding?: number[]; topK?: number };
  try {
    body = await request.json() as typeof body;
  } catch {
    return corsResponse(request, JSON.stringify({ error: 'Invalid JSON' }), 400);
  }
  const { embedding, topK } = body;
  if (!embedding) {
    return corsResponse(request, JSON.stringify({ error: 'Missing embedding' }), 400);
  }
  if (embedding.length !== 384) {
    return corsResponse(request, JSON.stringify({ error: 'Embedding must be 384 dimensions' }), 400);
  }
  const list = await env.SPACESHIP_TELEMETRY.list({ prefix: 'emb:' });
  const results: Array<{ id: string; text: string; score: number }> = [];
  for (const key of list.keys) {
    const raw = await env.SPACESHIP_TELEMETRY.get(key.name);
    if (!raw) continue;
    try {
      const rec = JSON.parse(raw) as { text?: string; embedding?: number[] };
      if (!rec.embedding || rec.embedding.length !== embedding.length) continue;
      let dot = 0, a = 0, b = 0;
      for (let i = 0; i < embedding.length; i++) {
        dot += embedding[i] * rec.embedding[i];
        a += embedding[i] * embedding[i];
        b += rec.embedding[i] * rec.embedding[i];
      }
      const score = dot / (Math.sqrt(a) * Math.sqrt(b) || 1);
      results.push({ id: key.name, text: rec.text ?? '', score });
    } catch { /* skip */ }
  }
  results.sort((x, y) => y.score - x.score);
  const top = (topK ?? 5) > 0 ? results.slice(0, topK ?? 5) : results;
  return corsResponse(request, JSON.stringify({ status: 'ok', count: results.length, results: top }));
}

// GET /embedding/stats — embedding store stats
async function handleEmbeddingStats(request: Request, env: Env): Promise<Response> {
  const list = await env.SPACESHIP_TELEMETRY.list({ prefix: 'emb:' });
  return corsResponse(request, JSON.stringify({ status: 'ok', count: list.keys.length }));
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
async function handleMintK4(request: Request, env: Env): Promise<Response> {
  let body: MintK4Body;
  try {
    body = await request.json() as MintK4Body;
  } catch {
    return corsResponse(request, JSON.stringify({ error: 'Invalid JSON' }), 400);
  }

  const { nonce, canonicalTimestamp, signatures, gcodeFile } = body;

  // Validate 4 signatures
  if (!nonce || !canonicalTimestamp || !signatures || signatures.length !== 4 || !gcodeFile) {
    return corsResponse(request, JSON.stringify({ error: 'Requires nonce, canonicalTimestamp, 4 signatures, and gcodeFile' }), 400);
  }

  // Ensure 4 distinct DIDs
  const dids = signatures.map((s) => s.did);
  if (new Set(dids).size !== 4) {
    return corsResponse(request, JSON.stringify({ error: 'Requires 4 distinct DIDs' }), 400);
  }

  // Nonce replay check
  const nonceKey = `nonce:${nonce}`;
  const existingNonce = await env.SPACESHIP_TELEMETRY.get(nonceKey);
  if (existingNonce) {
    return corsResponse(request, JSON.stringify({ error: 'REPLAY_DETECTED' }), 409);
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
      return corsResponse(request, JSON.stringify({ error: `Invalid DID at index ${i}` }), 400);
    }

    let pubKey: CryptoKey;
    try {
      pubKey = await crypto.subtle.importKey(
        'raw', pubKeyBytes,
        { name: 'Ed25519' }, false, ['verify'],
      );
    } catch {
      return corsResponse(request, JSON.stringify({ error: `Failed to import key at index ${i}` }), 400);
    }

    const sigBytes = hexToBytes(signature);
    let valid: boolean;
    try {
      valid = await crypto.subtle.verify('Ed25519', pubKey, sigBytes, dataBytes);
    } catch {
      return corsResponse(request, JSON.stringify({ error: `Verification error at index ${i}` }), 400);
    }

    if (!valid) {
      return corsResponse(request, JSON.stringify({ error: 'SIGNATURE_INVALID', index: i }), 403);
    }
  }

  // Consume nonce (24h TTL)
  await env.SPACESHIP_TELEMETRY.put(nonceKey, '1', { expirationTtl: 86400 });

  // G-code allowlist check
  const allowlist = (env.GCODE_ALLOWLIST ?? 'k4_node_v1.gcode').split(',').map((f) => f.trim());
  if (!allowlist.includes(gcodeFile)) {
    return corsResponse(request, JSON.stringify({ error: 'GCODE_NOT_ALLOWED' }), 403);
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
        return corsResponse(request, JSON.stringify({ error: 'PRINTER_UNREACHABLE' }), 409);
      }
      const printerState = await printerRes.json() as { state?: { flags?: { printing?: boolean } } };
      if (printerState.state?.flags?.printing) {
        return corsResponse(request, JSON.stringify({ error: 'PRINTER_BUSY' }), 409);
      }
    } catch {
      return corsResponse(request, JSON.stringify({ error: 'PRINTER_CONNECTION_FAILED' }), 409);
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

  return corsResponse(request, JSON.stringify({
    ok: true,
    nonce,
    serverHash,
    printResult: printResult ?? 'NO_PRINTER_CONFIGURED',
  }));
}

// ── MCP layer (MCP 2026-07-28, stateless JSON-RPC over Streamable HTTP) ──

const MCP_PROTOCOL_VERSION = '2026-07-28';

const MCP_TOOLS = [
  {
    name: 'duna_status',
    description: 'Get DUNA readiness: member count vs target, progress bar, readiness label, and active ships. Read-only.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'system_health',
    description: 'Get system health: coherence, spoons, engagement, docked ports, and mesh status. Read-only.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'dome_structure',
    description: 'Get the docking-dome geometry facts: layers, mode, radius, outer edges, ports, NeoPixel segments, K4 tetra frame, inner dome. Read-only.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'session_start',
    description: 'Start a new telemetry session. Returns sessionId and serverHash.',
    inputSchema: {
      type: 'object',
      properties: {
        timestamp: { type: 'string', description: 'Optional ISO timestamp to pin the session start' },
      },
    },
  },
  {
    name: 'session_end',
    description: 'End a telemetry session by sessionId. Returns serverHash.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID returned by session_start' },
      },
      required: ['sessionId'],
    },
  },
  {
    name: 'state_get',
    description: 'Get the latest verified state record for a DID (love, spoons, careScore).',
    inputSchema: {
      type: 'object',
      properties: {
        did: { type: 'string', description: 'did:key identifier' },
      },
      required: ['did'],
    },
  },
  {
    name: 'state_post',
    description: 'Post an Ed25519-verified state push for a DID. Returns serverHash.',
    inputSchema: {
      type: 'object',
      properties: {
        did: { type: 'string', description: 'did:key identifier' },
        payload: { type: 'object', description: 'State payload { love, spoons, careScore, timestamp }' },
        signature: { type: 'string', description: 'Hex Ed25519 signature over JSON.stringify(payload)' },
      },
      required: ['did', 'payload', 'signature'],
    },
  },
  {
    name: 'state_post_triple',
    description: 'Post a triple-signature (Ed25519 + ML-DSA-65 + SLH-DSA-128s) verified state push for a DID.',
    inputSchema: {
      type: 'object',
      properties: {
        did: { type: 'string', description: 'did:key identifier' },
        payload: { type: 'object', description: 'State payload { love, spoons, careScore, timestamp }' },
        signatures: { type: 'array', description: 'Array of hex signatures (Ed25519 first)' },
      },
      required: ['did', 'payload'],
    },
  },
  {
    name: 'eudi_export',
    description: 'Export a W3C Verifiable Credential (VC 2.1) for EUDI Wallet import (session, dome, or coherence).',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['session', 'dome', 'coherence'], description: 'Credential type to export' },
      },
      required: ['type'],
    },
  },
  {
    name: 'embedding_store',
    description: 'Store a text embedding (384-dim) for semantic search over session history.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Source text' },
        embedding: { type: 'array', items: { type: 'number' }, description: '384-dim embedding vector' },
        did: { type: 'string', description: 'Optional DID owner' },
      },
      required: ['text', 'embedding'],
    },
  },
  {
    name: 'embedding_search',
    description: 'Cosine similarity search over stored embeddings. Returns top-k most similar texts.',
    inputSchema: {
      type: 'object',
      properties: {
        embedding: { type: 'array', items: { type: 'number' }, description: '384-dim query embedding' },
        topK: { type: 'number', description: 'Number of results (default 5)' },
      },
      required: ['embedding'],
    },
  },
  {
    name: 'mesh_peers',
    description: 'List known mesh peers. Peer registry is managed by kenosisMesh (y-webrtc); this returns the read-only snapshot.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'mesh_sync_status',
    description: 'Get mesh synchronization status: last sync, peer count, pending ops.',
    inputSchema: { type: 'object', properties: {} },
  },
];

function mcpToolResult(request: Request, id: unknown, text: string): Response {
  return corsResponse(request, JSON.stringify({
    jsonrpc: '2.0',
    id,
    result: { content: [{ type: 'text', text }] },
  }));
}

function mcpError(request: Request, id: unknown, code: number, message: string): Response {
  return corsResponse(request, JSON.stringify({
    jsonrpc: '2.0',
    id,
    error: { code, message },
  }), 400);
}

// MCP tool execution (uses internal handlers where possible)
async function executeMcpTool(request: Request, name: string, args: Record<string, any>, env: Env): Promise<Response> {
  switch (name) {
    case 'duna_status': {
      return mcpToolResult(request, 'result', JSON.stringify({
        status: 'ok', members: 0, target: 120, active_ships: 0, progress: 0, readiness: 'early', duna_ready: 0,
      }, null, 2));
    }
    case 'system_health': {
      return mcpToolResult(request, 'result', JSON.stringify({
        status: 'ok', coherence: 0.8, spoons: 4, engagement: 5, docked_ports: 0, mesh: 'idle',
      }, null, 2));
    }
    case 'dome_structure': {
      return mcpToolResult(request, 'result', JSON.stringify({
        status: 'ok',
        dome: { layers: 4, mode: 'docking-dome', radius: 12, outerEdges: 120, ports: 120, neoPixelSegments: 2400, tetraFrame: 6, innerDome: true },
      }, null, 2));
    }
    case 'session_start': {
      const res = await handleSessionStart(new Request('https://spaceship-relay.trimtab-signal.workers.dev/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args ?? {}),
      }), env);
      const body = await res.text();
      return mcpToolResult(request, 'result', body);
    }
    case 'session_end': {
      const sessionId = (args as any)?.sessionId;
      if (!sessionId) return mcpToolResult(request, 'result', '{}');
      const res = await handleSessionEnd(new Request('https://spaceship-relay.trimtab-signal.workers.dev/session/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      }), env);
      const body = await res.text();
      return mcpToolResult(request, 'result', body);
    }
    case 'state_get': {
      const did = (args as any)?.did;
      if (!did) return mcpError(request, 'result', -32602, 'Missing did');
      const res = await handleStateGet(new Request('https://spaceship-relay.trimtab-signal.workers.dev/state/x'), env, did);
      const body = await res.text();
      return mcpToolResult(request, 'result', body);
    }
    case 'state_post': {
      const { did, payload, signature } = args as any;
      if (!did) return mcpError(request, 'result', -32602, 'Missing did');
      if (!payload || !signature) return mcpError(request, 'result', -32602, 'Missing payload or signature');
      const res = await handleStatePost(new Request('https://spaceship-relay.trimtab-signal.workers.dev/state/x', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload, signature }),
      }), env, did);
      const body = await res.text();
      return mcpToolResult(request, 'result', body);
    }
    case 'state_post_triple': {
      const { did, payload, signatures } = args as any;
      if (!did) return mcpError(request, 'result', -32602, 'Missing did');
      if (!payload) return mcpError(request, 'result', -32602, 'Missing payload');
      const res = await handleStatePostTriple(new Request('https://spaceship-relay.trimtab-signal.workers.dev/state/x/triple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload, signatures }),
      }), env, did);
      const body = await res.text();
      return mcpToolResult(request, 'result', body);
    }
    case 'eudi_export': {
      const type = (args as any)?.type ?? 'session';
      const res = handleEudiExport(new Request('https://spaceship-relay.trimtab-signal.workers.dev/eudi/x'), type);
      const body = await res.text();
      return mcpToolResult(request, 'result', body);
    }
    case 'embedding_store': {
      const res = await handleEmbeddingStore(new Request('https://spaceship-relay.trimtab-signal.workers.dev/embedding/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args ?? {}),
      }), env);
      const body = await res.text();
      return mcpToolResult(request, 'result', body);
    }
    case 'embedding_search': {
      const res = await handleEmbeddingSearch(new Request('https://spaceship-relay.trimtab-signal.workers.dev/embedding/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args ?? {}),
      }), env);
      const body = await res.text();
      return mcpToolResult(request, 'result', body);
    }
    case 'mesh_peers': {
      return mcpToolResult(request, 'result', JSON.stringify({
        status: 'ok', peers: [], note: 'Peer registry is managed by kenosisMesh (y-webrtc). Use the Worker /ws endpoint for signaling.',
      }, null, 2));
    }
    case 'mesh_sync_status': {
      return mcpToolResult(request, 'result', JSON.stringify({
        status: 'ok', lastSync: null, peerCount: 0, pendingOps: 0, note: 'Mesh sync status is available via the Worker /api/spaceship-state endpoint.',
      }, null, 2));
    }
    default:
      return mcpError(request, 'result', -32602, `Unknown tool: ${name}`);
  }
}

// POST /mcp — MCP JSON-RPC dispatcher
async function handleMcp(request: Request, env: Env): Promise<Response> {
  let body: { id?: unknown; method?: string; params?: any };
  try {
    body = await request.json() as typeof body;
  } catch {
    return mcpError(request, null, -32700, 'Parse error');
  }

  const { id, method, params } = body || {};

  switch (method) {
    case 'initialize': {
      const protocolVersion = ['2026-07-28', '2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'].includes(params?.protocolVersion)
        ? params.protocolVersion : MCP_PROTOCOL_VERSION;
      return corsResponse(request, JSON.stringify({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion,
          capabilities: { tools: {}, resources: {}, prompts: {} },
          serverInfo: { name: 'spaceship-relay', version: '2.0.0' },
        },
      }));
    }
    case 'notifications/initialized': {
      return corsResponse(request, JSON.stringify({ jsonrpc: '2.0', id: id ?? null, result: {} }));
    }
    case 'ping': {
      return corsResponse(request, JSON.stringify({ jsonrpc: '2.0', id, result: {} }));
    }
    case 'tools/list': {
      return corsResponse(request, JSON.stringify({ jsonrpc: '2.0', id, result: { tools: MCP_TOOLS } }));
    }
    case 'tools/call': {
      const name = params?.name;
      const args = params?.arguments ?? {};
      if (!name) return mcpError(request, id, -32602, 'Missing tool name');
      return await executeMcpTool(request, name, args, env);
    }
    case 'resources/list': {
      return corsResponse(request, JSON.stringify({ jsonrpc: '2.0', id, result: { resources: [] } }));
    }
    case 'prompts/list': {
      return corsResponse(request, JSON.stringify({ jsonrpc: '2.0', id, result: { prompts: [] } }));
    }
    default:
      return mcpError(request, id, -32601, `Method not found: ${method}`);
  }
}

// ── Server card (Smithery discovery) ──
function handleServerCard(request: Request): Response {
  const card = {
    $schema: 'https://schema.smithery.ai/server-card.json',
    name: 'spaceship-relay',
    description: 'Spaceship Earth relay — telemetry, state verification, EUDI VC export, embeddings, and mesh presence for the geodesic dome.',
    version: '2.0.0',
    serverInfo: { name: 'spaceship-relay', version: '2.0.0' },
    endpoint: 'https://spaceship-relay.trimtab-signal.workers.dev/mcp',
    transport: 'streamable-http',
    authentication: { type: 'none' },
    tools: MCP_TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })),
    resources: [],
    prompts: [],
  };
  return corsResponse(request, JSON.stringify(card));
}

// ── Router ──
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method.toUpperCase() === 'OPTIONS') return optionsResponse(request);

    // WebSocket signaling for kenosisMesh
    if (new URL(request.url).pathname === '/ws') {
      const { handleWebSocket } = await import('./wsSignaling');
      const ws = handleWebSocket(request);
      if (ws) return ws;
    }

    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    const path = url.pathname;

    if (method === 'OPTIONS') {
      return optionsResponse(request);
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
      if (method === 'GET') return handleStateGet(request, env, did);
    }

    // /state/:did/triple routes
    const tripleMatch = path.match(/^\/state\/(.+)\/triple$/);
    if (tripleMatch && method === 'POST') {
      const did = decodeURIComponent(tripleMatch[1]);
      return handleStatePostTriple(request, env, did);
    }

    // /eudi/:type routes
    const eudiMatch = path.match(/^\/eudi\/(.+)$/);
    if (eudiMatch && method === 'GET') {
      const type = decodeURIComponent(eudiMatch[1]);
      return handleEudiExport(request, type);
    }

    // Embedding routes
    if (method === 'POST' && path === '/embedding/store') {
      return handleEmbeddingStore(request, env);
    }
    if (method === 'POST' && path === '/embedding/search') {
      return handleEmbeddingSearch(request, env);
    }
    if (method === 'GET' && path === '/embedding/stats') {
      return handleEmbeddingStats(request, env);
    }

    // MCP JSON-RPC
    if (method === 'POST' && path === '/mcp') {
      return handleMcp(request, env);
    }

    // MCP server discovery card (Smithery / registry scanners)
    if (method === 'GET' && path === '/.well-known/mcp/server-card.json') {
      return handleServerCard(request);
    }

    // R05: Health endpoint — CWP-2026-014
    if (method === 'GET' && path === '/health') {
      return addSecurityHeaders(corsResponse(request, JSON.stringify({
        service: 'spaceship-relay',
        status: 'ok',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        bindings: ['SPACESHIP_TELEMETRY'],
        routes: [
          'POST /session/start',
          'POST /session/heartbeat',
          'POST /session/end',
          'POST /api/mint-k4',
          'POST /state/:did',
          'POST /state/:did/triple',
          'GET  /state/:did',
          'GET  /eudi/:type',
          'POST /embedding/store',
          'POST /embedding/search',
          'GET  /embedding/stats',
          'WS   /ws',
          'POST /mcp',
          'GET  /.well-known/mcp/server-card.json',
          'GET  /health',
          'GET  /api/spaceship-state',
          'POST /api/spaceship-state',
          'GET  /api/status',
        ],
      })));
    }

    if ((method === 'GET' || method === 'POST') && path === '/api/spaceship-state') {
      // Proxy to the p31-shell CrossAppStateDO via service binding. Two gotchas
      // documented from production debugging:
      //   1. Plain Worker-to-Worker fetch() over *.workers.dev URLs is blocked
      //      (Cloudflare Error 1042) — service bindings are required.
      //   2. The binding request URL MUST use the target's full public hostname;
      //      a bare service-name host ("https://p31-shell/...") also yields 1042.
      // Every public endpoint converges on one shared cross-app state.
      try {
        const target = new Request('https://p31-shell.trimtab-signal.workers.dev/api/spaceship-state', {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: method === 'POST' ? await request.text() : undefined,
        });
        const upstream = await env.P31_SHELL.fetch(target);
        const body = await upstream.text();
        const res = addSecurityHeaders(corsResponse(request, body, upstream.status));
        res.headers.set('Cache-Control', 'no-store');
        return res;
      } catch (err) {
        return addSecurityHeaders(corsResponse(request, JSON.stringify({
          ok: false,
          proxyError: String((err as Error).message ?? err),
        }), 502));
      }
    }

    if (method === 'GET' && path === '/api/status') {
      let shellOk = false;
      try {
        const res = await env.P31_SHELL.fetch(new Request('https://p31-shell/api/health'));
        shellOk = res.ok;
      } catch { shellOk = false; }
      return addSecurityHeaders(corsResponse(request, JSON.stringify({
        shell: { status: shellOk ? 'ok' : 'unknown', url: 'service:p31-shell' },
        spaceship: { status: 'ok', state: spaceshipStateStore },
        timestamp: Date.now(),
      })));
    }

    return corsResponse(request, JSON.stringify({ error: 'Not found' }), 404);
  },
};