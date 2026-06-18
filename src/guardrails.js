# WCD-06: SIGNED — P31-OQE <2026-06-18> — T-0 guardrails split-cable repair
/**
 * DEPRECATED — DO NOT USE
 *
 * CANONICAL SOURCE: guardrails.ts (same directory)
 *
 * This file triggers a fatal error at module load time to enforce migration.
 * Any code importing guardrails.js will fail fast with instructions.
 * Imports of guardrails.js WILL be removed from production code.
 *
 * Migration path:
 *   import { evaluateGuardrails } from '../src/guardrails.js';
 *   →
 *   import { evaluateGuardrails } from '../guardrails.ts';
 */

throw new Error(
  '[GUARDRAILS DEPRECATED] ' +
  'guardrails.js is no longer a valid module. ' +
  'Migrate the import to guardrails.ts: ' +
  'import { evaluateGuardrails } from \'../guardrails.ts\'; ' +
  'See P31-SOP: GUARDRAILS-001'
)
