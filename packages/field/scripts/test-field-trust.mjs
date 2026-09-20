#!/usr/bin/env node
/**
 * @p31/field — test-field-trust.mjs
 *
 * Lane α. The trust function, upgraded: volatility (ClankerScore) and
 * confidence (PDR). Each assertion names the research it discharges.
 *
 * Run: node scripts/test-field-trust.mjs  (from packages/field)
 */
import {
  trust,
  volatility,
  confidence,
  redBoardFactor,
} from '../src/index.ts';

const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

const HALF = 7 * 24 * 3600 * 1000; // 7 days, ms
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

// ── 1. volatility distinguishes outcome-steady from outcome-oscillating ─
{
  // Steady: 10 successes across 10 days — consistent outcomes.
  const steady = Array.from({ length: 10 }, (_, i) =>
    tr({ actor: 'steady', ts: i * DAY, outcome: 'success' }),
  );
  // Oscillating: 10 alternating success/failure — inconsistent outcomes.
  const oscillating = Array.from({ length: 10 }, (_, i) =>
    tr({ actor: 'osc', ts: i * DAY, outcome: i % 2 === 0 ? 'success' : 'failure' }),
  );
  const vSteady = volatility('steady', steady, 10 * DAY, HALF);
  const vOsc = volatility('osc', oscillating, 10 * DAY, HALF);
  ok(vSteady === 1, `steady outcomes have volatility factor 1 (${vSteady})`);
  ok(vOsc < 1, `oscillating outcomes have volatility < 1 (${vOsc})`);
}

// ── 2. confidence penalises narrow observation windows (PDR) ────────────
{
  const now = 10 * DAY;
  const burst = Array.from({ length: 30 }, (_, i) =>
    tr({ actor: 'burst', zone: 'z', ts: now - i * 60 * 1000, outcome: 'success' }),
  );
  const spread = Array.from({ length: 30 }, (_, i) =>
    tr({ actor: 'spread', zone: `z${i % 10}`, ts: now - i * DAY, outcome: 'success' }),
  );
  const cBurst = confidence('burst', burst, now, HALF);
  const cSpread = confidence('spread', spread, now, HALF);
  ok(cSpread > cBurst, `30 traces across 30 days out-confides 30 in an hour (${cSpread.toFixed(2)} vs ${cBurst.toFixed(2)})`);
}

// ── 3. trust = coherence × outcome × volatility × confidence ───────────
{
  const now = 10 * DAY;
  // Matched histories: same spread, same count — only coherence vs outcome
  // differs. A coherent actor with a failure history vs a decoherent actor
  // with success history.
  const coherentFail = Array.from({ length: 3 }, (_, i) =>
    tr({ actor: 'cf', zone: 'z', ts: now - i * DAY, outcome: 'failure', redBoard: 'coherent' }),
  );
  const decoherentSuccess = Array.from({ length: 3 }, (_, i) =>
    tr({ actor: 'ds', zone: 'z', ts: now - i * DAY, outcome: 'success', redBoard: 'hypomania' }),
  );
  const tCf = trust('cf', coherentFail, now, HALF);
  const tDs = trust('ds', decoherentSuccess, now, HALF);
  ok(tDs < tCf, `decoherent success (${tDs.toFixed(2)}) < coherent failure (${tCf.toFixed(2)})`);
}

// ── 4. out-of-lane trace is rejected (SOULSAFE Triad) ───────────────────
{
  const rogue = tr({ actor: 'rogue', coherence: 'out-of-lane', outcome: 'success' });
  ok(trust('rogue', [rogue], 1000, HALF) === 0.5, 'out-of-lane traces leave trust neutral');
}

// ── 5. competence model (manifest.yaml shape) gates lanes ───────────────
{
  // The model shape: actor → set of zones it may touch. Derived from
  // manifest.yaml's competence/not_competent lists.
  const competence = {
    inLane: (actor, zone) => {
      if (actor === 'home-guardian') return zone === 'HomePage' || zone === 'SpoonGauge';
      return true;
    },
  };
  const now = 10 * DAY;
  // Matched histories: same spread, same count — only the zone differs.
  const inLaneTraces = Array.from({ length: 3 }, (_, i) =>
    tr({ actor: 'home-guardian', zone: 'HomePage', coherence: 'in-lane', outcome: 'success', ts: now - i * DAY }),
  );
  const outOfLaneTraces = Array.from({ length: 3 }, (_, i) =>
    tr({ actor: 'home-guardian', zone: 'CockpitView', coherence: 'in-lane', outcome: 'success', ts: now - i * DAY }),
  );

  const tIn = trust('home-guardian', inLaneTraces, now, HALF, competence);
  const tOut = trust('home-guardian', outOfLaneTraces, now, HALF, competence);
  ok(tOut === 0.5, `out-of-lane per manifest is rejected → neutral (${tOut})`);
  ok(tIn > tOut, `in-lane per manifest scores above the rejected out-of-lane (${tIn.toFixed(2)} vs ${tOut})`);
}

// ── 6. Red Board model (weft shape) weights operator state ──────────────
{
  const redBoard = { state: (actor) => (actor === 'tired' ? 'burnout' : 'coherent') };
  const now = 10 * DAY;
  const fresh = Array.from({ length: 3 }, (_, i) =>
    tr({ actor: 'fresh', zone: 'z', outcome: 'success', ts: now - i * DAY }),
  );
  const tired = Array.from({ length: 3 }, (_, i) =>
    tr({ actor: 'tired', zone: 'z', outcome: 'success', ts: now - i * DAY }),
  );
  const tFresh = trust('fresh', fresh, now, HALF, undefined, redBoard);
  const tTired = trust('tired', tired, now, HALF, undefined, redBoard);
  ok(redBoardFactor('burnout') < redBoardFactor('coherent'), 'burnout coherence factor is lower');
  ok(tTired < tFresh, `burnout operator (${tTired.toFixed(2)}) weighs less than coherent (${tFresh.toFixed(2)})`);
}

// ── 7. volatility of actions ≠ volatility of outcomes ───────────────────
{
  // A legitimately varied actor (different frames, different zones) but
  // consistent outcomes should NOT be penalised as erratic.
  const varied = [
    tr({ actor: 'v', frame: 'structure', zone: 'z1', outcome: 'success', ts: 1000 }),
    tr({ actor: 'v', frame: 'rhythm', zone: 'z2', outcome: 'success', ts: 2000 }),
    tr({ actor: 'v', frame: 'creation', zone: 'z3', outcome: 'success', ts: 3000 }),
  ];
  const v = volatility('v', varied, 4000, HALF);
  ok(v === 1, `varied actions with steady outcomes are not penalised (${v})`);
}

if (fails.length) {
  console.error(`\n❌ FIELD TRUST FAILED — ${fails.length} failure(s):`);
  for (const f of fails) console.error(`   • ${f}`);
  process.exit(1);
}
console.log('✅ field trust — volatility, confidence, competence gating, Red Board weighting. All green.');
