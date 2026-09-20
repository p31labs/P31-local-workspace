#!/usr/bin/env node
/**
 * @p31/field — test-field.mjs
 *
 * The Field's own gates. Each assertion names the paper section it discharges.
 * The Field is a falsification instrument, not a demonstration: these tests
 * check that the mechanics compute what the papers claim, and — where the
 * paper makes a testable prediction — that we report the number, not assert it.
 *
 * Run: node scripts/test-field.mjs  (from packages/field)
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  makeZone,
  decay,
  redBoardFactor,
  traceWeight,
  pressure,
  hazard,
  trust,
  zeroUtility,
  oneThirdDiagnostic,
} from '../src/index.ts';

const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

const HALF = 7 * 24 * 3600 * 1000; // 7 days, in ms — a design-system half-life

// A complete K₄ zone over the four artifact kinds.
const K4 = makeZone('z', ['Button', '.btn', '--p31-accent', 'ocean'], [
  ['Button', '.btn'], ['Button', '--p31-accent'], ['Button', 'ocean'],
  ['.btn', '--p31-accent'], ['.btn', 'ocean'], ['--p31-accent', 'ocean'],
]);

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

// ── 1. determinism: same traces, same atMs → identical field state ──────
{
  const traces = [tr({ actor: 'a' }), tr({ actor: 'b', frame: 'rhythm' })];
  const p1 = pressure(K4, traces, 1000, HALF);
  const p2 = pressure(K4, traces, 1000, HALF);
  ok(p1 === p2, 'pressure is deterministic given atMs');
}

// ── 2. β₂ is the invariant, not planarity (Paper IV §3.3 correction) ────
{
  ok(K4.beta[2] === 1, 'complete K₄ has β₂ = 1 (enclosed interior)');
  ok(K4.rigid === true, 'K₄ satisfies Maxwell: 6 = 3·4 − 6');
  // A zone missing a vertex is K₃ — planar, connected, but no enclosed void.
  const k3 = makeZone('k3', ['Button', '.btn', '--p31-accent', 'MISSING'], [
    ['Button', '.btn'], ['Button', '--p31-accent'], ['.btn', '--p31-accent'],
  ]);
  ok(k3.beta[2] === 0, 'K₃ (missing vertex) has β₂ = 0');
  ok(k3.beta[0] === 2, 'K₃ with a dangling absent vertex is disconnected (β₀ = 2)');
}

// ── 3. a flat zone registers as flat ────────────────────────────────────
{
  const flat = makeZone('f', ['Button', '.btn', '--p31-accent', 'ocean'], [
    ['Button', '.btn'], ['--p31-accent', 'ocean'], // disconnected pairs
  ]);
  ok(flat.beta[2] === 0, 'flat zone has no protected interior');
  ok(flat.beta[0] === 2, 'flat zone is disconnected (β₀ = 2)');
  ok(flat.rigid === false, 'flat zone is not rigid');
}

// ── 4. severed reference trace raises hazard (floating neutral) ─────────
{
  const noRef = hazard(K4, [tr({ kind: 'propose' })], 1000, HALF);
  ok(noRef === 1, 'no reference trace → hazard 1 (severed neutral)');
  const fresh = hazard(K4, [tr({ kind: 'reference', ts: 1000 })], 1000, HALF);
  ok(fresh === 0, 'fresh reference → hazard 0');
  const stale = hazard(K4, [tr({ kind: 'reference', ts: 1000 - HALF * 2 })], 1000, HALF);
  ok(stale > 0.5, `stale reference → hazard rises (${stale.toFixed(2)})`);
}

// ── 5. out-of-lane trace is rejected, not weighted (SOULSAFE Triad) ─────
{
  const out = tr({ actor: 'rogue', coherence: 'out-of-lane' });
  ok(traceWeight(out, 1000, HALF) === 0, 'out-of-lane trace carries zero weight');
  const onlyRogue = trust('rogue', [out], 1000, HALF);
  ok(onlyRogue === 0.5, 'trust stays neutral (0.5) when every trace is out-of-lane');
}

// ── 6. decoherent success < coherent failure (Proof of Care, structurally) ──
{
  const alice = tr({ actor: 'alice', outcome: 'failure', redBoard: 'coherent' });
  const bob = tr({ actor: 'bob', outcome: 'success', redBoard: 'hypomania' });
  const tAlice = trust('alice', [alice], 1000, HALF);
  const tBob = trust('bob', [bob], 1000, HALF);
  ok(redBoardFactor('hypomania') < redBoardFactor('coherent'), 'hypomania coherence factor is lower');
  ok(tBob < tAlice, `decoherent success (${tBob.toFixed(2)}) < coherent failure (${tAlice.toFixed(2)})`);
}

// ── 7. decay halves at one half-life ────────────────────────────────────
{
  const at0 = decay(tr({ ts: HALF }), HALF, HALF); // Δt = 0
  const atHalf = decay(tr({ ts: 0 }), HALF, HALF); // Δt = HALF = one half-life
  ok(Math.abs(atHalf - 0.5) < 1e-9, `decay is 0.5 at one half-life (${atHalf})`);
  ok(at0 === 1, 'decay is 1 at Δt = 0');
}

// ── 8. zero-utility trace is pruned (Paper XIX §5) ──────────────────────
{
  ok(zeroUtility(tr({ payload: null, preImage: 'x', postImage: 'x' })), 'no change + no payload → zero-utility');
  ok(zeroUtility(tr({ payload: {}, preImage: 'x', postImage: 'x' })), 'empty object payload → zero-utility');
  ok(!zeroUtility(tr({ payload: { a: 1 }, preImage: 'x', postImage: 'y' })), 'real change → not zero-utility');
}

// ── 9. 1/3 is reported, never asserted (Tetrahedron Protocol §2.2) ──────
{
  const balanced = [
    tr({ actor: 'a', ts: 1000 }), tr({ actor: 'b', ts: 1000 }), tr({ actor: 'c', ts: 1000 }),
  ];
  const d = oneThirdDiagnostic(K4, balanced, 1000, HALF);
  ok(d !== null, 'three actors → diagnostic returns a number');
  ok(Math.abs(d - 1 / 3) < 1e-9, 'equal weights → min share ≈ 1/3 (arithmetic, not a field claim)');
  // Crucially: the function does not ASSERT 1/3 for arbitrary input.
  const uneven = [
    tr({ actor: 'a', ts: 1000 }), tr({ actor: 'a', ts: 1000 }),
    tr({ actor: 'b', ts: 1000 }), tr({ actor: 'c', ts: 1000 }),
  ];
  const du = oneThirdDiagnostic(K4, uneven, 1000, HALF);
  ok(du !== null && du !== 1 / 3, 'uneven input reports a ratio, not a target');
  ok(oneThirdDiagnostic(K4, [tr({ actor: 'a' }), tr({ actor: 'b' })], 1000, HALF) === null, 'fewer than three actors → null');
}

// ── 10. physical-layer terms never appear in computational position ─────
{
  const here = dirname(fileURLToPath(import.meta.url));
  const src = readFileSync(join(here, '..', 'src', 'index.ts'), 'utf8');
  // Strip comments, then forbid physical-biological vocabulary in code.
  const noComments = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  for (const term of ['Posner', 'Larmor', 'quantum coherence', 'calcium', 'phosphorus-31', '863']) {
    ok(!noComments.includes(term), `"${term}" appears only in prose, never in code`);
  }
}

if (fails.length) {
  console.error(`\n❌ FIELD FAILED — ${fails.length} failure(s):`);
  for (const f of fails) console.error(`   • ${f}`);
  process.exit(1);
}
console.log('✅ field — β₂ is the invariant (not planarity); hazard fires on severed neutral; care-weighted trust; zero-utility pruned; 1/3 reported, never asserted.');
