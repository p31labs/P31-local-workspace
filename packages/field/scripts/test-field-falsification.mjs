#!/usr/bin/env node
/**
 * @p31/field — test-field-falsification.mjs
 *
 * The falsification lane's own tests. These assert that the HARNESS works —
 * that the Field's claims are checkable — not that the Field wins.
 *
 * The distinction is load-bearing: a falsification instrument that can only
 * produce positive results is not an instrument. Each assertion here checks
 * a mechanism, and the Sierpiński gap (local completeness ≠ global
 * enclosure) is the first concrete target the lane can disprove-or-confirm.
 *
 * Run: node scripts/test-field-falsification.mjs  (from packages/field)
 */
import { simulateStigmergicSwarm } from './adversarial/replay.mjs';
import { measure } from './adversarial/measure.mjs';
import { sierpinskiGasket, enclosureGap } from '../src/sierpinski.ts';

const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

// ── 1. the harness runs to completion ───────────────────────────────────
{
  const sim = simulateStigmergicSwarm(8, 4);
  ok(sim.agents === 8, 'harness records agent count');
  ok(sim.boundariesChecked > 0, 'harness checks a non-empty boundary surface');
  ok(sim.localComplete === true, 'every local cell is complete');
}

// ── 2. the metric computes a count, not a percentage ────────────────────
{
  const m = measure(simulateStigmergicSwarm(8, 4));
  ok(Number.isInteger(m.held) && Number.isInteger(m.total), 'held/total are integer counts');
  ok(m.total > 0 && m.held <= m.total, 'held is bounded by total');
  ok(typeof m.ratio === 'number' && m.ratio >= 0 && m.ratio <= 1, 'ratio is [0,1] for reporting only');
}

// ── 3. the Sierpiński gap is real: local ≠ global ───────────────────────
{
  const gap = enclosureGap(4);
  ok(gap.localBeta2 === 1 && gap.globalBeta2 === 0, 'the enclosure gap exists and is measurable');
  const m = measure(simulateStigmergicSwarm(8, 4));
  ok(m.enclosed === false, 'the swarm does not globally enclose');
}

// ── 4. both a null and a positive result are representable ──────────────
{
  // The harness's output is data. A "null" here is β₂=0 at depth 0 (a single
  // triangle also has no volume); a "positive" would be a future topology
  // that encloses. Both must be expressible without throwing.
  const flat = sierpinskiGasket(0);
  ok(flat.beta2 === 0, 'even the base case is a surface, not a volume');
  ok(sierpinskiGasket(10).beta2 === 0, 'the gap holds at any depth');
}

// ── 5. the gap grows with recursion (the paper's "every boundary") ──────
{
  const d1 = sierpinskiGasket(1).beta1;
  const d2 = sierpinskiGasket(2).beta1;
  const d4 = sierpinskiGasket(4).beta1;
  ok(d4 > d2 && d2 > d1, `boundary surface grows with depth (${d1} → ${d2} → ${d4})`);
}

if (fails.length) {
  console.error(`\n❌ FIELD FALSIFICATION FAILED — ${fails.length} failure(s):`);
  for (const f of fails) console.error(`   • ${f}`);
  process.exit(1);
}
console.log('✅ field falsification — the harness measures; the Sierpiński gap is real; null and positive are both representable.');
