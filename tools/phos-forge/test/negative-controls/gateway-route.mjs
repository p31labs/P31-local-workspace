#!/usr/bin/env node
/**
 * G6 — Negative control for the gateway intent route.
 *
 * Two failure classes must be caught:
 *   1. FAIL-CLOSED (local): routeToGateway() with CLOUDFLARE_ACCOUNT_ID /
 *      CF_AIG_TOKEN unset must THROW "gateway not configured". A router that
 *      silently falls through on missing config is a gate that can pass
 *      without doing its job.
 *   2. DEFAULT-FALLBACK (requires live gateway): a request with NO task
 *      metadata must route to the DEFAULT model (llama-4-scout), not the
 *      frontier (kimi-k2.6). If the route's conditionals fail open, every
 *      unlabeled request would hit Kimi at ~3.5× cost.
 *
 * STRONG CONTRACT: exits 0 + emits NEGATIVE_CONTROL_OK iff class 1 is proven
 * locally AND class 2 is proven when the gateway is reachable (skipped with a
 * loud SKIP, not a silent pass, when env is unset).
 */
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const routerPath = resolve(here, '..', '..', 'router.mjs')

async function main() {
  // ── Class 1: fail-closed on missing config (always runnable) ──
  const router = await import(routerPath)

  // Node quirk: process.env.X = undefined stores the STRING "undefined" (truthy).
  // The reliable way to unset an env var in-process is `delete process.env.X`.
  const hadAccount = 'CLOUDFLARE_ACCOUNT_ID' in process.env
  const hadToken = 'CF_AIG_TOKEN' in process.env
  const savedAccount = process.env.CLOUDFLARE_ACCOUNT_ID
  const savedToken = process.env.CF_AIG_TOKEN
  delete process.env.CLOUDFLARE_ACCOUNT_ID
  delete process.env.CF_AIG_TOKEN

  let threw = false
  try {
    await router.dispatchLLM('sys', 'user', { task: 'synthesis', privacy: 'gateway' }, { maxTokens: 50 })
  } catch (e) {
    threw = /gateway not configured/.test(String(e.message))
  }

  // Restore env exactly as it was (Node: restore as string, or re-delete if it
  // was never set).
  if (hadAccount) process.env.CLOUDFLARE_ACCOUNT_ID = savedAccount
  if (hadToken) process.env.CF_AIG_TOKEN = savedToken

  if (!threw) {
    console.error('routeToGateway did NOT throw with gateway env unset — it silently fell through (fail-open).')
    process.exit(1)
  }
  console.log('  ✓ fail-closed: gateway route throws when CLOUDFLARE_ACCOUNT_ID / CF_AIG_TOKEN unset')

  // ── Class 1b: Workers AI direct path fails closed without CF_API_TOKEN ──
  const hadApi = 'CF_API_TOKEN' in process.env
  const savedApi = process.env.CF_API_TOKEN
  delete process.env.CF_API_TOKEN
  let workersAThrew = false
  try {
    await router.dispatchLLM('sys', 'user', { task: 'synthesis', tag: 'synthesis', privacy: 'workers-ai' }, { maxTokens: 50 })
  } catch (e) {
    workersAThrew = /Workers AI not configured/.test(String(e.message))
  }
  if (hadApi) process.env.CF_API_TOKEN = savedApi
  if (!workersAThrew) {
    console.error('routeToWorkersAI did NOT throw without CF_API_TOKEN — fail-open.')
    process.exit(1)
  }
  console.log('  ✓ fail-closed: Workers AI direct path throws when CF_API_TOKEN unset')

  // ── Class 2: default-fallback (live gateway only) ──
  if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CF_AIG_TOKEN) {
    console.log('  ⚠ SKIP (not a pass): default-fallback check needs live gateway env — run after auth.')
    console.log('NEGATIVE_CONTROL_OK')
    process.exit(0)
  }

  const res = await fetch(
    `https://gateway.ai.cloudflare.com/v1/${process.env.CLOUDFLARE_ACCOUNT_ID}/p31-model-router/compat/chat/completions`,
    {
      method: 'POST',
      headers: {
        'cf-aig-authorization': `Bearer ${process.env.CF_AIG_TOKEN}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dynamic/p31-intent',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 8,
      }),
      signal: AbortSignal.timeout(60000),
    },
  )
  const modelUsed = res.headers.get('cf-aig-model')
  if (res.status !== 200) {
    console.error(`default-fallback check failed: HTTP ${res.status} — ${(await res.text()).slice(0, 200)}`)
    process.exit(1)
  }
  if (!modelUsed) {
    console.error('no cf-aig-model header returned — observability contract broken')
    process.exit(1)
  }
  const isDefault = /llama-4-scout/i.test(modelUsed)
  if (!isDefault) {
    console.error(`unlabeled request routed to ${modelUsed} — NOT the default. Fail-open to frontier?`)
    process.exit(1)
  }
  console.log(`  ✓ default-fallback: unlabeled request → ${modelUsed}`)
  console.log('NEGATIVE_CONTROL_OK')
}

main().catch((e) => {
  console.error('NC error:', e.message)
  process.exit(1)
})