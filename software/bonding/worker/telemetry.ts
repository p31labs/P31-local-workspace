// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Cloudflare Worker: telemetry relay (Rev B)
//
// PATCH 2: Per-session unique KV keys + KV.list() discovery.
//          Eliminates last-write-wins index corruption.
// PATCH 4: Server-side SHA-256 independent hash verification.
//          Establishes serverVerified flag for Daubert defense.
//
// 14 routes:
//   POST /telemetry                   → handleTelemetryFlush
//   POST /telemetry/seal              → handleTelemetrySeal
//   POST /telemetry/orphan            → handleOrphanRecovery
//   GET  /telemetry/sessions/:roomCode → handleSessionList
//   GET  /telemetry/seal/:sessionId   → handleGetSeal
//   GET  /telemetry/entries/:sessionId → handleGetEntries
//   GET  /love/:sessionId              → handleGetLove       (WCD-M08, read-only)
//   POST /bug-report                   → handleBugReport     (WCD-11)
//   GET  /bug-reports                  → handleBugReportList  (WCD-11)
//   POST /api/room                    → handleRoomCreate     (WCD-13)
//   POST /api/room/:code/join         → handleRoomJoin       (WCD-13)
//   GET  /api/room/:code              → handleRoomState      (WCD-13)
//   PUT  /api/room/:code              → handleRoomUpdate     (WCD-13)
//   POST /api/room/:code/ping         → handleRoomPing       (WCD-13)
// ═══════════════════════════════════════════════════════

export interface Env {
  DB: D1Database;
  TELEMETRY_KV: KVNamespace;
  SPOONS_KV: KVNamespace;
  DISCORD_WEBHOOK_URL?: string;
  GENESIS_GATE_URL?: string;
}

function getQFactor(spoonCount: number): number {
  // Default qFactor based on spoon deficit with hysteresis
  const defaultQFactor = 0.925;
  
  // Calculate variance-based adjustment based on spoon count
  // Lower spoons = higher variance = lower qFactor
  if (spoonCount <= 0) return 0.5; // Critical low spoons
  if (spoonCount >= 20) return 1.0; // Full capacity
  
  // Exponential decay based on spoon deficit
  const deficitRatio = (20 - spoonCount) / 20;
  const varianceFactor = Math.exp(-3 * deficitRatio);
  
  return defaultQFactor * varianceFactor;
}

function emitToGenesis(env: Env, type: string, payload: Record<string, unknown>): void {
  const url = (env.GENESIS_GATE_URL ?? 'https://genesis.p31ca.org') + '/event';
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: 'bonding-relay',
      type,
      payload,
      timestamp: new Date().toISOString(),
      session_id: 'relay-' + Math.random().toString(36).slice(2, 8),
    }),
  }).catch(() => { /* never block */ });
}

async function publishSpoonsUpdate(env: Env, sessionId: string, spoonCount: number): Promise<void> {
  const qFactor = getQFactor(spoonCount);
  const url = (env.GENESIS_GATE_URL ?? 'https://genesis.p31ca.org') + '/event';
  
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'bonding-relay',
        type: 'spoons:update',
        payload: {
          sessionId,
          spoons: spoonCount,
          qFactor,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        session_id: 'relay-' + Math.random().toString(36).slice(2, 8),
      }),
    });
  } catch {
    // never block
  }
}

// ── CORS ──

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'X-P31-QFactor': '1',
  'X-P31-Routing-Protocol': 'custom_dsdv',
};

function corsResponse(body: string, status = 200, extra?: Record<string, string>): Response {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...extra },
  });
}

function optionsResponse(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// ── SHA-256 (server-side, independent of client — PATCH 4) ──

async function sha256(data: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function recomputeChainHash(events: TelemetryEvent[]): Promise<string> {
  let hash = '';
  for (const ev of events) {
    const canonical = JSON.stringify({ seq: ev.seq, type: ev.type, payload: ev.payload, ts: ev.ts });
    hash = await sha256(hash + canonical);
  }
  return hash;
}

// ── Types ──

interface TelemetryEvent {
  seq: number;
  type: string;
  payload: Record<string, unknown>;
  ts: number;
  hash: string;
}

interface FlushBody {
  sessionId: string;
  playerId: string;
  roomCode: string | null;
  events: TelemetryEvent[];
}

interface SealBody {
  sessionId: string;
  playerId: string;
  roomCode: string | null;
  entries: TelemetryEvent[];
  clientHash: string;
}

interface OrphanBody {
  orphanSessionId: string;
  playerId: string;
  roomCode: string | null;
  events: TelemetryEvent[];
  clientHash: string;
}

interface SealRecord {
  sessionId: string;
  playerId: string;
  roomCode: string | null;
  clientHash: string;
  serverHash: string;
  serverVerified: boolean;
  eventCount: number;
  sealedAt: number;
  forensicMetadata: {
    userAgent?: string;
    ip?: string;
    isOrphan: boolean;
  };
}

// ── KV key helpers (PATCH 2: per-session unique keys) ──
// Format: session:{roomCode}:{sessionId}
// Listing with prefix: session:{roomCode}: returns all sessions for a room.

function sessionDataKey(sessionId: string): string {
  return `session_data:${sessionId}`;
}

function sessionRoomKey(roomCode: string, sessionId: string): string {
  return `session:${roomCode}:${sessionId}`;
}

function sealKey(sessionId: string): string {
  return `seal:${sessionId}`;
}

// ── Route handlers ──

// GET /love/:sessionId — read-only LOVE total (WCD-M08)
// Computes love from telemetry events already in KV. Never writes.
async function handleGetLove(sessionId: string, env: Env): Promise<Response> {
  const entries = await env.TELEMETRY_KV.get<TelemetryEvent[]>(sessionDataKey(sessionId), 'json');
  if (!entries || entries.length === 0) {
    return corsResponse(JSON.stringify({ love: 0, lastUpdated: null }));
  }

  let love = 0;
  let lastTs = 0;
  for (const ev of entries) {
    if (ev.type === 'MOLECULE_COMPLETED') love += 10;
    else if (ev.type === 'ATOM_PLACED') love += 1;
    else if (ev.type === 'PING_SENT') love += 5;
    else if (ev.type === 'PING_RECEIVED') love += 5;
    else if (ev.type === 'ACHIEVEMENT_UNLOCKED') {
      const reward = ev.payload.loveReward;
      if (typeof reward === 'number') love += reward;
    }
    if (ev.ts > lastTs) lastTs = ev.ts;
  }

  const lastUpdated = lastTs > 0 ? new Date(lastTs).toISOString() : null;
  return corsResponse(JSON.stringify({ love, lastUpdated }));
}

// POST /telemetry — incremental event flush
async function handleTelemetryFlush(req: Request, env: Env): Promise<Response> {
  let body: FlushBody;
  try {
    body = await req.json() as FlushBody;
  } catch {
    return corsResponse(JSON.stringify({ error: 'Invalid JSON' }), 400);
  }

  const { sessionId, playerId, roomCode, events } = body;
  if (!sessionId || !playerId || !Array.isArray(events)) {
    return corsResponse(JSON.stringify({ error: 'Missing fields' }), 400);
  }

  // Append events to existing session data
  const existing = await env.TELEMETRY_KV.get<TelemetryEvent[]>(sessionDataKey(sessionId), 'json') ?? [];
  const merged = mergeEvents(existing, events);
  await env.TELEMETRY_KV.put(sessionDataKey(sessionId), JSON.stringify(merged), { expirationTtl: 7 * 86400 });

  // PATCH 2: register session ID under room namespace (unique key per session)
  if (roomCode) {
    await env.TELEMETRY_KV.put(sessionRoomKey(roomCode, sessionId), sessionId, { expirationTtl: 7 * 86400 });
  }

  // Fire Discord webhook for high-signal events
  for (const ev of events) {
    if (ev.type === 'quest_chain_completed') {
      await fireDiscordWebhook(env, 'quest_complete', roomCode ?? 'solo', playerId, ev.payload);
    } else if (ev.type === 'achievement_unlocked') {
      await fireDiscordWebhook(env, 'love_earned', roomCode ?? 'solo', playerId, ev.payload);
    }
  }

  // Publish spoons update with qFactor
  await publishSpoonsUpdate(env, sessionId, merged.length);

  return corsResponse(JSON.stringify({ ok: true, received: events.length }));
}

// POST /telemetry/seal — finalize session with server hash (PATCH 4)
async function handleTelemetrySeal(req: Request, env: Env, reqObj: Request): Promise<Response> {
  let body: SealBody;
  try {
    body = await req.json() as SealBody;
  } catch {
    return corsResponse(JSON.stringify({ error: 'Invalid JSON' }), 400);
  }

  const { sessionId, playerId, roomCode, entries, clientHash } = body;
  if (!sessionId || !playerId || !Array.isArray(entries)) {
    return corsResponse(JSON.stringify({ error: 'Missing fields' }), 400);
  }

  // Server independently recomputes the hash (PATCH 4 — Daubert defense)
  const serverHash = await recomputeChainHash(entries);
  const serverVerified = serverHash === clientHash;

  const seal: SealRecord = {
    sessionId,
    playerId,
    roomCode: roomCode ?? null,
    clientHash,
    serverHash,
    serverVerified,
    eventCount: entries.length,
    sealedAt: Date.now(),
    forensicMetadata: {
      userAgent: reqObj.headers.get('user-agent') ?? undefined,
      ip: reqObj.headers.get('cf-connecting-ip') ?? undefined,
      isOrphan: false,
    },
  };

  await env.TELEMETRY_KV.put(sealKey(sessionId), JSON.stringify(seal), { expirationTtl: 365 * 86400 });

    // Also persist final event list
    await env.TELEMETRY_KV.put(sessionDataKey(sessionId), JSON.stringify(entries), { expirationTtl: 365 * 86400 });

    // Publish spoons update with qFactor on seal as well
    await publishSpoonsUpdate(env, sessionId, entries.length);

    return corsResponse(JSON.stringify({ ok: true, serverVerified, serverHash }));
}

// POST /telemetry/orphan — recover events from a killed session (NEW)
async function handleOrphanRecovery(req: Request, env: Env, reqObj: Request): Promise<Response> {
  let body: OrphanBody;
  try {
    body = await req.json() as OrphanBody;
  } catch {
    return corsResponse(JSON.stringify({ error: 'Invalid JSON' }), 400);
  }

  const { orphanSessionId, playerId, roomCode, events, clientHash } = body;
  if (!orphanSessionId || !playerId || !Array.isArray(events)) {
    return corsResponse(JSON.stringify({ error: 'Missing fields' }), 400);
  }

  const serverHash = await recomputeChainHash(events);
  const serverVerified = serverHash === clientHash;

  const seal: SealRecord = {
    sessionId: orphanSessionId,
    playerId,
    roomCode: roomCode ?? null,
    clientHash,
    serverHash,
    serverVerified,
    eventCount: events.length,
    sealedAt: Date.now(),
    forensicMetadata: {
      userAgent: reqObj.headers.get('user-agent') ?? undefined,
      ip: reqObj.headers.get('cf-connecting-ip') ?? undefined,
      isOrphan: true,
    },
  };

  await env.TELEMETRY_KV.put(sealKey(orphanSessionId), JSON.stringify(seal), { expirationTtl: 365 * 86400 });
  await env.TELEMETRY_KV.put(sessionDataKey(orphanSessionId), JSON.stringify(events), { expirationTtl: 365 * 86400 });

  if (roomCode) {
    await env.TELEMETRY_KV.put(sessionRoomKey(roomCode, orphanSessionId), orphanSessionId, { expirationTtl: 365 * 86400 });
  }

  return corsResponse(JSON.stringify({ ok: true, recovered: events.length, serverVerified }));
}

// GET /telemetry/sessions/:roomCode — list session IDs for a room (PATCH 2: KV.list)
async function handleSessionList(roomCode: string, env: Env): Promise<Response> {
  if (!roomCode) {
    return corsResponse(JSON.stringify({ error: 'Missing roomCode' }), 400);
  }

  // PATCH 2: KV.list() discovers all unique session keys — no shared index to corrupt
  const prefix = `session:${roomCode}:`;
  const listed = await env.TELEMETRY_KV.list({ prefix });
  const sessionIds = listed.keys.map((k) => k.name.slice(prefix.length));

  return corsResponse(JSON.stringify({ roomCode, sessionIds }));
}

// GET /telemetry/seal/:sessionId — retrieve seal record for a session
async function handleGetSeal(sessionId: string, env: Env): Promise<Response> {
  const seal = await env.TELEMETRY_KV.get<SealRecord>(sealKey(sessionId), 'json');
  if (!seal) {
    return corsResponse(JSON.stringify({ error: 'Not found' }), 404);
  }
  return corsResponse(JSON.stringify(seal));
}

// GET /telemetry/entries/:sessionId — retrieve full event log for a session (NEW)
async function handleGetEntries(sessionId: string, env: Env): Promise<Response> {
  const entries = await env.TELEMETRY_KV.get<TelemetryEvent[]>(sessionDataKey(sessionId), 'json');
  if (!entries) {
    return corsResponse(JSON.stringify({ error: 'Not found' }), 404);
  }
  return corsResponse(JSON.stringify({ sessionId, entries, count: entries.length }));
}

// ── WCD-11: Bug report handlers ──

function bugReportKey(id: string): string {
  return `bug:${id}`;
}

async function handleBugReport(req: Request, env: Env): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = await req.json() as Record<string, unknown>;
  } catch {
    return corsResponse(JSON.stringify({ error: 'Invalid JSON' }), 400);
  }

  if (!body.description || typeof body.description !== 'string' || (body.description as string).trim().length === 0) {
    return corsResponse(JSON.stringify({ error: 'Description required' }), 400);
  }

  const id = `${Date.now()}:${crypto.randomUUID().slice(0, 8)}`;
  await env.TELEMETRY_KV.put(bugReportKey(id), JSON.stringify({
    ...body,
    receivedAt: new Date().toISOString(),
    id,
  }), { expirationTtl: 60 * 60 * 24 * 90 });

  return corsResponse(JSON.stringify({ success: true, id }));
}

async function handleBugReportList(env: Env): Promise<Response> {
  const listed = await env.TELEMETRY_KV.list({ prefix: 'bug:' });
  const reports: unknown[] = [];
  for (const key of listed.keys) {
    const val = await env.TELEMETRY_KV.get(key.name, 'json');
    if (val) reports.push(val);
  }
  return corsResponse(JSON.stringify({ reports, count: reports.length }));
}

// ── WCD-13: Multiplayer room management ──
// The relay is a bulletin board. Each player builds independently in a shared room.
// KV polling every 3-5s. No WebSocket. Family scale (2-6 players).

const ROOM_TTL = 4 * 60 * 60; // 4 hours
const MAX_PLAYERS = 6;
const MAX_PINGS = 50;

interface RoomPlayerState {
  formula: string;
  displayFormula: string;
  atoms: number;
  love: number;
  stability: number;
  completed: boolean;
  achievements: string[];
  breathing?: boolean;
  updatedAt: string;
}

interface RoomPlayer {
  id: string;
  name: string;
  color: string;
  mode: string;
  joinedAt: string;
  state: RoomPlayerState;
}

interface RoomPing {
  id: string;
  from: string;
  to: string;
  reaction: string;
  message?: string;
  timestamp: string;
}

interface Room {
  code: string;
  players: RoomPlayer[];
  pings: RoomPing[];
  createdAt: string;
  updatedAt: string;
  status: 'waiting' | 'active' | 'complete';
}

function roomKey(code: string): string {
  return `room:${code}`;
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// POST /api/room — create room
async function handleRoomCreate(req: Request, env: Env): Promise<Response> {
  let body: { playerName?: string; playerColor?: string; mode?: string };
  try {
    body = await req.json() as typeof body;
  } catch {
    return corsResponse(JSON.stringify({ error: 'Invalid JSON' }), 400);
  }

  const name = (body.playerName ?? '').trim();
  const color = body.playerColor ?? '#4ade80';
  const mode = body.mode ?? 'seed';
  if (!name) return corsResponse(JSON.stringify({ error: 'playerName required' }), 400);

  // Generate unique code (retry up to 5 times on collision)
  let code = '';
  for (let attempt = 0; attempt < 5; attempt++) {
    code = generateRoomCode();
    const existing = await env.TELEMETRY_KV.get(roomKey(code));
    if (!existing) break;
    if (attempt === 4) return corsResponse(JSON.stringify({ error: 'Could not generate unique room code' }), 500);
  }

  const now = new Date().toISOString();
  const player: RoomPlayer = {
    id: 'p_0',
    name,
    color,
    mode,
    joinedAt: now,
    state: { formula: '', displayFormula: '', atoms: 0, love: 0, stability: 0, completed: false, achievements: [], updatedAt: now },
  };

  const room: Room = {
    code,
    players: [player],
    pings: [],
    createdAt: now,
    updatedAt: now,
    status: 'waiting',
  };

  await env.TELEMETRY_KV.put(roomKey(code), JSON.stringify(room), { expirationTtl: ROOM_TTL });
  return corsResponse(JSON.stringify({ code, room }));
}

// POST /api/room/:code/join — join room
async function handleRoomJoin(req: Request, env: Env, code: string): Promise<Response> {
  let body: { playerName?: string; playerColor?: string; mode?: string };
  try {
    body = await req.json() as typeof body;
  } catch {
    return corsResponse(JSON.stringify({ error: 'Invalid JSON' }), 400);
  }

  const name = (body.playerName ?? '').trim();
  const color = body.playerColor ?? '#22d3ee';
  const mode = body.mode ?? 'seed';
  if (!name) return corsResponse(JSON.stringify({ error: 'playerName required' }), 400);

  const raw = await env.TELEMETRY_KV.get(roomKey(code));
  if (!raw) return corsResponse(JSON.stringify({ error: 'Room not found' }), 404);

  const room = JSON.parse(raw) as Room;
  if (room.players.length >= MAX_PLAYERS) {
    return corsResponse(JSON.stringify({ error: 'Room full' }), 409);
  }

  const now = new Date().toISOString();
  const playerId = `p_${room.players.length}`;
  const player: RoomPlayer = {
    id: playerId,
    name,
    color,
    mode,
    joinedAt: now,
    state: { formula: '', displayFormula: '', atoms: 0, love: 0, stability: 0, completed: false, achievements: [], updatedAt: now },
  };

  const wasWaiting = room.status === 'waiting';
  room.players.push(player);
  room.updatedAt = now;
  if (wasWaiting) room.status = 'active';

  await env.TELEMETRY_KV.put(roomKey(code), JSON.stringify(room), { expirationTtl: ROOM_TTL });

  if (wasWaiting) {
    await fireDiscordWebhook(env, 'game_start', code, playerId, {
      playerCount: room.players.length,
      players: room.players.map(p => ({ id: p.id, name: p.name, mode: p.mode })),
    });
  }

  return corsResponse(JSON.stringify({ room }));
}

// GET /api/room/:code — fetch room state
async function handleRoomState(env: Env, code: string): Promise<Response> {
  const raw = await env.TELEMETRY_KV.get(roomKey(code));
  if (!raw) return corsResponse(JSON.stringify({ error: 'Room not found' }), 404);

  const room = JSON.parse(raw) as Room;
  return corsResponse(JSON.stringify({ room }));
}

// PUT /api/room/:code — update player state
async function handleRoomUpdate(req: Request, env: Env, code: string): Promise<Response> {
  let body: { playerId?: string } & Partial<RoomPlayerState>;
  try {
    body = await req.json() as typeof body;
  } catch {
    return corsResponse(JSON.stringify({ error: 'Invalid JSON' }), 400);
  }

  if (!body.playerId) return corsResponse(JSON.stringify({ error: 'playerId required' }), 400);

  const raw = await env.TELEMETRY_KV.get(roomKey(code));
  if (!raw) return corsResponse(JSON.stringify({ error: 'Room not found' }), 404);

  const room = JSON.parse(raw) as Room;
  const player = room.players.find(p => p.id === body.playerId);
  if (!player) return corsResponse(JSON.stringify({ error: 'Player not found' }), 404);

  // Update player state fields
  const now = new Date().toISOString();
  const wasCompleted = player.state.completed;
  if (body.formula !== undefined) player.state.formula = body.formula;
  if (body.displayFormula !== undefined) player.state.displayFormula = body.displayFormula;
  if (body.atoms !== undefined) player.state.atoms = body.atoms;
  if (body.love !== undefined) player.state.love = body.love;
  if (body.stability !== undefined) player.state.stability = body.stability;
  if (body.completed !== undefined) player.state.completed = body.completed;
  if (body.achievements !== undefined) player.state.achievements = body.achievements;
  if (body.breathing !== undefined) player.state.breathing = body.breathing;
  player.state.updatedAt = now;
  room.updatedAt = now;

  await env.TELEMETRY_KV.put(roomKey(code), JSON.stringify(room), { expirationTtl: ROOM_TTL });

  if (!wasCompleted && player.state.completed) {
    await fireDiscordWebhook(env, 'molecule_created', code, body.playerId, {
      formula: player.state.formula,
      displayFormula: player.state.displayFormula,
      love: player.state.love,
      stability: player.state.stability,
    });
  }

  return corsResponse(JSON.stringify({ room }));
}

// POST /api/room/:code/ping — send ping
async function handleRoomPing(req: Request, env: Env, code: string): Promise<Response> {
  let body: { from?: string; to?: string; reaction?: string; message?: string };
  try {
    body = await req.json() as typeof body;
  } catch {
    return corsResponse(JSON.stringify({ error: 'Invalid JSON' }), 400);
  }

  if (!body.from || !body.to || !body.reaction) {
    return corsResponse(JSON.stringify({ error: 'from, to, reaction required' }), 400);
  }

  const raw = await env.TELEMETRY_KV.get(roomKey(code));
  if (!raw) return corsResponse(JSON.stringify({ error: 'Room not found' }), 404);

  const room = JSON.parse(raw) as Room;
  const ping: RoomPing = {
    id: `${Date.now()}_${crypto.randomUUID().slice(0, 6)}`,
    from: body.from,
    to: body.to,
    reaction: body.reaction,
    message: body.message,
    timestamp: new Date().toISOString(),
  };

  room.pings.push(ping);
  // Cap at MAX_PINGS, shift oldest
  if (room.pings.length > MAX_PINGS) {
    room.pings = room.pings.slice(-MAX_PINGS);
  }
  room.updatedAt = new Date().toISOString();

  await env.TELEMETRY_KV.put(roomKey(code), JSON.stringify(room), { expirationTtl: ROOM_TTL });

  // R09: emit relay_message to Genesis Gate
  emitToGenesis(env, 'relay_message', { room_code: code, reaction: body.reaction });

  return corsResponse(JSON.stringify({ success: true }));
}

// ── Discord webhook (best-effort, never blocks relay response) ──

const DISCORD_BONDING_WEBHOOK = 'https://webhook.p31ca.org/webhook/bonding';

async function fireDiscordWebhook(
  env: Env,
  event: string,
  roomCode: string,
  userId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const url = env.DISCORD_WEBHOOK_URL ?? DISCORD_BONDING_WEBHOOK;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, roomCode, userId, data }),
    });
  } catch {
    // best-effort — never block the relay response
  }
}

// ── Merge helper: deduplicate by seq number ──

function mergeEvents(existing: TelemetryEvent[], incoming: TelemetryEvent[]): TelemetryEvent[] {
  const seen = new Set(existing.map((e) => e.seq));
  const merged = [...existing];
  for (const ev of incoming) {
    if (!seen.has(ev)) {
      merged.push(ev);
      seen.add(ev);
    }
  }
  return merged.sort((a, b) => a.seq - b.seq);
}

// ═══════════════════════════════════════════════════════
// WCD-46: D1-backed Genesis Telemetry (100K writes/day)
// ═══════════════════════════════════════════════════════

interface D1TelemetryBody {
  sessionId: string;
  playerId: string;
  eventType: string;
  payload: Record<string, unknown>;
}

async function handleD1Telemetry(req: Request, env: Env): Promise<Response> {
  let body: D1TelemetryBody;
  try {
    body = await req.json() as D1TelemetryBody;
  } catch {
    return corsResponse(JSON.stringify({ error: 'Invalid JSON' }), 400);
  }

  const { sessionId, playerId, eventType, payload } = body;
  if (!sessionId || !playerId || !eventType) {
    return corsResponse(JSON.stringify({ error: 'Missing fields' }), 400);
  }

  const cfRay = req.headers.get('cf-ray') || 'unknown';
  const tlsVersion = req.cf?.tlsVersion || 'unknown';
  const hashChain = await sha256(JSON.stringify(payload) + Date.now().toString());

  try {
    await env.DB.prepare(`
      INSERT INTO genesis_telemetry (session_id, player_id, event_type, payload, cf_ray, tls_version, hash_chain)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(sessionId, playerId, eventType, JSON.stringify(payload), cfRay, tlsVersion, hashChain).run();

    return corsResponse(JSON.stringify({ status: 'logged', cfRay }), 200);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`D1 Telemetry Error: ${msg}`);
    return corsResponse(JSON.stringify({ error: msg, queue_locally: true }), 500);
  }
}

async function handleD1GetTelemetry(sessionId: string, env: Env): Promise<Response> {
  try {
    const results = await env.DB.prepare(`
      SELECT * FROM genesis_telemetry WHERE session_id = ? ORDER BY created_at DESC LIMIT 100
    `).bind(sessionId).all();

    return corsResponse(JSON.stringify({ sessionId, events: results.results, count: results.results?.length ?? 0 }), 200);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return corsResponse(JSON.stringify({ error: msg }), 500);
  }
}

// ═══════════════════════════════════════════════════════
// WCD-51: D1-backed Multiplayer State Sync (Replaces KV)
// ═══════════════════════════════════════════════════════

interface D1SyncBody {
  roomId: string;
  playerId: string;
  playerState: Record<string, unknown>;
  roomState: Record<string, unknown>;
}

async function handleD1Sync(req: Request, env: Env): Promise<Response> {
  let body: D1SyncBody;
  try {
    body = await req.json() as D1SyncBody;
  } catch {
    return corsResponse(JSON.stringify({ error: 'Invalid JSON' }), 400);
  }

  const { roomId, playerId, playerState, roomState } = body;
  if (!roomId || !playerId) {
    return corsResponse(JSON.stringify({ error: 'Missing roomId or playerId' }), 400);
  }

  try {
    // Use db.batch() for atomic operations
    await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO bonding_rooms (room_id, state_json, last_active)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(room_id) DO UPDATE SET state_json=excluded.state_json, last_active=CURRENT_TIMESTAMP
      `).bind(roomId, JSON.stringify(roomState ?? {})),

      env.DB.prepare(`
        INSERT INTO bonding_players (player_id, room_id, state_json, last_ping)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(player_id) DO UPDATE SET state_json=excluded.state_json, last_ping=CURRENT_TIMESTAMP
      `).bind(playerId, roomId, JSON.stringify(playerState ?? {}))
    ]);

    // Fetch current peers
    const peers = await env.DB.prepare(`
      SELECT * FROM bonding_players WHERE room_id = ?
    `).bind(roomId).all();

    return corsResponse(JSON.stringify({ synced: true, peers: peers.results }), 200);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`D1 Sync Error: ${msg}`);
    return corsResponse(JSON.stringify({ error: msg }), 500);
  }
}

// ── CWP-BOOK-002: Book session event handler ──

interface BookEvent {
  sessionId: string;
  readerId: string;
  pageId: number;
  event: 'page_view' | 'session_start' | 'session_complete';
  timestamp: number;
  bookVersion: '1.0';
}

function bookSessionKey(sessionId: string): string {
  return `book_session:${sessionId}`;
}

async function handleBookSession(req: Request, env: Env): Promise<Response> {
  let body: BookEvent;
  try {
    body = await req.json() as BookEvent;
  } catch {
    return corsResponse(JSON.stringify({ error: 'Invalid JSON' }), 400);
  }

  const { sessionId, readerId, pageId, event, timestamp, bookVersion } = body;
  if (!sessionId || !readerId || typeof pageId !== 'number' || !event || !timestamp) {
    return corsResponse(JSON.stringify({ error: 'Missing fields' }), 400);
  }

  const key = bookSessionKey(sessionId);
  const existing = await env.TELEMETRY_KV.get<BookEvent[]>(key, 'json') ?? [];
  existing.push({ sessionId, readerId, pageId, event, timestamp, bookVersion });
  await env.TELEMETRY_KV.put(key, JSON.stringify(existing), { expirationTtl: 365 * 86400 });

  return corsResponse(JSON.stringify({ ok: true }));
}

// ── SCE Cross-post: Social Content Engine announcement to game ──

async function handleSCEAnnounce(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as {
      title: string;
      message: string;
      pillar: string;
      platforms: string[];
    };

    // Fire to Discord for public announcement
    await fireDiscordWebhook(env, 'social_announce', 'SCE', 'system', {
      title: body.title,
      message: body.message,
      pillar: body.pillar,
      platforms: body.platforms
    });

    return corsResponse(JSON.stringify({ success: true, event: 'social_announce' }));
  } catch (e) {
    return corsResponse(JSON.stringify({ error: String(e) }), 400);
  }
}

// ── Router ──

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    const path = url.pathname;

    // OPTIONS preflight for all endpoints
    if (method === 'OPTIONS') {
      return optionsResponse();
    }

    // POST /telemetry
    if (method === 'POST' && path === '/telemetry') {
      return handleTelemetryFlush(request, env);
    }

    // POST /telemetry/seal
    if (method === 'POST' && path === '/telemetry/seal') {
      return handleTelemetrySeal(request, env, request);
    }

    // POST /telemetry/orphan
    if (method === 'POST' && path === '/telemetry/orphan') {
      return handleOrphanRecovery(request, env, request);
    }

    // GET /telemetry/sessions/:roomCode
    const sessionsMatch = path.match(/^\/telemetry\/sessions\/([A-Z0-9]{4,8})$/i);
    if (method === 'GET' && sessionsMatch) {
      return handleSessionList(sessionsMatch[1], env);
    }

    // GET /telemetry/seal/:sessionId
    const sealMatch = path.match(/^\/telemetry\/seal\/(.+)$/);
    if (method === 'GET' && sealMatch) {
      return handleGetSeal(sealMatch[1], env);
    }

    // GET /telemetry/entries/:sessionId
    const entriesMatch = path.match(/^\/telemetry\/entries\/(.+)$/);
    if (method === 'GET' && entriesMatch) {
      return handleGetEntries(entriesMatch[1], env);
    }

    // WCD-M08: GET /love/:sessionId — read-only LOVE total
    const loveMatch = path.match(/^\/love\/(.+)$/);
    if (method === 'GET' && loveMatch) {
      return handleGetLove(loveMatch[1], env);
    }

    // WCD-11: POST /bug-report
    if (method === 'POST' && path === '/bug-report') {
      return handleBugReport(request, env);
    }

    // WCD-11: GET /bug-reports
    if (method === 'GET' && path === '/bug-reports') {
      return handleBugReportList(env);
    }

    // WCD-13: POST /api/room — create room
    if (method === 'POST' && path === '/api/room') {
      return handleRoomCreate(request, env);
    }

    // WCD-13: POST /api/room/:code/join — join room
    const joinMatch = path.match(/^\/api\/room\/([A-Z0-9]{4,8})\/join$/i);
    if (method === 'POST' && joinMatch) {
      return handleRoomJoin(request, env, joinMatch[1].toUpperCase());
    }

    // WCD-13: POST /api/room/:code/ping — send ping
    const pingMatch = path.match(/^\/api\/room\/([A-Z0-9]{4,8})\/ping$/i);
    if (method === 'POST' && pingMatch) {
      return handleRoomPing(request, env, pingMatch[1].toUpperCase());
    }

    // WCD-13: PUT /api/room/:code — update player state
    const updateMatch = path.match(/^\/api\/room\/([A-Z0-9]{4,8})$/i);
    if (method === 'PUT' && updateMatch) {
      return handleRoomUpdate(request, env, updateMatch[1].toUpperCase());
    }

    // WCD-13: GET /api/room/:code — fetch room state
    const stateMatch = path.match(/^\/api\/room\/([A-Z0-9]{4,8})$/i);
    if (method === 'GET' && stateMatch) {
      return handleRoomState(env, stateMatch[1].toUpperCase());
    }

    // Health check endpoint
    if (method === 'GET' && path === '/health') {
      return corsResponse(JSON.stringify({
        status: 'ok',
        worker: 'telemetry',
        version: '1.3.0',
        timestamp: new Date().toISOString(),
        routes: [
          'POST /telemetry',
          'POST /telemetry/seal',
          'POST /telemetry/orphan',
          'GET  /telemetry/sessions/:roomCode',
          'GET  /telemetry/seal/:sessionId',
          'GET  /telemetry/entries/:sessionId',
          'GET  /love/:sessionId',
          'POST /bug-report',
          'GET  /bug-reports',
          'POST /api/room',
          'POST /api/room/:code/join',
          'POST /api/room/:code/ping',
          'PUT  /api/room/:code',
          'GET  /api/room/:code',
          'GET  /health',
          'POST /book-session',
          'POST /api/social/announce'
        ]
      }), 200);
    }

    // CWP-BOOK-002: POST /book-session — book engagement event
    if (method === 'POST' && path === '/book-session') {
      return handleBookSession(request, env);
    }

    // SCE Cross-post: Announce social content to BONDING game
    const sceMatch = path.match(/^\/api\/social\/announce$/i);
    if (method === 'POST' && sceMatch) {
      return handleSCEAnnounce(request, env);
    }

    // WCD-46: POST /d1/telemetry — D1-backed telemetry ingestion
    if (method === 'POST' && path === '/d1/telemetry') {
      return handleD1Telemetry(request, env);
    }

    // WCD-51: POST /d1/sync — D1-backed multiplayer state sync
    if (method === 'POST' && path === '/d1/sync') {
      return handleD1Sync(request, env);
    }

    // WCD-46: GET /d1/telemetry/:sessionId — retrieve telemetry
    const d1TelemetryMatch = path.match(/^\/d1\/telemetry\/(.+)$/);
    if (method === 'GET' && d1TelemetryMatch) {
      return handleD1GetTelemetry(d1TelemetryMatch[1], env);
    }

    return corsResponse(JSON.stringify({ error: 'Not found' }), 404);
  },
};
