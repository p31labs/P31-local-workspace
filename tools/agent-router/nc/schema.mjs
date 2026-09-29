#!/usr/bin/env node
/**
 * Negative control for agent-schema validation.
 *
 * A validator that cannot be shown to fail is furniture. This control feeds
 * the validator a deliberately wrong output (a schema-valid-shaped object
 * with an out-of-enum verdict) and asserts it rejects. Emits
 * NEGATIVE_CONTROL_OK on success.
 */
import { validateStageOutput } from '../agent-schema.mjs'

const bad = {
  component: 'X',
  bundleKB: 1,
  renderTimeMs: 1,
  budgetKB: 1,
  budgetMs: 1,
  verdict: 'maybe', // out-of-enum — must reject
  detail: 'wrong',
}
const v = validateStageOutput('gherkin-firmware', bad)

if (!v.ok && v.errors.some((e) => e.includes('verdict'))) {
  console.log('NEGATIVE_CONTROL_OK: schema validator rejected an out-of-enum verdict')
  process.exit(0)
}
console.error(`NC_FAILED: validator accepted verdict "maybe" (errors=${JSON.stringify(v.errors)})`)
process.exit(1)