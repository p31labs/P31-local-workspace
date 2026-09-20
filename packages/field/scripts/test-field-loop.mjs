#!/usr/bin/env node
/**
 * @p31/field — test-field-loop.mjs
 *
 * Lane β. The loop: does the field drive action, and is that action's
 * outcome measurable? rankByField, decide, outcomeCorrelation.
 *
 * Run: node scripts/test-field-loop.mjs  (from packages/field)
 */
import { rankByField, decide, failureHistory, outcomeCorrelation } from '../src/loop.ts';

const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

const HALF = 7 * 24 * 3600 * 1000;
const DAY = 24 * 3600 * 1000;

function tr(over = {}) {
  return {
    actor: 'a',
    zone: 'z',
    frame: 'structure',
    kind: 'propose',
    payload: { x: 1 },
    preImage: 'abc',
    postImage: 'def',
    coherence: 'in-lane',
    ts: 0,
    ...over,
  };
}

// ── 1. empty field falls back to static signal ──────────────────────────
{
  const zones = [{ id: 'a', signal: 10 }, { id: 'b', signal: 90 }, { id: 'c', signal: 50 }];
  const ranked = rankByField(zones, [], 1000, HALF);
  ok(ranked[0].id === 'b', 'empty field preserves static order (highest signal first)');
  ok(ranked[0].fieldScore === 90, 'empty field: fieldScore equals static signal');
}

// ── 2. a warm field reorders equal-signal zones by field evidence ───────
{
  const now = 1000;
  // Same static signal; one is touched (pressure + fresh reference), the
  // other is not. The touched one outranks.
  const zones = [{ id: 'hot', signal: 50 }, { id: 'cold', signal: 50 }];
  const traces = [
    tr({ zone: 'hot', kind: 'propose', ts: now }),
    tr({ zone: 'hot', kind: 'reference', ts: now }),
    tr({ zone: 'hot', kind: 'propose', ts: now }),
  ];
  const ranked = rankByField(zones, traces, now, HALF);
  ok(ranked[0].id === 'hot', `a touched zone outranks an equal-signal untouched zone (${ranked.map((r) => r.id).join(',')})`);
  ok(ranked[1].fieldScore === 50, 'the untouched zone keeps its static signal unchanged');
}

// ── 3. failure history demotes a zone ───────────────────────────────────
{
  const now = 1000;
  const zones = [{ id: 'fresh', signal: 50 }, { id: 'failed', signal: 50 }];
  const traces = [
    tr({ zone: 'fresh', kind: 'reference', ts: now }),
    tr({ zone: 'fresh', kind: 'propose', ts: now, outcome: 'success' }),
    tr({ zone: 'failed', kind: 'reference', ts: now }),
    tr({ zone: 'failed', kind: 'propose', ts: now, outcome: 'failure' }),
    tr({ zone: 'failed', kind: 'propose', ts: now, outcome: 'failure' }),
  ];
  const fh = failureHistory('failed', traces, now, HALF);
  ok(fh > 0, `failure history is positive for the failed zone (${fh})`);
  const ranked = rankByField(zones, traces, now, HALF);
  ok(ranked[0].id === 'fresh', 'a zone with failure history ranks below an equal-signal clean one');
}

// ── 4. decide returns the top zone with its pressure/hazard ─────────────
{
  const ranked = [
    { id: 'top', signal: 0, fieldScore: 7, pressure: 3, hazard: 4, failureHistory: 0 },
    { id: 'next', signal: 0, fieldScore: 2, pressure: 1, hazard: 1, failureHistory: 0 },
  ];
  const d = decide(ranked, 0.8);
  ok(d !== null && d.zone === 'top', 'decide picks the top-ranked zone');
  ok(d.pressure === 3 && d.hazard === 4 && d.trust === 0.8, 'decide carries the field snapshot and actor trust');
  ok(decide([], 0.8) === null, 'decide on an empty ranking is null');
}

// ── 5. outcomeCorrelation returns a number, or null with too few pairs ──
{
  const now = 1000;
  // Four decisions at four zones, each followed by one outcome. Pressure
  // rises (1..4) while outcome goes success, failure, failure, failure — so
  // higher pressure correlates with worse outcome (negative correlation).
  const traces = [
    tr({ zone: 'a', outcome: 'success', ts: now + 1 }),
    tr({ zone: 'b', outcome: 'failure', ts: now + 1 }),
    tr({ zone: 'c', outcome: 'failure', ts: now + 1 }),
    tr({ zone: 'd', outcome: 'failure', ts: now + 1 }),
  ];
  const decisions = [
    { zone: 'a', pressure: 1, ts: now },
    { zone: 'b', pressure: 2, ts: now },
    { zone: 'c', pressure: 3, ts: now },
    { zone: 'd', pressure: 4, ts: now },
  ];
  const c = outcomeCorrelation(decisions, traces);
  ok(typeof c === 'number' && c >= -1 && c <= 1, `correlation is in [-1,1] (${c?.toFixed(2)})`);
  ok(c < 0, `rising pressure + worsening outcome → negative correlation (${c.toFixed(2)})`);
  ok(outcomeCorrelation([{ zone: 'a', pressure: 1, ts: now }], traces) === null, 'fewer than three pairs → null');
}

// ── 6. the loop is deterministic ────────────────────────────────────────
{
  const zones = [{ id: 'a', signal: 1 }, { id: 'b', signal: 2 }];
  const traces = [tr({ zone: 'a', ts: 1000 })];
  const r1 = rankByField(zones, traces, 1000, HALF);
  const r2 = rankByField(zones, traces, 1000, HALF);
  ok(JSON.stringify(r1) === JSON.stringify(r2), 'rankByField is deterministic');
}

if (fails.length) {
  console.error(`\n❌ FIELD LOOP FAILED — ${fails.length} failure(s):`);
  for (const f of fails) console.error(`   • ${f}`);
  process.exit(1);
}
console.log('✅ field loop — rankByField, decide, failure history, outcome correlation. All green.');
