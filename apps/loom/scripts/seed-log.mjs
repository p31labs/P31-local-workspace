#!/usr/bin/env node
/**
 * The Loom — seed log.
 *
 * Writes a fixed human+agent sequence through commit() so the canvas has
 * something to render before the presence lane's demo agent exists. Uses the
 * SAME resolveLogPath() as the dev middleware, so both write one log.
 *
 * Run: pnpm seed  (from apps/loom)
 */
import { commit } from '@p31/canon/loom/commit';
import { resolveLogPath } from '../src/lib/logPath.ts';

const logPath = resolveLogPath();

const sequence = [
  { writer: 'human', kind: 'focus', node: '--p31-accent' },
  { writer: 'agent', kind: 'presence', node: '--p31-accent', attention: 1 },
  { writer: 'agent', kind: 'traverse', from: '--p31-accent', to: '.glass-card', reason: 'referenced-by' },
  { writer: 'agent', kind: 'propose', id: 'prop_seed_1', node: '.feature-card', body: { draft: true } },
  { writer: 'agent', kind: 'presence', node: '.feature-card', attention: 0.8 },
];

console.log(`seeding ${logPath}`);
for (const input of sequence) {
  const r = commit(logPath, input);
  if (r.valid) console.log(`  ok  seq=${r.event.seq}  ${input.kind}`);
  else console.error(`  FAIL ${input.kind}: ${r.error}`);
}
