/**
 * env-proxy — BFF for the Quantum Material .env app (Phase 1, read-only).
 *
 * Lists Worker secret NAMES (values never leave the Cloudflare API) against
 * the curated fleet manifest, plus D1-backed audit + status aggregation.
 *
 * Secrets:
 *   ENV_PROXY_TOKEN — bearer token the .env app sends on every request.
 *   CF_API_TOKEN    — scoped API token ("Workers Scripts: Read" +
 *                     "Account Secrets Store: Read"). Set before /env/list,
 *                     /env/status can return live data.
 */

import { MANIFEST, workersForScope, declaredRequired, type WorkerEntry } from './manifest'

const JSON_HDR = { 'content-type': 'application/json; charset=utf-8' }

interface Env {
  ENV_PROXY_TOKEN?: string
  CF_API_TOKEN?: string
  CF_ACCOUNT_ID: string
  ALLOWED_ORIGINS?: string
  ENV_META: D1Database
}

function cors(env: Env) {
  const raw = env.ALLOWED_ORIGINS || '*'
  const allow = raw.split(',').map((s) => s.trim()).filter(Boolean)
  const origin = allow.includes('*') ? '*' : allow.join(', ')
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Env-Actor',
    'Access-Control-Max-Age': '86400',
  }
}

function json(data: unknown, status: number, env: Env, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { ...JSON_HDR, ...cors(env), ...extra },
  })
}

function bearer(request: Request): string | null {
  const h = request.headers.get('Authorization') || ''
  const m = /^Bearer\s+(.+)$/i.exec(h)
  return m ? m[1].trim() : null
}

/** Authorizes a request against ENV_PROXY_TOKEN. Returns a Response on failure. */
function authorize(request: Request, env: Env): Response | null {
  const expected = env.ENV_PROXY_TOKEN
  if (!expected) {
    return json(
      { error: 'not_configured', hint: 'wrangler secret put ENV_PROXY_TOKEN' },
      503,
      env,
    )
  }
  const token = bearer(request)
  if (!token || token !== expected) {
    return json({ error: 'unauthorized' }, 401, env)
  }
  return null
}

interface SecretsResult {
  ok: boolean
  names: string[]
  error?: string
}

/** Fetch a script's secret NAMES from the Cloudflare API (values never returned). */
async function listScriptSecrets(env: Env, script: string): Promise<SecretsResult> {
  if (!env.CF_API_TOKEN) {
    return { ok: false, names: [], error: 'CF_API_TOKEN not configured' }
  }
  const url =
    `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(env.CF_ACCOUNT_ID)}` +
    `/workers/scripts/${encodeURIComponent(script)}/secrets`
  let res: Response
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${env.CF_API_TOKEN}` },
      cf: { cacheTtl: 30, cacheEverything: false },
    })
  } catch (e) {
    return { ok: false, names: [], error: `network_error: ${(e as Error).message}` }
  }
  if (res.status === 401 || res.status === 403) {
    return { ok: false, names: [], error: `cf_auth: ${res.status}` }
  }
  if (res.status === 404) {
    return { ok: false, names: [], error: `worker_not_found: ${script}` }
  }
  let raw: unknown
  try {
    raw = await res.json()
  } catch {
    return { ok: false, names: [], error: `bad_response: ${res.status}` }
  }
  if (!res.ok) {
    return { ok: false, names: [], error: `cf_error: ${JSON.stringify(raw)}` }
  }
  const body = raw as { success?: boolean; result?: Array<{ name?: string }>; errors?: unknown }
  if (!body?.success) {
    return { ok: false, names: [], error: `cf_error: ${JSON.stringify(body?.errors ?? body)}` }
  }
  const names = (body.result ?? [])
    .map((s) => s.name)
    .filter((n): n is string => typeof n === 'string')
    .sort()
  return { ok: true, names }
}

async function logAudit(
  env: Env,
  row: { keyId: string; action: string; actor: string; environment: string; workerName: string | null; result: string },
): Promise<void> {
  try {
    await env.ENV_META.prepare(
      `INSERT INTO env_audit (id, key_id, action, actor, environment, worker_name, result, ts)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        crypto.randomUUID(),
        row.keyId,
        row.action,
        row.actor,
        row.environment,
        row.workerName,
        row.result,
        Date.now(),
      )
      .run()
  } catch {
    // Audit logging is best-effort; a failed write must not break the route.
  }
}

async function handleEnvList(env: Env, url: URL, actor: string): Promise<Response> {
  const scope = (url.searchParams.get('scope') || 'all').toLowerCase()
  if (!['capital', 'mcp', 'all'].includes(scope)) {
    return json({ error: 'invalid_scope', valid: ['capital', 'mcp', 'all'] }, 400, env)
  }
  const entries = workersForScope(scope)
  const workers: unknown[] = []
  let errors = 0
  for (const entry of entries) {
    const r = await listScriptSecrets(env, entry.worker)
    const secrets = r.ok ? r.names : []
    const missing = entry.required.filter((n) => !secrets.includes(n))
    workers.push({
      worker: entry.worker,
      scope: entry.scope,
      source: entry.source,
      count: secrets.length,
      secrets,
      required: entry.required,
      missing,
      ...(r.ok ? {} : { error: r.error }),
    })
    if (!r.ok) errors++
    await logAudit(env, {
      keyId: `worker:${entry.worker}`,
      action: 'list',
      actor,
      environment: 'phase1',
      workerName: entry.worker,
      result: r.ok ? 'ok' : `error:${r.error}`,
    })
  }
  return json(
    {
      scope,
      ts: new Date().toISOString(),
      workerCount: entries.length,
      errorCount: errors,
      note: 'secret NAMES only — values are never returned by this API',
      workers,
    },
    200,
    env,
  )
}

async function handleEnvStatus(env: Env): Promise<Response> {
  const entries = MANIFEST
  const perWorker = await Promise.all(
    entries.map(async (entry) => {
      const r = await listScriptSecrets(env, entry.worker)
      const secrets = r.ok ? r.names : []
      const missing = entry.required.filter((n) => !secrets.includes(n))
      return { entry, secrets, missing, ok: r.ok, error: r.error }
    }),
  )

  const totalSecrets = perWorker.reduce((acc, p) => acc + p.secrets.length, 0)
  const missingRequired = perWorker.flatMap((p) => p.missing.map((n) => ({ worker: p.entry.worker, secret: n })))

  // Stale: env_metadata rows whose last_rotated_at is > 90 days ago.
  const staleCutoff = Date.now() - 90 * 24 * 3600 * 1000
  let stale: { keyId: string; name: string; lastRotatedAt: number | null; staleDays: number }[] = []
  try {
    const rows = (await env.ENV_META.prepare(`SELECT key_id, name, last_rotated_at FROM env_metadata`).all())
      .results as { key_id: string; name: string; last_rotated_at: number | null }[]
    stale = rows
      .filter((r) => r.last_rotated_at !== null && r.last_rotated_at < staleCutoff)
      .map((r) => ({
        keyId: r.key_id,
        name: r.name,
        lastRotatedAt: r.last_rotated_at,
        staleDays: Math.floor((Date.now() - (r.last_rotated_at as number)) / 86400000),
      }))
  } catch (e) {
    stale = []
  }

  // Secrets Store — read-only inventory + "used" note (Phase 1, best-effort).
  let secretsStore: unknown = { note: 'not_queried' }
  if (env.CF_API_TOKEN) {
    try {
      const storesRes = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/secrets_store/stores`,
        { headers: { Authorization: `Bearer ${env.CF_API_TOKEN}` } },
      )
      const storesBody = (await storesRes.json()) as { success?: boolean; result?: { id: string; name: string }[] }
      const stores = storesBody.success ? (storesBody.result ?? []) : []
      const storeInfo = await Promise.all(
        stores.map(async (store) => {
          const sRes = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}` +
              `/secrets_store/stores/${store.id}/secrets`,
            { headers: { Authorization: `Bearer ${env.CF_API_TOKEN}` } },
          )
          const sBody = (await sRes.json()) as { success?: boolean; result?: { name: string }[] }
          const names = sBody.success ? (sBody.result ?? []).map((s) => s.name) : []
          return { storeId: store.id, storeName: store.name, secretCount: names.length, secrets: names }
        }),
      )
      secretsStore = { stores: storeInfo }
    } catch {
      secretsStore = { note: 'query_failed' }
    }
  } else {
    secretsStore = { note: 'skipped (CF_API_TOKEN not configured)' }
  }

  return json(
    {
      ts: new Date().toISOString(),
      totals: { workers: entries.length, totalSecrets, missingRequiredCount: missingRequired.length, staleCount: stale.length },
      missingRequired,
      stale,
      secretsStore,
      unboundNote:
        'Phase 1: Secrets Store inventory returned above; binding usage = mcp-x402-gateway binds LOVE_AUTH_SECRET via [[secrets_store_secrets]] (store p31-secrets).',
    },
    200,
    env,
  )
}

async function handleEnvAudit(env: Env, url: URL): Promise<Response> {
  const rawLimit = Number(url.searchParams.get('limit') || 50)
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.floor(rawLimit), 1), 200) : 50
  try {
    const { results } = await env.ENV_META.prepare(
      `SELECT id, key_id, action, actor, environment, worker_name, result, ts
       FROM env_audit ORDER BY ts DESC LIMIT ?`,
    )
      .bind(limit)
      .all()
    return json({ limit, rows: results }, 200, env)
  } catch (e) {
    return json({ error: 'db_error', detail: (e as Error).message }, 500, env)
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors(env) })
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      return json({ ok: true, service: 'env-proxy', ts: new Date().toISOString() }, 200, env)
    }

    if (request.method === 'GET' && url.pathname === '/') {
      return json(
        {
          service: 'env-proxy',
          phase: 1,
          routes: ['GET /env/list?scope=capital|mcp|all (Bearer)', 'GET /env/status (Bearer)', 'GET /env/audit?limit=50 (Bearer)'],
          note: 'secret NAMES only; values never leave the Cloudflare API',
        },
        200,
        env,
      )
    }

    // All data routes require the bearer token.
    const unauthorized = authorize(request, env)
    if (unauthorized) return unauthorized

    const actor = request.headers.get('X-Env-Actor')?.slice(0, 128) || 'env-proxy'

    if (request.method === 'GET' && url.pathname === '/env/list') {
      return handleEnvList(env, url, actor)
    }
    if (request.method === 'GET' && url.pathname === '/env/status') {
      return handleEnvStatus(env)
    }
    if (request.method === 'GET' && url.pathname === '/env/audit') {
      return handleEnvAudit(env, url)
    }

    return json({ error: 'not_found', path: url.pathname }, 404, env)
  },
}