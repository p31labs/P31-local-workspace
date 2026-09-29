#!/usr/bin/env node
/**
 * probe-models — fetch the live Workers AI text-generation catalog with
 * capability metadata, written to tools/phos-forge/models-catalog.json.
 *
 * This is the SOURCE OF EXISTENCE. The router no longer hardcodes model
 * names — it reads this catalog (refreshed on demand / weekly) and selects
 * by capability. When Cloudflare adds or deprecates a model, the probe picks
 * it up automatically; the router never breaks on a stale hardcode.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(here, '..', 'models-catalog.json')

async function main() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const token = process.env.CF_API_TOKEN
  if (!accountId || !token) {
    console.error('probe-models: CLOUDFLARE_ACCOUNT_ID / CF_API_TOKEN required')
    process.exit(1)
  }

  // Fetch all text-generation models (paginate to be safe).
  const models = []
  let page = 1
  for (;;) {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/models/search` +
      `?task=${encodeURIComponent('Text Generation')}&hide_experimental=true&per_page=100&page=${page}`
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(60000),
    })
    if (!resp.ok) {
      const body = await resp.text().catch(() => '')
      throw new Error(`[probe] ${resp.status}: ${body.slice(0, 200)}`)
    }
    const data = await resp.json()
    const rows = data?.result ?? []
    models.push(...rows)
    if (rows.length < 100) break
    page += 1
  }

  // Normalize each model to a flat capability record.
  const catalog = models
    .map((m) => {
      const props = {}
      for (const p of m.properties ?? []) props[p.property_id] = p.value
      const price = Array.isArray(props.price) ? props.price : []
      const priceIn = price.find((p) => p.unit?.includes('input'))?.price ?? null
      const priceOut = price.find((p) => p.unit?.includes('output'))?.price ?? null
      return {
        name: m.name,
        description: m.description ?? '',
        contextWindow: Number(props.context_window ?? 0),
        functionCalling: props.function_calling === 'true',
        reasoning: props.reasoning === 'true',
        vision: props.vision === 'true',
        priceInUsdPerM: priceIn,
        priceOutUsdPerM: priceOut,
        requirePaid: props.require_workers_paid === 'true',
      }
    })
    .filter((m) => m.contextWindow > 0) // only real text-gen LLMs
    .sort((a, b) => (b.contextWindow - a.contextWindow) || (b.priceInUsdPerM ?? 0) - (a.priceInUsdPerM ?? 0))

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify({
    fetchedAt: new Date().toISOString(),
    count: catalog.length,
    models: catalog,
  }, null, 2) + '\n')

  console.log(`✅ probed ${catalog.length} text-generation models → models-catalog.json`)
  for (const m of catalog.slice(0, 8)) {
    console.log(`  ${m.name} ctx=${m.contextWindow} fc=${m.functionCalling} rs=${m.reasoning} in=$/${m.priceInUsdPerM ?? '?'}`)
  }
}

main().catch((e) => { console.error('probe error:', e.message); process.exit(1) })