#!/usr/bin/env node
/**
 * @p31/field — test-field-jitterbug.mjs
 *
 * The Jitterbug's own tests. It is the closure twin of the Sierpiński gap,
 * so the properties to assert are about the contraction and its duality:
 *
 *   1. four phases, exactly one closed (β₂ = 1, rigid).
 *   2. the volume fingerprint is Fuller's, and monotone decreasing.
 *   3. the closure count is the component contraction, and idempotent.
 *   4. the duality: the gasket stays β₂ = 0 at every level; the jitterbug
 *      ends at β₂ = 1.
 *
 * Run: node scripts/test-field-jitterbug.mjs  (from packages/field)
 */
import {
  JITTERBUG_PHASES,
  jitterbugPhase,
  jitterbugVolume,
  jitterbugClose,
  jitterbugClosed,
} from '../src/jitterbug.ts';
import { sierpinskiGasket } from '../src/sierpinski.ts';

const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

const approx = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

// ── 1. four phases, exactly one closed ──────────────────────────────────
{
  ok(JITTERBUG_PHASES.length === 4, 'four click-stops');
  const names = JITTERBUG_PHASES.map((p) => p.name);
  ok(
    names.join('>') === 'vector-equilibrium>icosahedron>octahedron>tetrahedron',
    `phases are ordered open → closed (${names.join(' → ')})`,
  );
  const closed = JITTERBUG_PHASES.filter((p) => p.beta2 === 1);
  ok(closed.length === 1 && closed[0].name === 'tetrahedron', 'only the tetrahedron is closed (β₂ = 1)');
  ok(JITTERBUG_PHASES.every((p) => p.rigid === (p.beta2 === 1)), 'rigid ⟺ β₂ = 1 (the K₄ convention)');
}

// ── 2. the volume fingerprint is Fuller's, monotone decreasing ──────────
{
  const [ve, ico, octa, tetra] = JITTERBUG_PHASES;
  ok(approx(ve.volume, 20), `vector equilibrium volume 20 (got ${ve.volume})`);
  const exactIco = (5 / 12) * (3 + Math.sqrt(5)) / (Math.SQRT2 / 12);
  ok(approx(ico.volume, exactIco), `icosahedron volume ${exactIco.toFixed(4)} (got ${ico.volume})`);
  ok(approx(octa.volume, 4), `octahedron volume 4 (got ${octa.volume})`);
  ok(approx(tetra.volume, 1), `tetrahedron volume 1 (got ${tetra.volume})`);

  ok(approx(jitterbugVolume(0), 20), 'volume at t=0 is 20');
  ok(approx(jitterbugVolume(1 / 3), exactIco), 'volume at t=1/3 is the icosahedron');
  ok(approx(jitterbugVolume(2 / 3), 4), 'volume at t=2/3 is 4');
  ok(approx(jitterbugVolume(1), 1), 'volume at t=1 is 1');

  let prev = Infinity;
  let monotone = true;
  for (let t = 0; t <= 1.0001; t += 0.02) {
    const v = jitterbugVolume(t);
    if (v > prev + 1e-12) monotone = false;
    prev = v;
  }
  ok(monotone, 'the volume is monotone non-increasing across the contraction');
}

// ── 3. closure count is the contraction, and idempotent ────────────────
{
  const zone = { id: 'z', vertices: ['a', 'b', 'c', 'd'], edges: [], beta: [1, 3, 1], rigid: true };
  ok(jitterbugClose([]) === 0, 'empty field needs no contraction');
  ok(jitterbugClose([zone]) === 0, 'a single K₄ is already closed');
  ok(jitterbugClose([zone, zone, zone]) === 2, 'three K₄s need two merges to enclose');
  ok(jitterbugClosed([zone]) && !jitterbugClosed([zone, zone]), 'jitterbugClosed reads the field');
  // Idempotent: closing a closed field returns 0 again.
  ok(jitterbugClose([zone]) === 0, 'applying the closure to a closed field is a no-op');
}

// ── 4. the duality: gasket stays open, jitterbug closes ────────────────
{
  for (let level = 0; level <= 8; level++) {
    ok(sierpinskiGasket(level).beta2 === 0, `gasket level ${level} stays β₂ = 0`);
  }
  ok(jitterbugPhase(1).beta2 === 1, 'the jitterbug terminal phase is β₂ = 1');
  ok(sierpinskiGasket(0).beta2 !== jitterbugPhase(1).beta2, 'the gap and the closure are opposites');
}

if (fails.length) {
  console.error(`\n❌ FIELD JITTERBUG FAILED — ${fails.length} failure(s):`);
  for (const f of fails) console.error(`   • ${f}`);
  process.exit(1);
}
console.log('✅ field jitterbug — four click-stops, Fuller volumes, the closure twin of the Sierpiński gap.');
