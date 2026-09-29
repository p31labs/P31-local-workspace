#!/usr/bin/env node
/**
 * pipeline-runner.mjs — run a design request through the full Lantern
 * pipeline (narrator → architect → mechanic → firmware), with the prompt
 * payloads, schema validation at each boundary, and budget tracking.
 *
 * Usage: node tools/agent-router/pipeline-runner.mjs --request "<text>"
 *        node tools/agent-router/pipeline-runner.mjs --request "<text>" --dry-run
 *
 * The prompt payloads live in packages/design-core/src/agentic/agents/*.prompt.md.
 * This runner reads them, injects the request, routes each stage.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runStage, getMetrics } from './router.mjs'
import { BudgetTracker } from './budget.mjs'

const REPO = '/home/p31/P31-local-workspace'
const AGENTS = resolve(REPO, 'packages/design-core/src/agentic/agents')

function loadPrompt(file) {
  return readFileSync(resolve(AGENTS, file), 'utf8')
}

const arg = (name) => {
  const i = process.argv.indexOf(name)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null
}

const request = arg('--request')
const dryRun = process.argv.includes('--dry-run')
if (!request) {
  console.error('usage: pipeline-runner.mjs --request "<text>" [--dry-run]')
  process.exit(2)
}

const STAGE_FILES = {
  'dillpickle-narrator': 'dillpickle-narrator.prompt.md',
  'cornichon-architect': 'cornichon-architect.prompt.md',
  'breadbutter-mechanic': 'breadbutter-mechanic.prompt.md',
  'gherkin-firmware': 'gherkin-firmware.prompt.md',
}

const budget = new BudgetTracker({ budgetUsd: 0.5, perStageMaxUsd: 0.15 })
const results = {}

for (const [stage, file] of Object.entries(STAGE_FILES)) {
  const systemPrompt = loadPrompt(file)
  const input = stage === 'dillpickle-narrator' ? request : (results[prevStage(stage)]?.output?.toString() ?? request)
  if (dryRun) {
    console.log(`[dry-run] ${stage} — would route intent=${stageIntent(stage)} with payload ${file}`)
    results[stage] = { ok: true, output: null, dryRun: true }
    continue
  }
  const charge = budget.charge(stage, stageIntent(stage) === 'reasoning' ? 40 : stageIntent(stage) === 'coding' ? 12 : stageIntent(stage) === 'fast' ? 4 : 4)
  if (!charge.ok) {
    console.error(`✗ ${stage}: ${charge.error} (used ${charge.used}/${charge.cap})`)
    results[stage] = { ok: false, error: charge.error }
    break
  }
  const r = await runStage(stage, systemPrompt, input)
  results[stage] = r
  console.log(`[${stage}] ${r.ok ? '✅' : '✗'} attempts=${r.attempts} model=${r.modelUsed ?? '-'}${r.errors?.length ? ` errors=${r.errors.slice(0,2).join(';')}` : ''}`)
  if (!r.ok) break
}

function prevStage(stage) {
  const order = Object.keys(STAGE_FILES)
  const i = order.indexOf(stage)
  return i > 0 ? order[i - 1] : null
}
function stageIntent(stage) {
  return { 'dillpickle-narrator': 'fast', 'cornichon-architect': 'reasoning', 'breadbutter-mechanic': 'coding', 'gherkin-firmware': 'fast' }[stage]
}

console.log('\n=== metrics ===')
console.log(JSON.stringify({ perStage: getMetrics(), budget: budget.usage() }, null, 2))
process.exit(Object.values(results).some((r) => r.ok === false) ? 1 : 0)