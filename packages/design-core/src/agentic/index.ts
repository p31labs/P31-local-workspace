export { parseIntent, summarize } from './intent/parser';
export type { ParseResult } from './intent/parser';
export { intentSpecSchema, type IntentSpec } from './intent/schema';
export { runQaGates, type GateReport, type GateCheck } from './qa/gates';
// NOTE: orchestrate.ts + loadExampleSpecs read node:fs — not browser-safe.
// Import them from '@p31/design-core/agentic/orchestrate' in Node contexts only.
