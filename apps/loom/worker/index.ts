/**
 * The Loom's SSE Worker — a dedicated Worker because the broadcast primitive
 * (a Durable Object) is not available to Pages Functions.
 *
 * GET  /stream     — SSE: register a subscriber, then fan out log updates.
 *                    Honors Last-Event-ID via ?lastEventId= (the client's
 *                    mobile backoff sends it) and the header.
 * POST /broadcast  — after a Pages Function appends, force an immediate
 *                    re-read and fan-out (low-latency path).
 *
 * The Durable Object holds subscribers and polls D1 on an interval; the open
 * SSE response keeps the DO's fetch invocation alive, so the poll loop does
 * not hibernate. Heartbeat comments every 15s keep the connection past
 * Cloudflare's ~100s idle window.
 */
import { DurableObject } from 'cloudflare:workers';
import type { LoomEvent } from '@p31/canon/loom/events';

interface Env {
  LOOM_D1: D1Database;
  LOG_BROADCASTER: DurableObjectNamespace<LogBroadcaster>;
  /** Shared service token — the Pages Functions send it when proxying /stream
   *  and /broadcast (either via the service binding or, until that dashboard
   *  binding is set, via the public workers.dev URL). The client never holds
   *  it. */
  LOOM_INTERNAL_SECRET?: string;
}

const HEARTBEAT_MS = 15_000;
const POLL_MS = 5_000;

/** The header the Pages Functions use to authenticate internal calls. */
const INTERNAL_HEADER = 'X-Loom-Internal';

function authorized(request: Request, env: Env): boolean {
  const secret = env.LOOM_INTERNAL_SECRET;
  if (!secret) {
    // No secret configured — deny internal calls rather than risk an open
    // stream on the public workers.dev URL.
    return false;
  }
  return request.headers.get(INTERNAL_HEADER) === secret;
}

interface Subscriber {
  controller: ReadableStreamDefaultController<Uint8Array>;
  lastSeq: number;
  /** The caller's identity for scoped fan-out. null = anonymous (shared only). */
  humanId: string | null;
  heartbeat?: ReturnType<typeof setInterval>;
}

async function readEvents(env: Env): Promise<LoomEvent[]> {
  try {
    const { results } = await env.LOOM_D1.prepare('SELECT seq, ts, data, scope FROM events ORDER BY seq ASC').all<{
      seq: number;
      ts: string;
      data: string;
      scope: string;
    }>();
    return (results ?? []).map((r) => {
      const event = JSON.parse(r.data) as LoomEvent;
      return { ...event, seq: r.seq, ts: r.ts, scope: (r.scope ?? 'shared') as LoomEvent['scope'] };
    });
  } catch (e) {
    console.error('[readEvents] D1 read failed', String(e));
    return [];
  }
}

const encoder = new TextEncoder();

export class LogBroadcaster extends DurableObject<Env> {
  private subscribers = new Map<string, Subscriber>();
  private env: Env;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    // The base class may not populate this.env in every runtime — capture it
    // explicitly so the D1 binding is always reachable.
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Force an immediate fan-out after a Pages Function append.
    if (url.pathname.endsWith('/broadcast')) {
      try {
        await this.emit();
      } catch (e) {
        console.error('[broadcast] emit failed', String(e));
      }
      return new Response('ok', { status: 202 });
    }

    // SSE stream. Last-Event-ID from query param (mobile backoff) or header.
    const header = request.headers.get('Last-Event-ID') ?? '';
    const query = url.searchParams.get('lastEventId') ?? '';
    const resume = Number(header || query || -1);
    // Caller identity for scoped fan-out: the Pages stream proxy forwards the
    // authenticated identity (or the interim X-Human-Id) as ?humanId=. A
    // personal event is streamed only to the subscriber it belongs to.
    const humanId = url.searchParams.get('humanId')?.trim() || null;

    const id = crypto.randomUUID();
    const stream = new ReadableStream<Uint8Array>({
      start: (controller) => {
        this.subscribers.set(id, { controller, lastSeq: resume, humanId });
        void this.emit().catch((e) => console.error('[stream] emit failed', String(e)));
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(': heartbeat\n\n'));
          } catch {
            clearInterval(heartbeat);
          }
        }, HEARTBEAT_MS);
        const sub = this.subscribers.get(id);
        if (sub) sub.heartbeat = heartbeat;
      },
      cancel: () => {
        const sub = this.subscribers.get(id);
        if (sub?.heartbeat) clearInterval(sub.heartbeat);
        this.subscribers.delete(id);
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }

  /** Re-read D1 and push any new events to every subscriber, scoped. A shared
   *  event goes to every subscriber; a personal event goes only to the
   *  subscriber whose humanId matches the event's owner. */
  private async emit(): Promise<void> {
    const events = await readEvents(this.env);
    for (const [id, sub] of this.subscribers) {
      for (const e of events) {
        if (e.seq > sub.lastSeq) {
          // Scope filter: personal events stream only to their owner.
          if (e.scope === 'personal') {
            const owner = (e as LoomEvent & { humanId?: string }).humanId ?? '';
            if (!sub.humanId || owner !== sub.humanId) continue;
          }
          sub.lastSeq = e.seq;
          try {
            sub.controller.enqueue(encoder.encode(`id: ${e.seq}\ndata: ${JSON.stringify(e)}\n\n`));
          } catch {
            // Client closed mid-write — drop it.
            this.subscribers.delete(id);
            break;
          }
        }
      }
    }
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/health') return new Response('ok', { status: 200 });
    // /stream and /broadcast are internal — the Pages Functions proxy them
    // with the service token. Reject anonymous hits on the public workers.dev
    // URL.
    if (!authorized(request, env)) {
      return new Response('Forbidden', { status: 403 });
    }
    // Route stream and broadcast into the DO. The modern runtime requires a
    // DurableObjectId, not a raw name string.
    const id = env.LOG_BROADCASTER.idFromName('loom');
    return env.LOG_BROADCASTER.get(id).fetch(request);
  },
};