#!/usr/bin/env node
/**
 * @p31/canon — test-loom-replay.mjs
 *
 * The gate for Path α before any other work: the event log must round-trip.
 * Folds 100 synthetic events one at a time, replays the whole log, and asserts
 * the two final states are deep-equal. Also asserts `replay(events, N)` equals
 * a sequential fold up to N, that the reducer never mutates its input, that
 * every event carries the writer its kind requires, and that `revise` bumps
 * `revision` without changing status.
 *
 * Run: node scripts/test-loom-replay.mjs  (from packages/canon)
 */
import { reduce, replay, initialState } from '../src/loom/events.ts';

const HUMAN = new Set(['focus', 'revise', 'approve', 'reject']);
const AGENT = new Set(['traverse', 'propose', 'presence']);
const NODES = ['--p31-accent', '--p31-bg', '.glass-card', '.feature-card', '.btn', 'Button', 'ocean'];

function synth(count) {
  const events = [];
  const proposed = [];
  const kinds = ['focus', 'presence', 'traverse', 'propose', 'revise', 'approve', 'reject'];
  for (let i = 0; i < count; i++) {
    const seq = i + 1;
    const ts = new Date(Date.UTC(2026, 8, 19, 12, 0, i)).toISOString();
    const kind = kinds[i % kinds.length];
    const node = NODES[i % NODES.length];
    const writer = HUMAN.has(kind) ? 'human' : 'agent';
    const base = { seq, ts, writer, kind };
    switch (kind) {
      case 'focus':
        events.push({ ...base, node });
        break;
      case 'presence':
        events.push({ ...base, node, attention: Number(((10 - (i % 11)) / 10).toFixed(1)) });
        break;
      case 'traverse':
        events.push({ ...base, from: NODES[(i + 1) % NODES.length], to: node, reason: 'referenced-by' });
        break;
      case 'propose': {
        const id = `p${seq}`;
        proposed.push(id);
        events.push({ ...base, id, node, body: { draft: 1, seq } });
        break;
      }
      case 'revise': {
        const id = proposed.length ? proposed[i % proposed.length] : 'p1';
        events.push({ ...base, proposal: id, body: { draft: 2, seq } });
        break;
      }
      case 'approve': {
        const id = proposed.length ? proposed[i % proposed.length] : 'p1';
        events.push({ ...base, proposal: id });
        break;
      }
      case 'reject': {
        const id = proposed.length ? proposed[i % proposed.length] : 'p1';
        events.push({ ...base, proposal: id, reason: 'not now' });
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
    for (const [k, v] of a) if (!b.has(k) || !deepEqual(v, b.get(k))) return false;
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
const failures = [];

// writer-per-kind is a runtime invariant too, not just a type.
for (const e of events) {
  const expected = HUMAN.has(e.kind) ? 'human' : 'agent';
  if (e.writer !== expected) failures.push(`seq ${e.seq}: kind ${e.kind} must be writer ${expected}, got ${e.writer}`);
}

const folded = events.reduce((s, e) => reduce(s, e), initialState());
const replayed = replay(events);
if (!deepEqual(folded, replayed)) failures.push('reduce(fold) !== replay(whole log)');

for (const at of [0, 1, 17, 50, 99, 100]) {
  const partial = replay(events, at);
  const manual = events.filter((e) => e.seq <= at).reduce((s, e) => reduce(s, e), initialState());
  if (!deepEqual(partial, manual)) failures.push(`replay(events, ${at}) !== sequential fold`);
}

// revise must bump revision, preserve status, and not create a proposal.
const p = events.find((e) => e.kind === 'propose');
const revised = replay(
  [
    p,
    { seq: 2, ts: p.ts, writer: 'human', kind: 'revise', proposal: p.id, body: { draft: 2 } },
    { seq: 3, ts: p.ts, writer: 'human', kind: 'revise', proposal: p.id, body: { draft: 3 } },
  ],
  undefined,
);
const rp = revised.proposals.get(p.id);
if (!rp || rp.revision !== 2 || rp.status !== 'pending') {
  failures.push(`revise did not bump revision/keep pending: ${JSON.stringify(rp)}`);
}

// state must not carry the log.
if ('timeline' in replayed) failures.push('state still carries a timeline field');

// attention must reflect the latest presence event.
const lastPresence = [...events].reverse().find((e) => e.kind === 'presence');
if (replayed.agentAttention !== lastPresence.attention) {
  failures.push(`agentAttention ${replayed.agentAttention} !== last presence ${lastPresence.attention}`);
}

// input must not be mutated.
const before = JSON.stringify(events);
replay(events);
if (JSON.stringify(events) !== before) failures.push('replay mutated the input event log');

if (failures.length) {
  console.error(`\n❌ LOOM REPLAY DETERMINISM FAILED — ${failures.length} failure(s):`);
  for (const f of failures) console.error(`   • ${f}`);
  process.exit(1);
}

console.log('✅ loom replay determinism — 100 events, fold == replay, 6 checkpoints, input pristine.');
console.log(`   proposals: ${replayed.proposals.size}, path: ${replayed.agentPath.length}, attention: ${replayed.agentAttention}`);
