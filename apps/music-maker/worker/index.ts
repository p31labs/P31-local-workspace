/**
 * The music maker — music-presence Worker + Durable Object.
 *
 * The PRODUCTION transport for the log/presence split (§6 Option B of
 * apps/loom/docs/MUSIC_MAKER_BUILD_PROMPT.md). One Durable Object instance
 * per music room, holding live WebSocket connections with Hibernation enabled:
 * the DO sleeps when idle (no billable Duration during inactivity) and wakes
 * to broadcast — Cloudflare's canonical real-time pattern, economical for
 * intermittent family use.
 *
 *   POST /event      — COMMITTED composition event. Goes through the D1-backed
 *                      log path (gate + hash-chain), NOT the Node commit()
 *                      (which uses node:fs and cannot run in workerd). This is
 *                      the same D1 appendEvent contract the Loom's production
 *                      SSE uses. Gate-validated, seq-stamped, hash-chained.
 *   GET  /events     — read the committed composition.
 *   GET  /stream     — WebSocket upgrade. Live channel carries BOTH committed
 *                      events and ephemeral triggers, distinguishable by shape
 *                      (ephemeral carries {type:'ephemeral'}; committed events
 *                      never do). Hibernation WebSocket API.
 *   POST /ephemeral  — UNGATED broadcast. Never persisted, never gated. The
 *                      live act of a zone sounding when touched. Fans out to
 *                      all sockets in the room, then forgets it.
 *
 * The Vite dev middleware (vite.config.ts) serves the SAME client contract
 * over SSE for local iteration; this Worker is the deployed transport. The
 * client does not care which — the endpoint paths and message shapes match.
 *
 * Production hardening (Tier 1):
 *   • Auth — when MUSIC_ACCESS_AUD is set, the WS upgrade and HTTP endpoints
 *     require a valid Cloudflare Access CF_Authorization cookie (the Loom's
 *     posture, one auth story across both apps). When unset, the room is open
 *     (pre-Access; documented as the known gap).
 *   • Keepalive — setWebSocketAutoResponse answers client pings at the edge
 *     WITHOUT waking the DO (Hibernation-safe). No DO-side setInterval.
 *   • Per-socket state — serializeAttachment/deserializeAttachment survive
 *     eviction; the room rebuilds from the sockets themselves.
 *   • Frame cap — 64KB max inbound frame; oversize frames are rejected before
 *     parse.
 *   • Schema validation — ephemeral presence frames are sanitized at the DO
 *     boundary (the gate already validates committed events).
 *   • Structured logging — JSON console.log, indexed by Workers Logs.
 */

import { DurableObject } from 'cloudflare:workers';
import { ReplayGate, normalizeLegacyScope, type LoomEventInput } from '@p31/canon/loom/gate';
import type { LoomEvent } from '@p31/canon/loom/events';
import { hashRecord, GENESIS_PREV_HASH, type ChainRecord } from '@p31/canon/loom/hash-chain';

export interface Env {
  MUSIC_D1: D1Database;
  MUSIC_ROOM: DurableObjectNamespace<MusicRoom>;
  /** The built SPA (static assets) — served for every non-/api/music request. */
  ASSETS: Fetcher;
  /** Cloudflare Access AUD tag. When set, the WS upgrade + HTTP endpoints
   *  require a valid CF_Authorization cookie (the Loom's auth posture). When
   *  absent (pre-Access), the room is open — document this as the known gap
   *  until Access is wired. One auth story across both apps. */
  MUSIC_ACCESS_AUD?: string;
}

/** Max inbound WS frame size (bytes). A child mashing zones must not be able
 *  to flood the room with a multi-MB frame; reject over the cap before parse. */
const MAX_FRAME_BYTES = 64 * 1024;

/** A room id. One DO instance per room. When Cloudflare Access is wired
 *  (MUSIC_ACCESS_AUD set), the room key derives from the AUTHENTICATED
 *  identity (a stable hash of the Access email) — the room is the family's
 *  instrument, keyed by who's playing, NOT a URL param anyone can forge.
 *  Pre-Access, it falls back to the shared ?room= query (the open-room gap). */
function roomKey(request: Request): string {
  const url = new URL(request.url);
  const identity = identityFrom(request);
  if (identity) return `family:${hash24(identity.email)}`;
  return url.searchParams.get('room')?.trim() || 'family';
}

/** A stable 24-char hex digest of a string (FNV-1a), for room-key derivation
 *  from identity — never the raw email in the room id. */
function hash24(s: string): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0').repeat(3).slice(0, 24);
}

/** The authenticated identity (email) from the Access CF_Authorization JWT,
 *  or null when Access isn't wired / no valid cookie. */
function identityFrom(request: Request): { email: string } | null {
  const cookie = request.headers.get('Cookie') ?? '';
  const m = cookie.match(/(?:^|;\s*)CF_Authorization=([^;]+)/);
  if (!m) return null;
  try {
    const [, payloadB64] = m[1].split('.');
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))) as {
      email?: string;
    };
    return payload.email ? { email: payload.email } : null;
  } catch {
    return null;
  }
}

/** Structured log — JSON so Workers Logs indexes it (observability.logs.
 *  enabled = true in wrangler.toml). */
function log(env: Env, event: Record<string, unknown>): void {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ app: 'music-presence', ...event }));
}

/** Cloudflare Access auth check. When MUSIC_ACCESS_AUD is unset the room is
 *  open (pre-Access). When set, the CF_Authorization cookie must present a
 *  valid Access JWT with the configured aud. The JWT is opaque to us — Access
 *  issues and validates it at the edge — so the check is: cookie present and
 *  non-empty, aud embedded, not expired. */
function authorized(request: Request, env: Env): boolean {
  if (!env.MUSIC_ACCESS_AUD) return true;
  // A valid CF_Authorization cookie whose aud matches the configured Access
  // app. Identity (email) flows through the same JWT for room-key derivation.
  const cookie = request.headers.get('Cookie') ?? '';
  const m = cookie.match(/(?:^|;\s*)CF_Authorization=([^;]+)/);
  if (!m) return false;
  try {
    const [, payloadB64] = m[1].split('.');
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))) as {
      aud?: string[] | string;
      exp?: number;
    };
    const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    const expOk = !payload.exp || payload.exp * 1000 > Date.now();
    return expOk && auds.includes(env.MUSIC_ACCESS_AUD);
  } catch {
    return false;
  }
}

/** Validate an ephemeral trigger shape at the DO boundary (Tier 1e). The gate
 *  validates committed events; the DO validates presence frames. Returns a
 *  sanitized frame, or null to reject. */
function sanitizeEphemeral(msg: Record<string, unknown>): { zone: string; origin: string; type: 'ephemeral'; kind: 'zone.trigger' } | null {
  if (msg.type !== 'ephemeral') return null;
  if (msg.kind !== 'zone.trigger') return null;
  if (typeof msg.zone !== 'string' || msg.zone.length === 0 || msg.zone.length > 128) return null;
  if (typeof msg.origin !== 'string' || msg.origin.length === 0 || msg.origin.length > 64) return null;
  return { type: 'ephemeral', kind: 'zone.trigger', zone: msg.zone, origin: msg.origin };
}

// ── D1-backed log adapter (the production write path). ──────────────────────
// A Durable Object cannot call the canon's Node commit() (node:fs). This
// adapter mirrors the Loom's D1 appendEvent: fold existing rows through the
// gate, append the new input, stamp the hash-chain link. O(log length).
interface MusicRecord extends ChainRecord {
  scope: 'personal' | 'shared' | 'session';
}

async function readRecords(env: Env): Promise<MusicRecord[]> {
  const { results } = await env.MUSIC_D1.prepare(
    'SELECT seq, ts, data, prev_hash, scope FROM events ORDER BY seq ASC',
  ).all<{ seq: number; ts: string; data: string; prev_hash: string; scope: string }>();
  return (results ?? []).map((r) => ({
    seq: r.seq,
    ts: r.ts,
    data: r.data,
    prev_hash: r.prev_hash ?? GENESIS_PREV_HASH,
    scope: (r.scope ?? 'shared') as MusicRecord['scope'],
  }));
}

async function readEvents(env: Env): Promise<LoomEvent[]> {
  const records = await readRecords(env);
  return records.map((r) => {
    const e = JSON.parse(r.data) as LoomEvent;
    return { ...e, seq: r.seq, ts: r.ts };
  });
}

/** Gate-validate and append one committed event to the D1 log. Throws on
 *  rejection (the client receives { valid:false, error } from the Worker). */
async function appendEvent(env: Env, input: LoomEventInput): Promise<LoomEvent> {
  const gate = new ReplayGate();
  const existing = await readRecords(env);
  for (const r of existing) {
    const e = JSON.parse(r.data) as LoomEventInput;
    const rr = gate.append(normalizeLegacyScope(e));
    if (!rr.valid) throw new Error(`replay rejected existing event: ${rr.error}`);
  }
  const result = gate.append(input);
  if (!result.valid) throw new Error(`gate rejected ${input.kind}: ${result.error}`);
  const log = gate.getLog();
  const event = log[log.length - 1];
  const head = existing.length ? await hashRecord(existing[existing.length - 1]) : GENESIS_PREV_HASH;
  const scope = 'scope' in event && event.scope ? event.scope : 'shared';
  await env.MUSIC_D1.prepare('INSERT INTO events (seq, ts, data, prev_hash, scope) VALUES (?, ?, ?, ?, ?)')
    .bind(event.seq, event.ts, JSON.stringify(event), head, scope)
    .run();
  return event;
}

// ── The room DO — WebSocket Hibernation. ────────────────────────────────────
export class MusicRoom extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const upgrade = request.headers.get('Upgrade');

    if (url.pathname.endsWith('/stream') && upgrade?.toLowerCase() === 'websocket') {
      if (!authorized(request, this.env)) {
        log(this.env, { ev: 'ws_reject_unauth', room: roomKey(request) });
        return new Response('Forbidden', { status: 403 });
      }
      // Hibernation WebSocket API: accept in fetch, broadcast via
      // ctx.getWebSockets() in webSocketMessage. The DO can sleep between
      // messages — no billable Duration while the room is idle.
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.ctx.acceptWebSocket(server);
      // Tier 1a: the runtime answers protocol-level pings WITHOUT waking the
      // object. The client sends a 'ping' every ~4min; the edge replies. A
      // DO-side setInterval would defeat hibernation — never do that.
      this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
      // Tier 1b: per-socket state survives eviction — the room rebuilds from
      // the sockets themselves when the DO wakes.
      server.serializeAttachment({ joinedAt: Date.now(), room: roomKey(request) });
      log(this.env, { ev: 'ws_connected', room: roomKey(request) });
      // On connect, tell the client the tail seq. The client re-fetches
      // /events itself to reconcile missed events (fetch-on-reconnect); the DO
      // does not replay the log over the socket — reconciliation lives in one
      // place on the client. The frame is explicitly typed so the client never
      // mistakes it for a committed LoomEvent.
      const events = await readEvents(this.env);
      const last = events[events.length - 1];
      server.send(JSON.stringify({ type: 'committed-resume', seq: last?.seq ?? -1 }));
      return new Response(null, { status: 101, webSocket: client });
    }

    if (!authorized(request, this.env)) {
      log(this.env, { ev: 'http_reject_unauth', path: url.pathname });
      return new Response('Forbidden', { status: 403 });
    }

    // ── Committed write via HTTP — the SSE-DEV FALLBACK. The production path
    //    is the WebSocket (the client sends commits over its socket; the DO's
    //    webSocketMessage appends + broadcasts). This HTTP endpoint exists for
    //    non-WebSocket clients and the SSE dev middleware's contract parity.
    //    NOTE: its fan-out (broadcastCommitted) is UNVERIFIED under Hibernation
    //    — the miniflare smoke test showed an HTTP-initiated broadcast not
    //    enumerating hibernated sockets. The WS path is the proven one.
    if (url.pathname.endsWith('/event') && request.method === 'POST') {
      const body = (await request.json()) as { input?: LoomEventInput };
      try {
        const event = await appendEvent(this.env, body.input!);
        this.broadcastCommitted(event);
        log(this.env, { ev: 'event_committed', seq: event.seq, kind: event.kind });
        return Response.json({ valid: true, event });
      } catch (e) {
        log(this.env, { ev: 'event_rejected', error: String(e) });
        return Response.json({ valid: false, error: String(e) }, { status: 400 });
      }
    }

    // ── Ephemeral broadcast via HTTP — the SSE-DEV FALLBACK. Same unverified
    //    under Hibernation caveat as /event: the production path is the WS.
    if (url.pathname.endsWith('/ephemeral') && request.method === 'POST') {
      const msg = (await request.json()) as Record<string, unknown>;
      const clean = sanitizeEphemeral(msg);
      if (!clean) {
        return Response.json({ valid: false, error: 'malformed ephemeral frame' }, { status: 400 });
      }
      this.broadcastEphemeral(clean);
      return Response.json({ valid: true, ephemeral: true });
    }

    // ── Read the committed composition. ─────────────────────────────────
    if (url.pathname.endsWith('/events')) {
      return Response.json(await readEvents(this.env));
    }

    return new Response('not found', { status: 404 });
  }

  /** A message from a client socket. The WS is the RELIABLE fan-out path: a
   *  broadcast initiated from a fetch invocation (the HTTP /ephemeral or
   *  /event endpoints) may not enumerate sockets after the DO hibernates —
   *  Cloudflare's Hibernation model routes webSocketMessage reliably, so the
   *  client sends BOTH ephemeral triggers and committed writes over its socket.
   *
   *   • A message with an `input` shape is a COMMITTED write: gate-validate,
   *     append to D1, echo the confirmation back to the SENDER (with the
   *     requestId so the caller can resolve its promise), and broadcast to the
   *     other sockets.
   *   • A message carrying type:'ephemeral' is presence: broadcast to the
   *     other sockets; the sender already applied it locally. Never persisted. */
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    // Tier 1c: frame size cap before any parse — a child mashing zones must
    // not flood the room with a multi-MB frame.
    const size = typeof message === 'string' ? message.length : message.byteLength;
    if (size > MAX_FRAME_BYTES) {
      log(this.env, { ev: 'ws_frame_oversize', bytes: size });
      ws.send(JSON.stringify({ type: 'frame-rejected', error: 'frame too large' }));
      return;
    }
    if (typeof message !== 'string') return;
    // The client's keepalive 'ping' is not JSON — the edge's auto-response
    // answers it without waking the DO; nothing to do here.
    if (message === 'ping') return;
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(message) as Record<string, unknown>;
    } catch {
      return;
    }

    const isEphemeral = msg.type === 'ephemeral';
    const isCommit = msg.input !== undefined && typeof msg.input === 'object';
    const requestId = typeof msg.requestId === 'string' ? msg.requestId : undefined;

    if (isCommit) {
      try {
        const event = await appendEvent(this.env, msg.input as LoomEventInput);
        log(this.env, { ev: 'ws_event_committed', seq: event.seq, kind: event.kind });
        // Echo confirmation to the sender (resolves its promise truthfully).
        if (requestId) {
          ws.send(JSON.stringify({ type: 'commit-ack', requestId, valid: true, event }));
        }
        // Broadcast to the other sockets.
        for (const socket of this.ctx.getWebSockets()) {
          if (socket !== ws) socket.send(JSON.stringify(event));
        }
      } catch (e) {
        log(this.env, { ev: 'ws_event_rejected', error: String(e) });
        if (requestId) {
          ws.send(JSON.stringify({ type: 'commit-ack', requestId, valid: false, error: String(e) }));
        }
      }
      return;
    }

    if (isEphemeral) {
      // Tier 1e: schema-validate presence frames at the DO boundary.
      const clean = sanitizeEphemeral(msg);
      if (!clean) {
        ws.send(JSON.stringify({ type: 'frame-rejected', error: 'malformed ephemeral frame' }));
        return;
      }
      for (const socket of this.ctx.getWebSockets()) {
        if (socket !== ws) socket.send(JSON.stringify(clean));
      }
      return;
    }
  }

  // B2: at compat date 2026-07-04 the runtime auto-replies to Close frames;
  // calling ws.close() is safe but no longer required. No per-socket cleanup
  // needed beyond a disconnect log (the broadcast enumerates getWebSockets()).
  async webSocketClose(ws: WebSocket): Promise<void> {
    const att = ws.deserializeAttachment() as { joinedAt?: number; room?: string } | null;
    log(this.env, { ev: 'ws_disconnected', room: att?.room ?? 'unknown' });
  }

  private broadcastCommitted(event: LoomEvent): void {
    for (const socket of this.ctx.getWebSockets()) {
      socket.send(JSON.stringify(event));
    }
  }

  private broadcastEphemeral(msg: unknown): void {
    for (const socket of this.ctx.getWebSockets()) {
      socket.send(JSON.stringify(msg));
    }
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    // The UI and the transport share ONE origin. Every /api/music/* request
    // routes to the room DO; everything else is served from the built static
    // assets (the React SPA). not_found_handling = "single-page-application"
    // makes unknown SPA routes return index.html.
    if (url.pathname.startsWith('/api/music/')) {
      const room = roomKey(request);
      const id = env.MUSIC_ROOM.idFromName(room);
      return env.MUSIC_ROOM.get(id).fetch(request);
    }
    return env.ASSETS.fetch(request);
  },
};