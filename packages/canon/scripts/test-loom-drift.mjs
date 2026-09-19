#!/usr/bin/env node
/**
 * @p31/canon — test-loom-drift.mjs
 *
 * Knowledge-drift instrumentation: the Jaccard survival metric over the
 * human revise chain. `revisionSurvival[i]` is the overlap of revision i+1
 * against revision i; `overallSurvival` is their mean (1.0 with no revisions).
 * Deterministic arithmetic, no model calls.
 *
 * Run: node scripts/test-loom-drift.mjs  (from packages/canon)
 */
import { ReplayGate } from '../src/loom/gate.ts';
import { replay } from '../src/loom/events.ts';

const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

function build(revises) {
  const g = new ReplayGate();
  g.append({ writer: 'agent', kind: 'propose', id: 'p1', node: '.x', body: revises[0] });
  for (let i = 1; i < revises.length; i++) {
    g.append({ writer: 'human', kind: 'revise', proposal: 'p1', body: revises[i] });
  }
  return replay(g.getLog()).proposals.get('p1');
}

// ── 1. no revisions -> overallSurvival 1.0, empty array ────────────────
{
  const p = build([{ a: 1 }]);
  ok(p.revisionSurvival.length === 0, 'revisionSurvival empty at revision 0');
  ok(p.overallSurvival === 1.0, 'overallSurvival is 1.0 with no revisions');
}

// ── 2. value-only change -> survival < 1.0 ─────────────────────────────
{
  const p = build([{ a: 1, b: 2 }, { a: 1, b: 3 }]);
  ok(p.revisionSurvival.length === 1, 'one survival entry after one revise');
  ok(p.revisionSurvival[0] > 0 && p.revisionSurvival[0] < 1.0, `value change is partial (${p.revisionSurvival[0]})`);
}

// ── 3. key addition -> Jaccard penalizes it (< 1.0) ────────────────────
{
  const p = build([{ a: 1 }, { a: 1, b: 2, c: 3, d: 4 }]);
  ok(p.revisionSurvival[0] < 1.0, `addition lowers survival (${p.revisionSurvival[0]})`);
  ok(p.revisionSurvival[0] > 0, 'shared leaf keeps survival above 0');
}

// ── 4. full body replacement -> survival < 0.2 ─────────────────────────
{
  const p = build([{ a: 1, b: 2, c: 3, d: 4 }, { w: 9, x: 8, y: 7, z: 6 }]);
  ok(p.revisionSurvival[0] < 0.2, `disjoint bodies near 0 (${p.revisionSurvival[0]})`);
}

// ── 5. both bodies empty -> survival 1.0 ───────────────────────────────
{
  const p = build([{}, {}]);
  ok(p.revisionSurvival[0] === 1.0, 'empty -> empty is no change');
}

// ── 6. one body empty -> survival 0.0 ──────────────────────────────────
{
  const p = build([{ a: 1 }, {}]);
  ok(p.revisionSurvival[0] === 0.0, 'non-empty -> empty is total change');
}

// ── 7. monotone decline -> overallSurvival below 0.5 ───────────────────
{
  const bodies = [];
  for (let i = 0; i < 11; i++) {
    const b = {};
    for (let k = 0; k < 11; k++) b[`k${(i + k) % 17}`] = k; // shifting key sets
    bodies.push(b);
  }
  const p = build(bodies);
  ok(p.revisionSurvival.length === 10, 'ten survival entries');
  ok(p.overallSurvival < 0.5, `declining chain has low mean survival (${p.overallSurvival.toFixed(2)})`);
}

if (fails.length) {
  console.error(`\n❌ LOOM DRIFT FAILED — ${fails.length} failure(s):`);
  for (const f of fails) console.error(`   • ${f}`);
  process.exit(1);
}
console.log('✅ loom drift — Jaccard survival across revisions is deterministic and monotone-aware.');
