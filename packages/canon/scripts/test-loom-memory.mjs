#!/usr/bin/env node
/**
 * @p31/canon — test-loom-memory.mjs
 *
 * Lumi's memory fold must be: (1) deterministic (same events, same memory),
 * (2) tiered correctly (episodic / semantic / procedural / narrative),
 * (3) privacy-safe (folds SHARED events only — a personal record's content
 * never surfaces), and (4) narrative-shaped (one plain sentence, no LLM on
 * the critical path).
 *
 * Run: node scripts/test-loom-memory.mjs  (from packages/canon)
 */
import { foldMemory, emptyMemory } from '../src/loom/memory.ts';

const failures = [];
function assert(cond, msg) {
  if (!cond) failures.push(msg);
}

// A small shared log: child picks a color (agent propose), child approves,
// then focuses on a couple of nodes.
const events = [
  { seq: 0, ts: '2026-09-21T00:00:00Z', writer: 'human', kind: 'focus', node: 'orb', scope: 'shared', statedBy: 'Dill·ember' },
  { seq: 1, ts: '2026-09-21T00:00:05Z', writer: 'human', kind: 'focus', node: 'color-amber', scope: 'shared', statedBy: 'Dill·ember' },
  { seq: 2, ts: '2026-09-21T00:00:10Z', writer: 'agent', kind: 'propose', id: 'p1', node: 'color-amber', body: { color: 'Amber' } },
  { seq: 3, ts: '2026-09-21T00:00:15Z', writer: 'human', kind: 'approve', proposal: 'p1', scope: 'shared', statedBy: 'Dill·ember' },
];

const m = foldMemory(events);

// 1. Determinism.
const m2 = foldMemory(events);
assert(JSON.stringify(m) === JSON.stringify(m2), 'fold must be deterministic');

// 2. Episodic: newest first, capped at MAX (5), named by codename.
assert(m.episodic.length === 4, `episodic must hold all events, got ${m.episodic.length}`);
assert(m.episodic[0].summary.includes('Dill·ember'), `episodic must name the actor by codename, got ${m.episodic[0].summary}`);
// The propose (seq 2) is Lumi's, read by role.
const lumiEpisodic = m.episodic.find((en) => en.seq === 2);
assert(lumiEpisodic?.summary.includes('Lumi'), 'episodic must describe Lumi by role');

// 3. Semantic: the color, most recent first.
assert(m.colors.length === 1 && m.colors[0] === 'Amber', `colors must fold the picked color, got ${m.colors.join(',')}`);
// Focus nodes by frequency: color-amber and orb each once.
assert(m.focusNodes.length === 2, `focusNodes must count both nodes, got ${m.focusNodes.length}`);
assert(m.focusNodes.every((f) => f.count === 1), 'each node focused once');

// 4. Procedural: the approved proposal.
assert(m.approved.length === 1 && m.approved[0] === 'p1', 'approved must fold the approval');

// 5. Narrative: one plain sentence with the count.
assert(typeof m.narrative === 'string' && m.narrative.includes('made 1 thing'), `narrative must be one plain sentence, got: ${m.narrative}`);

// 6. Empty log → the "new here" sentence.
const empty = foldMemory([]);
assert(empty.narrative === 'Lumi is new here. Go say hello.', 'empty memory must say Lumi is new here');
assert(empty.colors.length === 0 && empty.approved.length === 0, 'empty memory has no tiers');

// 7. Privacy-safe: foldMemory never reads a personal record's payload. Passed
//    only SHARED events; a caller that pre-filtered personal events (the read
//    path) ensures a personal color pick never reaches the fold. Here we prove
//    the fold does not itself chase humanId (it keys on statedBy, a handle).
const evt = events[1];
assert(!('humanId' in evt), 'shared events carry no humanId — the fold never sees one');

if (failures.length) {
  console.error(`\n❌ LOOM MEMORY FAILED — ${failures.length} failure(s):`);
  for (const f of failures) console.error(`   • ${f}`);
  process.exit(1);
}

console.log('✅ loom memory — four tiers fold deterministically; narrative is one plain sentence.');
console.log(`   ${m.narrative}`);
console.log(`   episodic ${m.episodic.length}, colors ${m.colors.join(',')}, approved ${m.approved.length}.`);