#!/usr/bin/env node
/**
 * run-bench.mjs — four P31 research prompts through Jitterbug + frontier tier.
 * Then strip identity, judge blind against rubric.json, score, report.
 *
 * Usage:
 *   node tools/jitterbug-bench/run-bench.mjs --skip-frontier   # jitterbug only
 *   node tools/jitterbug-bench/run-bench.mjs --skip-jitterbug  # baseline only
 *   node tools/jitterbug-bench/run-bench.mjs                   # full comparison
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { runJitterbug, callLLM } from '../phos-forge/jitterbug.mjs'

const BENCH = '/home/p31/P31-local-workspace/tools/jitterbug-bench'
const OUT = resolve(BENCH, 'runs', new Date().toISOString().slice(0, 10))
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })

const rubric = JSON.parse(readFileSync(resolve(BENCH, 'rubric.json'), 'utf8'))
const skipJitterbug = process.argv.includes('--skip-jitterbug')
const skipFrontier = process.argv.includes('--skip-frontier')
const FRONTIER_MODELS = ['glm-5.3', 'deepseek-v4-pro']

async function runJitterbugForPrompt(text) {
  const r = await runJitterbug(text, { depth: 2, factor: 3, workersAI: true })
  return { source: 'jitterbug', report: r.output ?? '', session: r.session }
}

async function runFrontierForPrompt(text, tag) {
  const r = await callLLM(
    'You are a deep research agent. Produce a structured, citation-backed report. Every claim must have a resolvable citation.',
    text,
    { intent: { task: 'research', tag, privacy: 'workers-ai' } },
  )
  return { source: `frontier:${tag}`, report: r ?? '', session: null }
}

// The rubric DECLARES deepseek-v4-flash as judge; the router's `reasoning`
// intent otherwise selects the highest-price reasoning model (glm-5.3 — the
// stalling model). Pin the judge so declared == actual.
const JUDGE_MODEL = '@cf/deepseek-ai/deepseek-v4-flash-0731'

async function judgeReport(report, promptRubric) {
  const criteria = promptRubric.rubrics
    .map((r) => `- [${r.id}] ${r.criterion} (weight ${r.weight}, axis ${r.axis})`)
    .join('\n')
  const sys = 'You are a calibrated rubric judge. For each criterion, return one of: Satisfied, Partially, Not Satisfied. For negative criteria, return Present or Absent. Output strict JSON: {"scores":[{"id":"...","verdict":"..."}]}'
  const user = `## Report\n${report}\n\n## Criteria\n${criteria}`
  const raw = await callLLM(sys, user, { intent: { task: 'reasoning', tag: 'reasoning', privacy: 'workers-ai' }, model: JUDGE_MODEL })
  try {
    const cleaned = String(raw).replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return { scores: [] }
  }
}

function computeCompliance(judgement, promptRubric) {
  let numerator = 0
  let positiveWeight = 0
  for (const c of promptRubric.rubrics) {
    const v = judgement.scores.find((s) => s.id === c.id)?.verdict
    const score = v === 'Satisfied' ? 1.0 : v === 'Partially' ? 0.5 : 0.0
    if (c.weight > 0) {
      positiveWeight += c.weight
      numerator += c.weight * score
    } else if (c.weight < 0 && v === 'Present') {
      numerator += c.weight
    }
  }
  return positiveWeight > 0 ? numerator / positiveWeight : 0
}

async function main() {
  const results = []
  for (const [id, promptRubric] of Object.entries(rubric.prompts)) {
    const text = readFileSync(resolve(BENCH, 'prompts', `${id}.md`), 'utf8')
    console.log(`\n=== ${id} ===`)
    const rows = []

    if (!skipJitterbug) {
      process.stdout.write('  jitterbug ...')
      try {
        const r = await runJitterbugForPrompt(text)
        rows.push(r)
        console.log(` ok (session ${r.session})`)
      } catch (e) {
        console.log(` FAILED: ${e.message}`)
      }
    }

    if (!skipFrontier) {
      for (const model of FRONTIER_MODELS) {
        process.stdout.write(`  frontier:${model} ...`)
        try {
          const r = await runFrontierForPrompt(text, model)
          rows.push(r)
          console.log(' ok')
        } catch (e) {
          console.log(` FAILED: ${e.message}`)
        }
      }
    }

    for (const row of rows) {
      const j = await judgeReport(row.report, promptRubric)
      const compliance = computeCompliance(j, promptRubric)
      console.log(`  -> ${row.source}: compliance ${compliance.toFixed(3)}`)
      results.push({ prompt: id, source: row.source, compliance, judgement: j, report: row.report, session: row.session })
    }
  }

  const bySource = {}
  for (const r of results) {
    bySource[r.source] = bySource[r.source] ?? []
    bySource[r.source].push(r.compliance)
  }
  const summary = Object.entries(bySource).map(([source, scores]) => ({
    source,
    mean_compliance: scores.reduce((a, b) => a + b, 0) / scores.length,
    pass_at_k: scores.filter((s) => s >= 0.70).length / scores.length,
    n: scores.length,
  }))

  writeFileSync(resolve(OUT, 'results.json'), JSON.stringify({ results, summary }, null, 2))
  writeFileSync(resolve(OUT, 'SUMMARY.md'), [
    '# Jitterbug Bench',
    `Run: ${new Date().toISOString()}`,
    '',
    '| Source | Mean compliance | Pass@k | n |',
    '|---|---|---|---|',
    ...summary.map((s) => `| ${s.source} | ${s.mean_compliance.toFixed(3)} | ${(s.pass_at_k * 100).toFixed(0)}% | ${s.n} |`),
  ].join('\n'))
  console.log(`\nbench complete -> ${OUT}`)
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((e) => { console.error(e); process.exit(1) })