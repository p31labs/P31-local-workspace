#!/usr/bin/env node
/**
 * @p31/canon — test-loom-replay.mjs
 *
 * The gate for Path α before any other work: the event log must round-trip.
 * Folds 100 synthetic events one at a time, replays the whole log, and asserts
 * the two final states are deep-equal. Also asserts `replay(events, N)` equals
 * a sequential fold up to N. Same log ⇒ same state.
 *
 * Run: node scripts/test-loom-replay.mjs  (from packages/canon)
 */
import { reduce, replay, initialState } from '../src/loom/events.ts';

const KINDS = ['focus', 'traverse', 'propose', 'approve', 'reject', 'presence'];
const NODES = ['--p31-accent', '--p31-bg', '.glass-card', '.feature-card', '.btn', 'Button', 'ocean'];

function synth(count) {
  const events = [];
  const proposed = [];
  for (let i = 0; i < count; i++) {
    const seq = i + 1;
    const ts = new Date(Date.UTC(2026, 8, 19, 12, 0, i)).toISOString();
    const kind = KINDS[i % KINDS.length];
    const node = NODES[i % NODES.length];
    switch (kind) {
      case 'focus':
        events.push({ seq, ts, writer: i % 2 ? 'agent' : 'human', kind, node });
        break;
      case 'presence':
        events.push({ seq, ts, writer: 'agent', kind, node, attention: (i % 5) / 5 });
        break;
      case 'traverse': {
        const from = NODES[(i + 1) % NODES.length];
        events.push({ seq, ts, writer: 'agent', kind, from, to: node, reason: 'referenced-by' });
        break;
      }
      case 'propose': {
        const id = `p${seq}`;
        proposed.push(id);
        events.push({ seq, ts, writer: 'agent', kind, id, node, body: { draft: true, seq } });
        break;
      }
      case 'approve': {
        const id = proposed.length ? proposed[i % proposed.length] : 'p1';
        events.push({ seq, ts, writer: 'human', kind, proposal: id });
        break;
      }
      case 'reject': {
        const id = proposed.length ? proposed[i % proposed.length] : 'p1';
        events.push({ seq, ts, writer: 'human', kind, proposal: id, reason: 'not now' });
        break;
      }
    }
  }
  return events;
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (a instanceof Map || b instanceof Map) {
    if (!(a instanceof Map) || !(b instanceof Map) || a.size !== b.size) return false;
    for (const [k, v] of a) {
      if (!b.has(k) || !deepEqual(v, b.get(k))) return false;
    }
    return true;
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (a && b && typeof a === 'object') {
    const ka = Object.keys(a).sort();
    const kb = Object.keys(b).sort();
    if (ka.length !== kb.length || ka.some((k, i) => k !== kb[i])) return false;
    return ka.every((k) => deepEqual(a[k], b[k]));
  }
  return false;
}

const events = synth(100);
const folded = events.reduce((s, e) => reduce(s, e), initialState());
const replayed = replay(events);

const failures = [];
if (!deepEqual(folded, replayed)) failures.push('reduce(fold) !== replay(whole log)');

for (const at of [0, 1, 17, 50, 99, 100]) {
  const partial = replay(events, at);
  const manual = events.filter((e) => e.seq <= at).reduce((s, e) => reduce(s, e), initialState());
  if (!deepEqual(partial, manual)) failures.push(`replay(events, ${at}) !== sequential fold`);
}

// Input must not be mutated by the reducer.
const before = JSON.stringify(events);
replay(events);
if (JSON.stringify(events) !== before) failures.push('replay mutated the input event log');

if (failures.length) {
  console.error(`\n❌ LOOM REPLAY DETERMINISM FAILED — ${failures.length} failure(s):`);
  for (const f of failures) console.error(`   • ${f}`);
  process.exit(1);
}

console.log('✅ loom replay determinism — 100 events, fold == replay, 6 partial checkpoints, input pristine.');
console.log(`   proposals: ${replayed.proposals.size}, path length: ${replayed.agentPath.length}, timeline: ${replayed.timeline.length}`);
