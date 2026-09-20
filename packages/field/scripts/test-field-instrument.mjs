#!/usr/bin/env node
/**
 * @p31/field — test-field-instrument.mjs
 *
 * The Instrument's own tests. Three properties, each asserted:
 *
 *   1. determinism — same inputs at the same atMs → byte-identical reading.
 *   2. the clock — decay moves the reading without new traces.
 *   3. the scaling contract — O(1) dots in system size, via selectConstellation.
 *
 * Run: node scripts/test-field-instrument.mjs  (from packages/field)
 */
import {
  projectInstrument,
  selectConstellation,
  shannonEntropy,
  edgeDensity,
  whiteSpaceRatio,
  RENDER_BUDGET,
} from '../src/instrument.ts';
import { makeZone } from '../src/index.ts';
import { WeftGate } from '../../../packages/canon/src/loom/weft.ts';

const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

const HALF = 7 * 24 * 3600 * 1000;
const DAY = 24 * 3600 * 1000;

function tr(over = {}) {
  return {
    actor: 'a',
    zone: 'z0',
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

// A K₄ zone with id zi.
function zone(i) {
  const v = ['c', 'l', 't', 'h'];
  return makeZone(`z${i}`, v, [
    [v[0], v[1]], [v[0], v[2]], [v[0], v[3]], [v[1], v[2]], [v[1], v[3]], [v[2], v[3]],
  ]);
}

// ── 1. determinism ──────────────────────────────────────────────────────
{
  const zones = [zone(0), zone(1)];
  const traces = [tr({ zone: 'z0', ts: 1000 })];
  const a = projectInstrument(zones, traces, 1000, null, HALF);
  const b = projectInstrument(zones, traces, 1000, null, HALF);
  ok(JSON.stringify(a) === JSON.stringify(b), 'a reading at the same atMs is byte-identical');
}

// ── 2. the clock: decay moves the reading without new traces ────────────
{
  const zones = [zone(0)];
  const traces = [tr({ zone: 'z0', ts: 0 })];
  const t0 = projectInstrument(zones, traces, 0, null, HALF);
  const t1 = projectInstrument(zones, traces, HALF, null, HALF);
  const t2 = projectInstrument(zones, traces, HALF * 2, null, HALF);
  ok(t0.zones[0].weight === 1, 'at deposit, weight is full');
  ok(Math.abs(t1.zones[0].weight - 0.5) < 1e-9, 'at one half-life, weight is 0.5');
  ok(Math.abs(t2.zones[0].weight - 0.25) < 1e-9, 'at two half-lives, weight is 0.25');
  ok(t0.zones[0].weight > t2.zones[0].weight, 'the interface cools over time — the clock is real');
}

// ── 3. complexity is measured, not hidden ───────────────────────────────
{
  const zones = [zone(0), zone(1), zone(2)];
  // One hot zone, two idle.
  const traces = [tr({ zone: 'z0', ts: 1000 })];
  const r = projectInstrument(zones, traces, 1000, null, HALF);
  ok(r.complexity.entropy >= 0 && r.complexity.entropy <= 1, 'entropy is normalized to [0,1]');
  ok(r.complexity.whiteSpace > 0.5, 'two of three zones idle → white space > 0.5');
  ok(r.complexity.edgeDensity === 1, 'all zones are K₄ → edge density 1');
}

// ── 4. Shannon entropy: uniform vs concentrated ─────────────────────────
{
  const uniform = shannonEntropy([1, 1, 1, 1]);
  const concentrated = shannonEntropy([1, 0, 0, 0]);
  ok(Math.abs(uniform - 1) < 1e-9, `uniform field → entropy 1 (${uniform})`);
  ok(concentrated === 0, `single hot zone → entropy 0 (${concentrated})`);
  ok(shannonEntropy([]) === 0, 'empty field → entropy 0');
}

// ── 5. the scaling contract: O(1) dots in system size ───────────────────
{
  for (const n of [10, 100, 1000, 10000]) {
    const zones = Array.from({ length: n }, (_, i) => zone(i));
    // A small trace field so weights are non-trivial.
    const traces = Array.from({ length: Math.min(n, 20) }, (_, i) =>
      tr({ zone: `z${i}`, ts: 1000 }),
    );
    const readings = projectInstrument(zones, traces, 1000, null, HALF).zones;
    const { visible, hidden } = selectConstellation(readings);
    ok(visible.length <= RENDER_BUDGET, `at ${n} zones, visible ≤ ${RENDER_BUDGET} (got ${visible.length})`);
    ok(visible.length + hidden === n, `at ${n} zones, visible + hidden = ${n}`);
    if (n <= RENDER_BUDGET) {
      ok(hidden === 0, `at ${n} ≤ budget, nothing hidden`);
    } else {
      ok(hidden > 0, `at ${n} > budget, ${hidden} zones hidden — a measured elision`);
    }
  }
}

// ── 6. focus: zone scale returns the one focused zone ───────────────────
{
  const zones = [zone(0), zone(1)];
  const traces = [tr({ zone: 'z0', ts: 1000 })];
  const focused = projectInstrument(zones, traces, 1000, 'z1', HALF);
  ok(focused.scale === 'zone', 'focus switches the scale to zone');
  ok(focused.zones.length === 1 && focused.zones[0].id === 'z1', 'zone scale returns only the focused zone');
}

// ── 7. reading is writing: a view.read event round-trips the weft gate ──
{
  const gate = new WeftGate();
  const r = gate.append({
    kind: 'view.read',
    scale: 'constellation',
    focus: null,
    entropy: 0.42,
    whiteSpace: 0.7,
    warpSeq: 0,
    humanId: 'will',
  });
  ok(r.valid, 'view.read passes the weft gate');
  const bad = gate.append({ kind: 'view.read', scale: 'nonsense', focus: null, entropy: 1, whiteSpace: 0, warpSeq: 0 });
  ok(!bad.valid, 'an invalid scale is rejected');
  const rehydrated = new WeftGate();
  ok(rehydrated.fromJSONL(gate.toJSONL()).valid, 'view.read round-trips through the gate');
}

if (fails.length) {
  console.error(`\n❌ FIELD INSTRUMENT FAILED — ${fails.length} failure(s):`);
  for (const f of fails) console.error(`   • ${f}`);
  process.exit(1);
}
console.log('✅ field instrument — deterministic, has a clock, measures complexity, scales O(1).');
