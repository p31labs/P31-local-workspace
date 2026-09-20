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
}

const HEARTBEAT_MS = 15_000;
const POLL_MS = 5_000;

interface Subscriber {
  controller: ReadableStreamDefaultController<Uint8Array>;
  lastSeq: number;
  heartbeat?: ReturnType<typeof setInterval>;
}

async function readEvents(env: Env): Promise<LoomEvent[]> {
  const { results } = await env.LOOM_D1.prepare('SELECT seq, ts, data FROM events ORDER BY seq ASC').all<{
    seq: number;
    ts: string;
    data: string;
  }>();
  return (results ?? []).map((r) => {
    const event = JSON.parse(r.data) as LoomEvent;
    return { ...event, seq: r.seq, ts: r.ts };
  });
}

const encoder = new TextEncoder();

export class LogBroadcaster extends DurableObject<Env> {
  private subscribers = new Map<string, Subscriber>();

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Force an immediate fan-out after a Pages Function append.
    if (url.pathname.endsWith('/broadcast')) {
      await this.emit();
      return new Response('ok', { status: 202 });
    }

    // SSE stream. Last-Event-ID from query param (mobile backoff) or header.
    const header = request.headers.get('Last-Event-ID') ?? '';
    const query = url.searchParams.get('lastEventId') ?? '';
    const resume = Number(header || query || -1);

    const id = crypto.randomUUID();
    const stream = new ReadableStream<Uint8Array>({
      start: (controller) => {
        this.subscribers.set(id, { controller, lastSeq: resume });
        void this.emit(); // deliver the resume gap immediately
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(': heartbeat\n\n'));
          } catch {
            clearInterval(heartbeat);
          }
        }, HEARTBEAT_MS);
        this.subscribers.get(id)!.heartbeat = heartbeat;
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

  /** Re-read D1 and push any new events to every subscriber. */
  private async emit(): Promise<void> {
    const events = await readEvents(this.env);
    for (const [id, sub] of this.subscribers) {
      for (const e of events) {
        if (e.seq > sub.lastSeq) {
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
    // Route stream and broadcast into the DO.
    return env.LOG_BROADCASTER.get('loom').fetch(request);
  },
};