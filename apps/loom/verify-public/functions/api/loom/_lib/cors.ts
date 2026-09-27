/**
 * CORS for the public verify surface (loom-verify.pages.dev).
 *
 * A LOCKED allowlist — only the origins listed in LOOM_CORS_ORIGINS are echoed
 * back. Never echoes an arbitrary Origin. CORS is browser-enforced only; the
 * real access control here is that the surface is read-only and returns
 * aggregate chain state (hashes) for the verdicts and shared records only.
 */
export interface CorsEnv {
  LOOM_CORS_ORIGINS?: string
}

const DEFAULT_ORIGINS = [
  'https://p31ca.org',
  'https://www.p31ca.org',
  'https://phosphorus31.org',
  'https://loom-verify.pages.dev',
]

function allowedOrigins(env: CorsEnv): string[] {
  const raw = env.LOOM_CORS_ORIGINS
  if (!raw) return DEFAULT_ORIGINS
  return raw.split(',').map((s) => s.trim()).filter(Boolean)
}

export function corsHeadersFor(env: CorsEnv, origin: string | null): Record<string, string> | null {
  if (!origin) return null
  if (!allowedOrigins(env).includes(origin)) return null
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}