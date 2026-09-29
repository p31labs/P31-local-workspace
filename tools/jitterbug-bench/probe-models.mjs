#!/usr/bin/env node
/**
 * probe-models.mjs — latency probe for research-tier model candidates.
 *
 * Goal (WP-INFERENCE-SPEED rank 3 corrected): the facet research stage is the
 * dominant cost (~150s/prompt; gemma-4-26b at ~51s/call in the baseline). The
 * naive fix is "pick a cheaper model", but the Zenn finding + baseline show
 * cost != latency: the CHEAPEST model can be the SLOWEST. So we measure.
 *
 * Method: for each candidate, run a fixed research-style prompt 3x and record
 * total_ms, tps, ttft_ms from the live telemetry. Report mean + stddev.
 * Does NOT swap any model — the swap is a separate decision gated on this
 * probe + a rubric quality spot-check.
 *
 * Usage:
 *   node tools/jitterbug-bench/probe-models.mjs
 *   node tools/jitterbug-bench/probe-models.mjs --runs 3
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { dispatchLLM } from '../phos-forge/router.mjs'

const BENCH = '/home/p31/P31-local-workspace/tools/jitterbug-bench'
const OUT = resolve(BENCH, 'runs', 'probe')
mkdirSync(OUT, { recursive: true })

// Research candidates from models-catalog.json (functionCalling + researchable).
// Price per M input from the catalog; latency is what we measure.
const CANDIDATES = [
  '@cf/google/gemma-4-26b-a4b-it',          // current pick, $0.10
  '@cf/zai-org/glm-4.7-flash',              // $0.06, small
  '@cf/deepseek-ai/deepseek-v4-flash-0731', // $0.44, 1M ctx
  '@cf/qwen/qwen3.8-27b',                   // $0.45, 262K
]

// Fixed research-style prompt — mirrors the jitterbug facet task shape.
const SYSTEM = 'You are a deeply curious research agent. Explore the facet exhaustively. Cover technical architecture, design implications, edge cases, and concrete recommendations. Output 700-1200 words of substantial research.'
const USER = 'Research the evidence base and design implications of capacity-adaptive interfaces for neurodivergent users. Cover spoon theory (Miserandino), cognitive load theory (Sweller), WCAG 2.2 COGA criteria, and a concrete token system for a 0-5 capacity dial.'

async function probeModel(model, runs) {
  const samples = []
  for (let i = 0; i < runs; i++) {
    try {
      const r = await dispatchLLM(SYSTEM, USER, { task: 'research', tag: 'fast', privacy: 'workers-ai' }, {
        model, returnModel: true, maxTokens: 4096, temperature: 0.8,
      })
      samples.push({
        total_ms: r.totalMs ?? null,
        tps: r.tps ?? null,
        ttft_ms: r.ttftMs ?? null,
        content_len: (r.content ?? '').length,
        ok: true,
      })
    } catch (e) {
      samples.push({ ok: false, error: e.message.slice(0, 80) })
    }
    // Small spacing so burst throttling doesn't skew results.
    if (i < runs - 1) await new Promise((r) => setTimeout(r, 2000))
  }
  return samples
}

function meanStd(arr) {
  const v = arr.filter((x) => x !== null && typeof x === 'number')
  if (v.length === 0) return { mean: null, std: null }
  const mean = v.reduce((a, b) => a + b, 0) / v.length
  const std = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / v.length)
  return { mean: Math.round(mean), std: Math.round(std) }
}

async function main() {
  const runs = parseInt(process.argv.find((a) => a === '--runs') ? process.argv[process.argv.indexOf('--runs') + 1] : '3', 10) || 3
  const results = []
  for (const model of CANDIDATES) {
    process.stdout.write(`probing ${model.split('/').pop()} (${runs}x)... `)
    const samples = await probeModel(model, runs)
    const ok = samples.filter((s) => s.ok)
    const total = meanStd(ok.map((s) => s.total_ms))
    const tps = meanStd(ok.map((s) => s.tps))
    results.push({ model, samples, summary: { total_ms: total, tps, n_ok: ok.length } })
    console.log(`mean ${total.mean}ms (${total.std}σ) tps ${tps.mean} (${tps.std}σ) ${ok.length}/${runs} ok`)
  }

  writeFileSync(resolve(OUT, 'probe-results.json'), JSON.stringify({ generated: new Date().toISOString(), candidates: CANDIDATES, results }, null, 2))
  console.log(`\nprobe written -> ${resolve(OUT, 'probe-results.json')}`)
}

main().catch((e) => { console.error(e); process.exit(1) })