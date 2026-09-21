import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  LOOM_SSE?: Fetcher;
  LOOM_SSE_URL?: string;
  LOOM_INTERNAL_SECRET?: string;
}

const INTERNAL_HEADER = 'X-Loom-Internal';

/** GET /api/loom/stream — proxy to the SSE Worker's /stream (Durable Object
 *  fan-out). The Access gate in _middleware.ts already ran for /api/loom/*.
 *  Prefers the service binding; falls back to the workers.dev URL with the
 *  internal service token until the dashboard binding is configured.
 *
 *  Scope fan-out: the caller identity is forwarded as ?humanId= to the Worker
 *  so personal events stream only to their owner. Identity comes from the
 *  authenticated Access sub when ON, else the interim X-Human-Id header. */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const secret = context.env.LOOM_INTERNAL_SECRET;
  const access = (context.data as { access?: { payload: Record<string, unknown> } }).access;
  const sub = access?.payload?.sub as string | undefined;
  const headerHumanId = context.request.headers.get('X-Human-Id')?.trim() || undefined;
  const humanId = sub ?? headerHumanId;

  const upstream = new URL(context.request.url);
  if (humanId) upstream.searchParams.set('humanId', humanId);

  if (context.env.LOOM_SSE) {
    return context.env.LOOM_SSE.fetch(new Request(upstream, context.request), context.env);
  }
  const base = context.env.LOOM_SSE_URL ?? 'https://loom-sse.trimtab-signal.workers.dev';
  const headers = new Headers(context.request.headers);
  if (secret) headers.set(INTERNAL_HEADER, secret);
  return fetch(new Request(`${base}/stream${upstream.search}`, { headers }), context.env);
};