#!/usr/bin/env node
/**
 * @p31/field — test-field-sierpinski.mjs
 *
 * The Sierpiński gasket: local completeness without global enclosure. This is
 * the Field's failure mode, named and quantified — and the falsification
 * lane's first concrete target.
 *
 * Run: node scripts/test-field-sierpinski.mjs  (from packages/field)
 */
import { sierpinskiGasket, enclosureGap, SIERPINSKI_DIMENSION } from '../src/sierpinski.ts';

const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

// ── 1. exact combinatorics (verified against closed form) ───────────────
{
  const expected = [
    { level: 0, V: 3, E: 3, beta1: 1 },
    { level: 1, V: 6, E: 9, beta1: 4 },
    { level: 2, V: 15, E: 27, beta1: 13 },
    { level: 3, V: 42, E: 81, beta1: 40 },
    { level: 4, V: 123, E: 243, beta1: 121 },
    { level: 5, V: 366, E: 729, beta1: 364 },
  ];
  for (const x of expected) {
    const g = sierpinskiGasket(x.level);
    ok(g.vertices === x.V, `level ${x.level}: V = ${g.vertices} (expected ${x.V})`);
    ok(g.edges === x.E, `level ${x.level}: E = ${g.edges} (expected ${x.E})`);
    ok(g.beta1 === x.beta1, `level ${x.level}: β₁ = ${g.beta1} (expected ${x.beta1})`);
  }
}

// ── 2. β₂ is 0 at every level — no enclosed volume, ever ────────────────
{
  for (let n = 0; n <= 8; n++) {
    const g = sierpinskiGasket(n);
    ok(g.beta2 === 0, `level ${n}: β₂ = 0 (a surface never encloses a volume)`);
    ok(g.beta0 === 1, `level ${n}: β₀ = 1 (connected)`);
  }
}

// ── 3. β₁ grows without bound — more holes, not more enclosure ──────────
{
  const b1 = [0, 1, 2, 3, 4].map((n) => sierpinskiGasket(n).beta1);
  for (let i = 1; i < b1.length; i++) {
    ok(b1[i] > b1[i - 1], `β₁ grows: ${b1[i - 1]} → ${b1[i]}`);
  }
}

// ── 4. the gap: local completeness ≠ global enclosure ───────────────────
{
  const gap = enclosureGap(4);
  ok(gap.localBeta2 === 1, 'every local cell is complete');
  ok(gap.globalBeta2 === 0, 'the global structure does not enclose');
  ok(gap.gap === true, 'the enclosure gap exists');
}

// ── 5. fractal dimension is the standard value ──────────────────────────
{
  ok(Math.abs(SIERPINSKI_DIMENSION - Math.log(3) / Math.log(2)) < 1e-12, 'dimension = log(3)/log(2)');
  ok(SIERPINSKI_DIMENSION > 1 && SIERPINSKI_DIMENSION < 2, 'dimension is fractional (1 < d < 2)');
}

// ── 6. guard: negative level is rejected ────────────────────────────────
{
  let threw = false;
  try { sierpinskiGasket(-1); } catch { threw = true; }
  ok(threw, 'negative level is rejected');
}

if (fails.length) {
  console.error(`\n❌ FIELD SIERPINSKI FAILED — ${fails.length} failure(s):`);
  for (const f of fails) console.error(`   • ${f}`);
  process.exit(1);
}
console.log('✅ field sierpinski — local completeness does not compose to global enclosure; β₂ = 0 at every level.');
