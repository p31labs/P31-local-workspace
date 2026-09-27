/**
 * CORS for the Loom API. The Loom (loom-8z0.pages.dev) is called by the
 * production portals (qpj.p31ca.org and siblings) — a different origin. This
 * helper implements a LOCKED allowlist, read from the LOOM_CORS_ORIGINS env
 * var (comma-separated, e.g. "https://qpj.p31ca.org,http://localhost:5191").
 *
 * CORS is browser-enforced only — it is NOT auth. It declares the intended
 * browser origins; the actual control is Cloudflare Access + rate limiting.
 * Never echo an arbitrary Origin back; only exact allowlist matches.
 */
import type { PagesFunction } from '@cloudflare/workers-types';

export interface CorsEnv {
  LOOM_CORS_ORIGINS?: string;
}

const DEFAULT_ORIGINS = [
  'http://localhost:5191',
  'https://qpj.p31ca.org',
  'https://willow.p31ca.org',
  'https://tetra.p31ca.org',
  'https://sixseven.p31ca.org',
  'https://meatspace.p31ca.org',
  'https://design.p31ca.org',
  'https://chat.p31ca.org',
  'https://p31ca.org',
  'https://www.p31ca.org',
  'https://phosphorus31.org',
  'https://loom-verify.pages.dev',
];

function corsOrigins(env: CorsEnv): string[] {
  const raw = env.LOOM_CORS_ORIGINS;
  if (!raw) return DEFAULT_ORIGINS;
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** The CORS response headers for the given Origin, or null when the Origin is
 *  not allowlisted. An allowlisted Origin is echoed exactly. */
export function corsHeaders(env: CorsEnv, request: Request): Record<string, string> | null {
  const origin = request.headers.get('Origin');
  if (!origin) return null; // same-origin or non-browser — CORS not needed
  const allowed = corsOrigins(env);
  if (!allowed.includes(origin)) return null;
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Loom-Internal',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

/** Handle a CORS preflight (OPTIONS) request. Returns a Response when the
 *  Origin is allowlisted; null when not (the caller falls through to 403). */
export function handlePreflight(env: CorsEnv, request: Request): Response | null {
  if (request.method !== 'OPTIONS') return null;
  const headers = corsHeaders(env, request);
  if (!headers) return new Response('Forbidden', { status: 403 });
  return new Response(null, { status: 204, headers });
}

/** Attach CORS headers to a Response when the Origin is allowlisted. */
export function withCors(env: CorsEnv, request: Request, res: Response): Response {
  const headers = corsHeaders(env, request);
  if (!headers) return res;
  const merged = new Headers(res.headers);
  for (const [k, v] of Object.entries(headers)) merged.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: merged });
}

export type CorsPagesFunction = PagesFunction<CorsEnv>;