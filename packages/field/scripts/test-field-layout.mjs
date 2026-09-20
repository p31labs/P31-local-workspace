#!/usr/bin/env node
/**
 * @p31/field — test-field-layout.mjs
 *
 * The layout's own tests. The render layer is pure, so the properties to
 * assert are structural:
 *
 *   1. determinism — same reading → byte-identical Scene.
 *   2. id-stable positions — a zone's dot does not move when the field grows.
 *   3. in-bounds — every dot falls inside the [0,1] viewport square.
 *   4. tokens, not colors — no primitive carries var(), color-mix(), or hex;
 *      colors are token NAMES resolved later by getComputedStyle.
 *   5. reading-as-palette — hazard maps green→amber→red; pressure scales fill.
 *   6. elision as a number — hidden zones appear as text, not a button.
 *   7. zone scale — K₄: four dots, six edges.
 *
 * Run: node scripts/test-field-layout.mjs  (from packages/field)
 */
import { layout, layoutZone, layoutConstellation, PALETTE } from '../src/layout.ts';
import { projectInstrument, selectConstellation } from '../src/instrument.ts';
import { makeZone } from '../src/index.ts';

const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

const HALF = 7 * 24 * 3600 * 1000;

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

function zone(i) {
  const v = ['c', 'l', 't', 'h'];
  return makeZone(`z${i}`, v, [
    [v[0], v[1]], [v[0], v[2]], [v[0], v[3]], [v[1], v[2]], [v[1], v[3]], [v[2], v[3]],
  ]);
}

// A reading over n zones, one trace at z0 so weights are non-trivial.
function readingAt(n, atMs = 1000) {
  const zones = Array.from({ length: n }, (_, i) => zone(i));
  const traces = [tr({ zone: 'z0', ts: 0 })];
  return projectInstrument(zones, traces, atMs, null, HALF);
}

// ── 1. determinism ──────────────────────────────────────────────────────
{
  const r = readingAt(5);
  const { visible, hidden } = selectConstellation(r.zones);
  const a = layout(r, [], visible, hidden, 0.25);
  const b = layout(r, [], visible, hidden, 0.25);
  ok(JSON.stringify(a) === JSON.stringify(b), 'a scene at the same reading is byte-identical');
}

// ── 2. id-stable positions: growth must not move a zone ────────────────
{
  const dotPos = (scene, id) => {
    const d = scene.dots.find((x) => x.id === id);
    return d ? { x: d.x, y: d.y } : null;
  };
  const small = readingAt(3);
  const { visible: vs } = selectConstellation(small.zones);
  const smallScene = layout(small, [], vs, 0, 0);

  const big = readingAt(200); // > RENDER_BUDGET
  const { visible: vb } = selectConstellation(big.zones);
  const bigScene = layout(big, [], vb, 200 - vb.length, 0);

  const a = dotPos(smallScene, 'z0');
  const b = dotPos(bigScene, 'z0');
  ok(a && b, 'z0 is visible in both scenes');
  ok(
    a && b && a.x === b.x && a.y === b.y,
    `z0 stays put when the field grows 3 → 200 zones (${a?.x},${a?.y} vs ${b?.x},${b?.y})`,
  );
}

// ── 3. in-bounds ────────────────────────────────────────────────────────
{
  const r = readingAt(200);
  const { visible, hidden } = selectConstellation(r.zones);
  const scene = layout(r, [], visible, hidden, 0);
  let inBounds = true;
  for (const d of scene.dots) {
    if (d.x < 0 || d.x > 1 || d.y < 0 || d.y > 1) inBounds = false;
  }
  ok(inBounds, 'every dot falls inside the [0,1] viewport square');
}

// ── 4. tokens, not colors ───────────────────────────────────────────────
{
  const r = readingAt(5);
  const { visible, hidden } = selectConstellation(r.zones);
  const scene = layout(r, [], visible, hidden, 0);
  const tokens = new Set(Object.values(PALETTE));
  const allTokens = [
    ...scene.dots.flatMap((d) => [d.fillToken, d.strokeToken]),
    ...scene.lines.map((l) => l.strokeToken),
    ...scene.text.map((t) => t.colorToken),
    ...scene.readouts.map((rd) => rd.barToken).filter(Boolean),
  ];
  ok(allTokens.length > 0, 'the scene carries colors');
  const illegal = allTokens.filter((t) => !tokens.has(t) || t.includes('var(') || t.includes('color-mix(') || t.includes('#'));
  ok(illegal.length === 0, `every color is a known token NAME, never var()/color-mix()/hex (illegal: ${JSON.stringify(illegal)})`);
}

// ── 5. reading-as-palette ───────────────────────────────────────────────
{
  // Build two zones with very different hazard by giving z0 a fresh reference
  // and z1 none. Pressure difference via trace count.
  const zones = [zone(0), zone(1)];
  const traces = [
    tr({ zone: 'z0', kind: 'reference', ts: 0 }),
    tr({ zone: 'z0', ts: 0 }),
  ];
  const r = projectInstrument(zones, traces, 0, null, HALF);
  const { visible, hidden } = selectConstellation(r.zones);
  const scene = layout(r, [], visible, hidden, 0);

  const byId = new Map(scene.dots.map((d) => [d.id, d]));
  const z0 = byId.get('z0'); // has a reference → hazard ≈ 0 → green
  const z1 = byId.get('z1'); // no reference → hazard 1 → danger
  ok(z0 && z0.strokeToken === PALETTE.safe, `fresh reference → green (got ${z0?.strokeToken})`);
  ok(z1 && z1.strokeToken === PALETTE.danger, `severed zone → danger (got ${z1?.strokeToken})`);
  ok(z0 && z1 && z0.fillOpacity > z1.fillOpacity, 'more pressure → more fill opacity');
}

// ── 6. elision as a number ──────────────────────────────────────────────
{
  const r = readingAt(200);
  const { visible, hidden } = selectConstellation(r.zones);
  const scene = layout(r, [], visible, hidden, 0);
  ok(hidden > 0, '200 zones exceed the render budget');
  const elided = scene.text.find((t) => t.text.includes('below the render budget'));
  ok(elided !== undefined, 'the elision is rendered as text');
  ok(elided && elided.text.includes(String(hidden)), `the elision names the exact count (${elided?.text})`);
}

// ── 7. zone scale: K₄ = four dots, six edges ───────────────────────────
{
  const r = projectInstrument([zone(0)], [tr({ zone: 'z0', ts: 0 })], 0, 'z0', HALF);
  const scene = layoutZone(r, [tr({ zone: 'z0', ts: 0 })], 0);
  ok(scene.dots.length === 4, `K₄ has four vertices (got ${scene.dots.length})`);
  ok(scene.lines.length === 6, `K₄ has six edges (got ${scene.lines.length})`);
  ok(scene.readouts.some((rd) => rd.label === 'PRESSURE'), 'zone scale reads pressure');
  ok(scene.readouts.some((rd) => rd.label === 'HAZARD'), 'zone scale reads hazard');
  ok(scene.readouts.some((rd) => rd.label === 'BETAS'), 'zone scale reads betas');
}

// ── 8. the complexity panel is a diagnostic, not a verdict ──────────────
{
  const r = readingAt(5);
  const { visible, hidden } = selectConstellation(r.zones);
  const scene = layout(r, [], visible, hidden, 0);
  const labels = scene.readouts.map((rd) => rd.label);
  ok(labels.includes('ENTROPY') && labels.includes('EDGE') && labels.includes('WHITE'),
    'the complexity panel reports entropy, edge density, white space');
  // All three bars share one hue — no good/bad amber threshold on white space.
  const bars = scene.readouts.filter((rd) => rd.bar !== undefined);
  ok(bars.length === 3, 'three bars');
  ok(new Set(bars.map((b) => b.barToken)).size === 1, 'all three bars share one accent hue — a description, not a judgment');
}

// ── 9. zone scale: trace ticks on a single time axis ────────────────────
{
  const now = 1000000;
  const traces = [
    tr({ zone: 'z0', ts: now - 3 * HALF, frame: 'structure' }),
    tr({ zone: 'z0', ts: now - 1 * HALF, frame: 'connection' }),
    tr({ zone: 'z0', ts: now, frame: 'creation' }),
  ];
  const r = projectInstrument([zone(0)], traces, now, 'z0', HALF);
  const scene = layoutZone(r, traces, 0);

  ok(scene.ticks.length === 3, `three traces → three ticks (got ${scene.ticks.length})`);
  const t = scene.ticks.map((k) => k.t);
  ok(t[0] <= t[1] && t[1] <= t[2], 'ticks are ordered by time along the axis (t ascending)');
  const sizes = scene.ticks.map((k) => k.size);
  ok(sizes[2] > sizes[0], 'newest trace → largest tick (decay shrinks older traces)');
  ok(scene.ticks.every((k) => k.frameToken.startsWith('--p31-frame-')), 'every tick carries a frame token NAME, not a color');
  ok(new Set(scene.ticks.map((k) => k.frameToken)).size === 3, 'each frame maps to its own token (structure/connection/creation distinct)');
  ok(scene.text.some((x) => x.text === '▸ 3 traces' && x.y === 0.88), 'the tick band carries a discoverable affordance label at TICK_BAND_Y');

  const scene2 = layoutZone(r, traces, 0);
  ok(JSON.stringify(scene.ticks) === JSON.stringify(scene2.ticks), 'ticks are deterministic (same input → same ticks)');
}

if (fails.length) {
  console.error(`\n❌ FIELD LAYOUT FAILED — ${fails.length} failure(s):`);
  for (const f of fails) console.error(`   • ${f}`);
  process.exit(1);
}
console.log('✅ field layout — deterministic, id-stable, in-bounds, tokens-not-colors, reading-as-palette.');
