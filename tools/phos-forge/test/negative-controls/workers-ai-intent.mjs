#!/usr/bin/env node
/**
 * Intent-matrix smoke test — catalog-driven selection.
 *
 * Proves each intent tag routes to a model that MEETS ITS CAPABILITY
 * REQUIREMENTS (from REQUIREMENTS_BY_INTENT), selected from the live Workers
 * AI model catalog. No hardcoded model names — the catalog is the source of
 * truth. When Cloudflare ships a new model, the selector picks it up and
 * this test still passes; it verifies REQUIREMENTS, not specific IDs.
 *
 * For each tag: run the real routeToWorkersAI, assert the model actually
 * used satisfies the tag's requirement predicates (context, function calling,
 * reasoning, price floor), and the answer is real (not a reasoning preamble).
 */
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const router = await import(resolve(here, '..', '..', 'router.mjs'))

// The requirement predicate per tag, mirroring REQUIREMENTS_BY_INTENT.
// The assertion: selectModel(tag) returned a model meeting these, AND the
// live call used it, AND the answer was real.
const REQUIREMENTS = {
  synthesis: (m) => m.reasoning && m.contextWindow >= 200_000 && m.functionCalling,
  coding: (m) => m.functionCalling && m.contextWindow >= 100_000 && /code|coder/i.test(m.name),
  reasoning: (m) => m.reasoning && m.contextWindow >= 60_000,
  fast: (m) => m.functionCalling && m.contextWindow >= 256_000 && (m.priceInUsdPerM ?? 0) >= 0.10,
  general: (m) => m.functionCalling && m.contextWindow >= 60_000,
}

// Reasoning-preamble guard (the semantic-drift check).
const REASONING_PREAMBLES = /^(we need|let me think|the user wants|i think|considering|thinking)/i

async function main() {
  if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CF_API_TOKEN) {
    console.log('⚠ SKIP (not a pass): needs CLOUDFLARE_ACCOUNT_ID + CF_API_TOKEN. Save the token and re-run.')
    process.exit(0)
  }

  const catalog = router.loadCatalog?.() ?? []
  if (catalog.length === 0) {
    console.error('✗ no model catalog — run: node tools/phos-forge/scripts/probe-models.mjs')
    process.exit(1)
  }

  let allOk = true
  for (const tag of Object.keys(REQUIREMENTS)) {
    try {
      const budget = (tag === 'synthesis' || tag === 'coding') ? 256 : (tag === 'fast' ? 128 : 512)
      const { content, modelUsed } = await router.routeToWorkersAI(
        'You are a terse test agent. Reply with exactly "ok".',
        `intent=${tag}`,
        tag,
        budget,
        0.5,
        60000,
      )
      // Find the model in the catalog and check it meets the requirement.
      const meta = catalog.find((m) => m.name === modelUsed)
      const meetsReq = meta ? REQUIREMENTS[tag](meta) : false
      const guardApplies = tag !== 'reasoning'
      const ok = !!modelUsed
        && !!meta
        && meetsReq
        && content.trim().toLowerCase().includes('ok')
        && (!guardApplies || !REASONING_PREAMBLES.test(content.trim()))
      if (!ok) {
        const why = !meta ? 'model not in catalog'
          : !meetsReq ? 'model does not meet tag requirements'
          : 'answer was a reasoning preamble or not ok'
        console.log(`  ✗ ${tag} → ${modelUsed} — ${why}`)
        allOk = false
      } else {
        console.log(`  ✓ ${tag} → ${modelUsed} (ctx=${meta.contextWindow}, fc=${meta.functionCalling}, rs=${meta.reasoning})`)
      }
    } catch (e) {
      console.log(`  ✗ ${tag} → ERROR: ${e.message.slice(0, 80)}`)
      allOk = false
    }
  }

  if (!allOk) {
    console.error('intent matrix FAILED — a tag selected a model that does not meet its requirements.')
    process.exit(1)
  }
  console.log('NEGATIVE_CONTROL_OK')
}

main().catch((e) => { console.error('smoke test error:', e.message); process.exit(1) })