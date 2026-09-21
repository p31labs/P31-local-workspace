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

  // Writer identity. When Access is ON, the JWT `sub` is authoritative and is
  // BOUND onto any personal event (the client-asserted humanId is ignored —
  // never trust a user ID sent in a form field or URL). When Access is OFF,
  // the interim posture: identity may come from the X-Human-Id header, and a
  // personal event's declared humanId must match it (a promise, not proof —
  // SECURITY.md documents this). A personal event without a matching identity
  // is rejected even in the interim.
  const access = (context.data as { access?: { payload: Record<string, unknown> } }).access;
  const sub = access?.payload?.sub as string | undefined;
  const header = context.request.headers.get('X-Human-Id')?.trim() || undefined;
  const principal = sub ?? header;

  const scope = 'scope' in input && input.scope ? input.scope : 'shared';
  if (scope === 'personal') {
    if (sub) {
      // Access is authoritative — rebind the humanId to the authenticated sub.
      input = { ...input, humanId: sub };
    } else if (!principal || input.humanId !== principal) {
      // Interim: no Access. The declared humanId must match the header identity.
      return Response.json(
        { valid: false, error: `personal event's humanId must match the caller identity (X-Human-Id)` },
        { status: 401 },
      );
    }
  }

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
    return Response.json({ valid: true, event, subject: sub ?? null });
  } catch (e) {
    return Response.json({ valid: false, error: String(e) }, { status: 400 });
  }
};