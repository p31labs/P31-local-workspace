import { readEvents } from './_lib/log';

/**
 * GET /api/loom/events — the SCOPED read.
 *
 * Returns shared events plus the caller's OWN personal events. A personal
 * event authored by someone else is filtered at the D1 query — structurally
 * invisible, never by asking the client to ignore it.
 *
 * Caller identity resolution (the enforcement boundary):
 *   - When Cloudflare Access is ON, the authenticated principal (the JWT `sub`)
 *     is the caller. Personal events are scoped to that identity.
 *   - When Access is OFF (the documented interim), identity may come from the
 *     `X-Human-Id` header — a dev/demo affordance, the same class as the `?id=`
 *     URL param. This is a PROMISE, not enforcement: SECURITY.md says so.
 *     Without a header, only shared events are returned.
 */
export const onRequestGet: PagesFunction = async (context) => {
  const access = (context.data as { access?: { payload: Record<string, unknown> } }).access;
  const sub = access?.payload?.sub as string | undefined;
  const header = context.request.headers.get('X-Human-Id');
  const callerId = (sub as string | undefined) ?? (header?.trim() || undefined);

  const events = await readEvents(context.env, callerId);
  return Response.json(events, {
    headers: { 'Cache-Control': 'no-store' },
  });
};