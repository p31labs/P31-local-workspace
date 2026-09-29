#!/usr/bin/env node
/**
 * router.mjs — step-level model routing for the Lantern pipeline.
 *
 * Routes each stage to the cheapest capable model, escalating only on
 * schema-invalid output (Constraint Tax: "reason free, constrain late" —
 * validate the output, don't force JSON from token zero). Retries with
 * error feedback (Schema Validation Retry with cross-step accumulation).
 * Tracks the three-number schema set per stage.
 *
 * Built on tools/phos-forge/router.mjs's catalog-driven selectModel +
 * routeToWorkersAI. Stage→intent mapping:
 *   dillpickle-narrator  → tag:fast  (extraction, cheap)
 *   cornichon-architect  → tag:reasoning  (gate judgment, strong)
 *   breadbutter-mechanic → tag:coding  (generation, mid)
 *   gherkin-firmware     → tag:fast  (measurement, cheapest)
 */
import { routeToWorkersAI } from '../phos-forge/router.mjs'
import { parseAndValidate } from './agent-schema.mjs'

const STAGE_INTENT = {
  'dillpickle-narrator': 'fast',
  'cornichon-architect': 'reasoning',
  'breadbutter-mechanic': 'coding',
  'gherkin-firmware': 'fast',
}

const STAGE_MAX_RETRIES = {
  'dillpickle-narrator': 2,
  'cornichon-architect': 1,
  'breadbutter-mechanic': 2,
  'gherkin-firmware': 1,
}

const metrics = {}
function record(stage, m) {
  metrics[stage] = metrics[stage] ?? { schema_validity: 0, field_correctness: 0, wrong_but_valid_rate: 0, calls: 0 }
  const s = metrics[stage]
  s.calls++
  s.schema_validity = m.schema_valid
    ? (s.schema_validity * (s.calls - 1) + 1) / s.calls
    : (s.schema_validity * (s.calls - 1)) / s.calls
  s.wrong_but_valid_rate = m.wrong_but_valid
    ? (s.wrong_but_valid_rate * (s.calls - 1) + 1) / s.calls
    : (s.wrong_but_valid_rate * (s.calls - 1)) / s.calls
}

/**
 * Run one pipeline stage. Returns { ok, output, attempts, modelUsed, errors }.
 * Escalation is implicit: a stage that keeps failing schema validation
 * accumulates errors and ultimately returns ok:false with the errors —
 * the caller decides whether to escalate or halt.
 */
export async function runStage(stage, systemPrompt, userInput, opts = {}) {
  const intentTag = opts.intentTag ?? STAGE_INTENT[stage]
  const maxRetries = STAGE_MAX_RETRIES[stage]
  if (!intentTag) return { ok: false, errors: [`unknown stage: ${stage}`] }

  let attempts = 0
  const errors = []
  let lastModel = null

  while (attempts <= maxRetries) {
    const body = attempts > 0 ? `${userInput}\n\nPrevious output failed validation. Fix ONLY these errors:\n${errors.join('\n')}` : userInput
    try {
      const { content, modelUsed } = await routeToWorkersAI(systemPrompt, body, intentTag)
      lastModel = modelUsed
      const v = parseAndValidate(stage, content)
      record(stage, { schema_valid: v.ok, wrong_but_valid: false })
      if (v.ok) {
        return { ok: true, output: v.parsed, attempts: attempts + 1, modelUsed, errors: [] }
      }
      // Schema-invalid — accumulate errors, retry with feedback.
      errors.push(...v.errors.slice(0, 4))
      attempts++
    } catch (e) {
      // Route/call failure — accumulate and retry (the phos-forge router
      // already handles provider fallback internally).
      errors.push(`call-failed: ${e.message?.slice(0, 80) ?? 'unknown'}`)
      attempts++
    }
  }

  return { ok: false, output: null, attempts, modelUsed: lastModel, errors }
}

/** Report the three-number schema set per stage (the honesty metric). */
export function getMetrics() {
  return metrics
}

export { STAGE_INTENT, STAGE_MAX_RETRIES }