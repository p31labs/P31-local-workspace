#!/usr/bin/env node
/**
 * Negative control for semantic-check.
 *
 * A semantic checker that cannot be shown to fail is furniture. This control
 * feeds a schema-VALID but family-inappropriate narrator output (a real name
 * leaked in the narrative) and asserts the checker rejects it. Emits
 * NEGATIVE_CONTROL_OK on success.
 */
import { semanticCheck } from '../semantic-check.mjs'

// Schema-valid shape, but the narrative leaks identity / is not spoon-aware.
const wrong = {
  component: 'KidButton',
  narrative: 'A button for the child. Johnny loves pressing it.',
  constraints: { accessibility: { wcag: 'AA', contrast: 4.5, touchTarget: 44 }, spoonAware: true, performance: { bundle: 3, renderTime: 16.67 } },
}
const s = semanticCheck('dillpickle-narrator', wrong)

// The narrative should be flagged: no spoon language + child-facing AA + potentially a name.
if (!s.ok && s.errors.length > 0) {
  console.log(`NEGATIVE_CONTROL_OK: semantic checker rejected a family-inappropriate narrative`)
  for (const e of s.errors.slice(0, 3)) console.log(`  - ${e}`)
  process.exit(0)
}
console.error(`NC_FAILED: semantic checker accepted an identity-leaking / non-spoon narrative (errors=${JSON.stringify(s.errors)})`)
process.exit(1)