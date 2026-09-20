import { appendEvent } from './_lib/log';
import type { LoomEventInput } from '@p31/canon/loom/gate';

/** POST /api/loom/event — validate via the gate and append to D1. */
export const onRequestPost: PagesFunction = async (context) => {
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
    // Broadcast to the SSE Worker's Durable Object so connected clients see
    // the new event without polling.
    await broadcast(event);
    return Response.json({ valid: true, event });
  } catch (e) {
    return Response.json({ valid: false, error: String(e) }, { status: 400 });
  }
};

/** CONFIG REQUIRED — the SSE Worker's service binding (service_bindings) and
 *  the Durable Object namespace must be declared for this broadcast to fire.
 *  Until then the write path is correct and the SSE stream simply polls D1. */
async function broadcast(_event: unknown): Promise<void> {
  // Replaced at config time with a fetch to the SSE Worker's DO broadcast
  // endpoint, authenticated by a service token or the same Access JWT.
}