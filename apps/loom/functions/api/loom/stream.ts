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
 *  internal service token until the dashboard binding is configured. */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const secret = context.env.LOOM_INTERNAL_SECRET;
  if (context.env.LOOM_SSE) {
    return context.env.LOOM_SSE.fetch(context.request, context.env);
  }
  const base = context.env.LOOM_SSE_URL ?? 'https://loom-sse.trimtab-signal.workers.dev';
  const headers = new Headers(context.request.headers);
  if (secret) headers.set(INTERNAL_HEADER, secret);
  return fetch(new Request(`${base}/stream`, { headers }), context.env);
};