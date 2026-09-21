import { foldMemory, type LumiMemory } from '@p31/canon/loom/memory';
import { readEvents } from './_lib/log';

/**
 * GET /api/loom/memory — Lumi's persistent memory, folded from the log.
 *
 * Memory is DERIVED, never stored: the same scoped events fold to the same
 * memory on every read (deterministic, no LLM on the critical path). The log
 * is the runtime — a separate memory store would be a second source of truth
 * that could drift from the prev_hash chain. This endpoint is the fold.
 *
 * Scope: reads the SCOPED events (shared + the caller's own personal) and the
 * fold itself is shared-only (a personal record's content never surfaces —
 * see @p31/canon/loom/memory). The result carries the four tiers: episodic,
 * semantic, procedural, narrative.
 */
export const onRequestGet: PagesFunction = async (context) => {
  const access = (context.data as { access?: { payload: Record<string, unknown> } }).access;
  const sub = access?.payload?.sub as string | undefined;
  const header = context.request.headers.get('X-Human-Id')?.trim() || undefined;
  const callerId = (sub as string | undefined) ?? (header || undefined);

  const events = await readEvents(context.env, callerId);
  const memory: LumiMemory = foldMemory(events);
  return Response.json(memory, {
    headers: { 'Cache-Control': 'no-store' },
  });
};