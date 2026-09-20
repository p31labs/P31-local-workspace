#!/usr/bin/env node
/**
 * @p31/field — test-field-adapters.mjs
 *
 * The bridge's own tests. The adapters are the seam between the real system
 * and the Instrument, so the properties to assert are about the seam:
 *
 *   1. registry → zones: the real registry.json yields one zone per artifact
 *      (287 today), every one a rigid K₄.
 *   2. warp → traces: total (one trace per event), deterministic, ts parsed,
 *      actor/kind/frame assigned correctly across all nine event kinds.
 *   3. the bridge holds: zones + traces feed projectInstrument → a Reading.
 *
 * Run: node scripts/test-field-adapters.mjs  (from packages/field)
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { zonesFromRegistry, tracesFromWarp, tracesFromWeft } from '../src/adapters.ts';
import { projectInstrument } from '../src/instrument.ts';

const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

const here = dirname(fileURLToPath(import.meta.url));
const registry = JSON.parse(
  readFileSync(resolve(here, '../../../packages/canon/registry.json'), 'utf8'),
);

const HALF = 7 * 24 * 3600 * 1000;

// One event of every kind. ts strings are parseable ISO-ish.
function event(kind, over = {}) {
  return { seq: 1, ts: '2026-09-19T12:00:00.000Z', writer: 'agent', kind, ...over };
}

// ── 1. registry → zones: 287 artifacts, all rigid K₄ ────────────────────
{
  const zones = zonesFromRegistry(registry);
  const expected = (registry.tokens.length + registry.components.length +
    registry.cssClasses.length + registry.themes.length);
  ok(zones.length === expected, `one zone per artifact (${zones.length} of ${expected})`);
  ok(zones.every((z) => z.rigid), 'every zone is rigid');
  ok(zones.every((z) => z.beta[2] === 1), 'every zone is a complete K₄ (β₂ = 1)');
  ok(zones.every((z) => z.vertices.length === 4 && z.edges.length === 6),
    'every zone has 4 vertices and 6 edges');
  // Determinism: same registry → identical zones.
  ok(JSON.stringify(zones) === JSON.stringify(zonesFromRegistry(registry)),
    'zonesFromRegistry is deterministic');
}

// ── 2. warp → traces: total, deterministic, correct assignment ─────────
{
  const events = [
    event('focus',    { writer: 'human', node: 'button', humanId: 'will' }),
    event('traverse', { from: 'button', to: 'badge' }),
    event('propose',  { node: 'button', id: 'p1', body: { x: 1 }, author: 'cov' }),
    event('revise',   { writer: 'human', proposal: 'p1', body: { x: 2 }, humanId: 'will' }),
    event('approve',  { writer: 'human', proposal: 'p1', humanId: 'will' }),
    event('reject',   { writer: 'human', proposal: 'p1', reason: 'nope', humanId: 'will' }),
    event('review',   { agent: 'cov', proposalId: 'p1', decision: 'approve' }),
    event('presence', { node: 'button', attention: 0.5 }),
    event('view.save',{ writer: 'human', label: 'cold', from: 1, to: 4, humanId: 'will' }),
  ];
  const traces = tracesFromWarp(events);

  ok(traces.length === events.length, 'one trace per event (total mapping)');
  ok(JSON.stringify(traces) === JSON.stringify(tracesFromWarp(events)),
    'tracesFromWarp is deterministic');

  const byKind = Object.fromEntries(traces.map((t) => [t.kind, t]));
  ok(typeof byKind.focus.ts === 'number' && !Number.isNaN(byKind.focus.ts),
    'ts is parsed to epoch ms');
  ok(byKind.focus.actor === 'will', 'human events carry humanId as actor');
  ok(byKind.propose.actor === 'cov', 'agent events carry author as actor');
  ok(byKind.traverse.zone === 'badge', 'traverse lands on its destination node');
  ok(byKind.propose.zone === 'button', 'propose lands on its node');
  ok(byKind.review.zone === 'p1', 'review lands on its proposal');
  ok(byKind['view.save'].zone === 'save:cold', 'view.save lands on a named read');
  ok(byKind.propose.frame === 'structure', 'propose is structure');
  ok(byKind.review.frame === 'structure', 'review is structure (a judgement of shape, not movement)');
  ok(byKind.focus.frame === 'connection', 'focus is connection');
  ok(byKind.traverse.frame === 'rhythm', 'traverse is rhythm');
  ok(byKind.approve.frame === 'creation', 'approve is creation');
  ok(byKind.traverse.preImage === 'button' && byKind.traverse.postImage === 'badge',
    'traverse preserves its before/after');
}

// ── 3. the bridge holds: zones + traces → a Reading ─────────────────────
{
  const zones = zonesFromRegistry(registry);
  const traces = tracesFromWarp([
    event('focus',    { writer: 'human', node: 'button', humanId: 'will', ts: '2026-09-18T00:00:00.000Z' }),
    event('propose',  { node: 'button', id: 'p1', body: { x: 1 }, author: 'cov', ts: '2026-09-18T00:00:00.000Z' }),
  ]);
  const reading = projectInstrument(zones, traces, Date.parse('2026-09-19T12:00:00.000Z'), null, HALF);
  ok(reading.scale === 'constellation', 'bridge projects at constellation scale');
  ok(reading.zones.length === zones.length, `reading carries all ${zones.length} zones`);
  ok(reading.complexity.edgeDensity === 1, 'all-K₄ field → edge density 1');
  ok(reading.complexity.whiteSpace > 0.9, 'two hot artifacts of 287 → mostly idle (white space high)');
}

// ── 4. weft → traces: the reading-is-writing loop ────────────────────────
{
  const weft = [
    { kind: 'view.read', ts: '2026-09-19T12:00:00.000Z', scale: 'zone', focus: 'button', entropy: 0.4, whiteSpace: 0.7, humanId: 'will' },
    { kind: 'view.read', ts: '2026-09-19T12:00:01.000Z', scale: 'constellation', focus: null, entropy: 0.4, whiteSpace: 0.7 },
    { kind: 'view.pin', ts: '2026-09-19T12:00:02.000Z', node: 'button', pinned: true },
    { kind: 'field.decision', ts: '2026-09-19T12:00:03.000Z', zone: 'button', proposalId: 'p1', pressure: 1, hazard: 0, trust: 0.5 },
  ];
  const traces = tracesFromWeft(weft);

  ok(traces.length === 1, 'only a focused read deposits a trace (constellation/pin/decision do not)');
  ok(traces[0].zone === 'button', 'the read lands on the zone the viewer read');
  ok(traces[0].frame === 'connection', 'a read is attention → connection');
  ok(traces[0].kind === 'view.read' && traces[0].actor === 'will', 'the trace carries kind and humanId');
  ok(JSON.stringify(traces) === JSON.stringify(tracesFromWeft(weft)), 'tracesFromWeft is deterministic');
}

if (fails.length) {
  console.error(`\n❌ FIELD ADAPTERS FAILED — ${fails.length} failure(s):`);
  for (const f of fails) console.error(`   • ${f}`);
  process.exit(1);
}
console.log('✅ field adapters — registry→zones (287 K₄), warp→traces (total), bridge holds.');
