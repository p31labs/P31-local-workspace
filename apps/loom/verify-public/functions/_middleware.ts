import type { PagesFunction } from '@cloudflare/workers-types'
import { corsHeadersFor, type CorsEnv } from './api/loom/_lib/cors'

/**
 * Project-wide middleware for the public verify surface:
 *   - handles CORS preflight (OPTIONS) for allowlisted origins,
 *   - attaches CORS headers to every response for allowlisted origins.
 * No authentication anywhere on this project — it is the deliberately public
 * read-only surface. Read-only is enforced by having no write handlers.
 */
export const onRequest: PagesFunction<CorsEnv> = async (context) => {
  const env = context.env as CorsEnv
  const origin = context.request.headers.get('Origin')

  if (context.request.method === 'OPTIONS') {
    const headers = corsHeadersFor(env, origin)
    if (!headers) return new Response('Forbidden', { status: 403 })
    return new Response(null, { status: 204, headers })
  }

  const res = await context.next()
  const headers = corsHeadersFor(env, origin)
  if (!headers) return res
  const merged = new Headers(res.headers)
  for (const [k, v] of Object.entries(headers)) merged.set(k, v)
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: merged })
}