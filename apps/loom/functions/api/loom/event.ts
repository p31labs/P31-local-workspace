import { appendEvent } from './_lib/log';
import type { LoomEventInput } from '@p31/canon/loom/gate';

interface Env {
  LOOM_SSE?: Fetcher;
  LOOM_SSE_URL?: string;
  LOOM_INTERNAL_SECRET?: string;
}

const INTERNAL_HEADER = 'X-Loom-Internal';

/** POST /api/loom/event — validate via the gate and append to D1. */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  let input: LoomEventInput;
  try {
    const body = (await context.request.json()) as { input?: LoomEventInput };
    if (!body.input) return Response.json({ valid: false, error: 'missing input' }, { status: 400 });
    input = body.input;
  } catch {
    return Response.json({ valid: false, error: 'invalid JSON' }, { status: 400 });
  }

  // Bind the authenticated principal as the writer identity when the caller
  // has not supplied one (humanId is client-asserted and advisory).
  const access = (context.data as { access?: { payload: Record<string, unknown> } }).access;
  const subject = access?.payload?.sub;

  try {
    const event = await appendEvent(context.env, input);
    // Low-latency fan-out: tell the SSE Worker's Durable Object to re-read D1
    // and push to connected clients. The Worker also polls D1 as a fallback.
    // Prefers the service binding; falls back to the workers.dev URL with the
    // internal service token. The write path never depends on this.
    const broadcastUrl = new Request('https://loom-sse.local/broadcast', { method: 'POST' });
    if (context.env.LOOM_SSE) {
      await context.env.LOOM_SSE.fetch(broadcastUrl, context.env).catch(() => {});
    } else if (context.env.LOOM_SSE_URL && context.env.LOOM_INTERNAL_SECRET) {
      const headers = { [INTERNAL_HEADER]: context.env.LOOM_INTERNAL_SECRET };
      await fetch(`${context.env.LOOM_SSE_URL}/broadcast`, { method: 'POST', headers }).catch(() => {});
    }
    return Response.json({ valid: true, event, subject });
  } catch (e) {
    return Response.json({ valid: false, error: String(e) }, { status: 400 });
  }
};