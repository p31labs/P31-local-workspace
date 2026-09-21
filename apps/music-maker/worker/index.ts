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
 */

import { DurableObject } from 'cloudflare:workers';
import { ReplayGate, normalizeLegacyScope, type LoomEventInput } from '@p31/canon/loom/gate';
import type { LoomEvent } from '@p31/canon/loom/events';
import { hashRecord, GENESIS_PREV_HASH, type ChainRecord } from '@p31/canon/loom/hash-chain';

export interface Env {
  MUSIC_D1: D1Database;
  MUSIC_ROOM: DurableObjectNamespace<MusicRoom>;
}

/** A room id. One DO instance per room; the family's room is keyed by a shared
 *  family id in the URL (e.g. /stream?room=family-abc). */
function roomKey(url: URL): string {
  return url.searchParams.get('room')?.trim() || 'family';
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
      // Hibernation WebSocket API: accept in fetch, broadcast via
      // ctx.getWebSockets() in webSocketMessage. The DO can sleep between
      // messages — no billable Duration while the room is idle.
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.ctx.acceptWebSocket(server);
      // On connect, resend the committed composition tail so a joining device
      // converges even if it lost the /events fetch. Ephemeral history is not
      // replayed (it is gone — ephemeral by definition).
      const events = await readEvents(this.env);
      const last = events[events.length - 1];
      if (last) {
        server.send(JSON.stringify({ type: 'committed-resume', seq: last.seq }));
      }
      return new Response(null, { status: 101, webSocket: client });
    }

    // ── Committed write — the D1 path, not Node commit(). ──────────────
    if (url.pathname.endsWith('/event') && request.method === 'POST') {
      const body = (await request.json()) as { input?: LoomEventInput };
      try {
        const event = await appendEvent(this.env, body.input!);
        this.broadcastCommitted(event);
        return Response.json({ valid: true, event });
      } catch (e) {
        return Response.json({ valid: false, error: String(e) }, { status: 400 });
      }
    }

    // ── Ephemeral broadcast — ungated, never persisted. ────────────────
    if (url.pathname.endsWith('/ephemeral') && request.method === 'POST') {
      const msg = await request.json();
      this.broadcastEphemeral(msg);
      return Response.json({ valid: true, ephemeral: true });
    }

    // ── Read the committed composition. ─────────────────────────────────
    if (url.pathname.endsWith('/events')) {
      return Response.json(await readEvents(this.env));
    }

    return new Response('not found', { status: 404 });
  }

  /** An ephemeral trigger or cursor update arrives on one socket. Broadcast it
   *  to every OTHER socket in the room; the sending socket already applied it
   *  locally. Never persisted. */
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== 'string') return;
    let msg: unknown;
    try {
      msg = JSON.parse(message);
    } catch {
      return;
    }
    for (const socket of this.ctx.getWebSockets()) {
      if (socket !== ws) socket.send(JSON.stringify(msg));
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    ws.close();
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
    const room = roomKey(url);
    const id = env.MUSIC_ROOM.idFromName(room);
    return env.MUSIC_ROOM.get(id).fetch(request);
  },
};