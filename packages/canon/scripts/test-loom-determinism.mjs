#!/usr/bin/env node
/**
 * @p31/canon — test-loom-determinism.mjs
 *
 * Seeded stress: build a long, varied log through the gate, then prove two
 * independent folds produce byte-identical canonical state, and that
 * stateAt(N) is stable across repeated calls (no shared mutable arrays).
 *
 * Run: node scripts/test-loom-determinism.mjs  (from packages/canon)
 */
import { ReplayGate, canonicalize } from '../src/loom/gate.ts';
import { initialState, reduce, replay } from '../src/loom/events.ts';

function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(0xc0ffee);
const nodes = ['--p31-accent', '--p31-bg', '.glass-card', '.feature-card', '.btn', 'Button', 'ocean'];
const picks = (n) => nodes[Math.floor(rand() * n)];

const g = new ReplayGate();
const ids = [];
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

for (let i = 0; i < 60; i++) {
  g.append({ writer: 'human', kind: 'focus', node: picks(nodes.length) });
  g.append({ writer: 'agent', kind: 'presence', node: picks(nodes.length), attention: Number(rand().toFixed(2)) });

  const id = `prop_${i}`;
  ids.push(id);
  g.append({ writer: 'agent', kind: 'propose', id, node: picks(nodes.length), body: { i } });
  g.append({ writer: 'agent', kind: 'traverse', from: picks(nodes.length), to: picks(nodes.length), reason: 'references' });

  const roll = rand();
  if (roll < 0.5) g.append({ writer: 'human', kind: 'approve', proposal: id });
  else if (roll < 0.8) g.append({ writer: 'human', kind: 'reject', proposal: id, reason: 'seeded reject' });
  else g.append({ writer: 'human', kind: 'revise', proposal: id, body: { i, revised: true } });
}

const n = g.getLogLength();
ok(n >= 300, `expected a long log, got ${n}`);

// Double fold — the determinism proof.
const a = canonicalize(replay(g.getLog()));
const b = canonicalize(replay(g.getLog()));
ok(a === b, 'two replays of the same log must be byte-identical');

// verify() — the gate's own double-replay + compare.
const v = g.verify(reduce, initialState());
ok(v.valid, `verify() must pass: ${v.error ?? ''}`);

// stateAt stability + no shared mutable arrays.
for (let at = 0; at < n; at += 17) {
  const s1 = g.stateAt(at);
  const s2 = g.stateAt(at);
  ok(canonicalize(s1) === canonicalize(s2), `stateAt(${at}) must be stable across calls`);
  ok(canonicalize(s1) === canonicalize(replay(g.getLog(), at)), `stateAt(${at}) must equal replay at ${at}`);
}

if (fails.length) {
  console.error(`\n❌ LOOM DETERMINISM FAILED — ${fails.length} failure(s):`);
  for (const f of fails) console.error(`   • ${f}`);
  process.exit(1);
}
console.log(`✅ loom determinism — ${n} seeded events, double fold identical, verify() green, ${Math.ceil(n / 17)} stateAt checkpoints stable.`);
