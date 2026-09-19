#!/usr/bin/env node
/**
 * @p31/canon — test-loom-gate.mjs
 *
 * Gate integrity: writer-per-kind, duplicate/orphan rejection, JSONL
 * round-trip, stateAt ↔ replay agreement, and double-replay determinism.
 *
 * Run: node scripts/test-loom-gate.mjs  (from packages/canon)
 */
import { ReplayGate, canonicalize } from '../src/loom/gate.ts';
import { initialState, reduce, replay } from '../src/loom/events.ts';

const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); };

function seedProposal(g, id = 'prop_1') {
  const r = g.append({ writer: 'agent', kind: 'propose', id, node: '.feature-card', body: { draft: 1 } });
  ok(r.valid, `seed propose should be valid: ${r.error ?? ''}`);
  return id;
}

// ── writer-per-kind ────────────────────────────────────────────────────
{
  const g = new ReplayGate();
  ok(!g.append({ writer: 'agent', kind: 'focus', node: 'x' }).valid, 'agent focus must be rejected');
  ok(!g.append({ writer: 'human', kind: 'traverse', from: 'a', to: 'b', reason: 'r' }).valid, 'human traverse must be rejected');
  ok(!g.append({ writer: 'human', kind: 'presence', node: 'x', attention: 1 }).valid, 'human presence must be rejected');
  ok(!g.append({ writer: 'agent', kind: 'approve', proposal: 'p' }).valid, 'agent approve must be rejected');
}

// ── duplicate + orphan ─────────────────────────────────────────────────
{
  const g = new ReplayGate();
  seedProposal(g, 'prop_dup');
  ok(!g.append({ writer: 'agent', kind: 'propose', id: 'prop_dup', node: 'x', body: {} }).valid, 'duplicate proposal id must be rejected');
  ok(!g.append({ writer: 'human', kind: 'approve', proposal: 'nope' }).valid, 'approve of unknown proposal must be rejected');
  ok(!g.append({ writer: 'human', kind: 'revise', proposal: 'nope', body: {} }).valid, 'revise of unknown proposal must be rejected');
  ok(!g.append({ writer: 'human', kind: 'reject', proposal: 'nope', reason: 'x' }).valid, 'reject of unknown proposal must be rejected');
}

// ── valid sequence + seq assignment ────────────────────────────────────
{
  const g = new ReplayGate();
  ok(g.append({ writer: 'human', kind: 'focus', node: '--p31-accent' }).valid, 'human focus valid');
  ok(g.append({ writer: 'agent', kind: 'presence', node: '--p31-accent', attention: 0.9 }).valid, 'agent presence valid');
  const pid = seedProposal(g);
  ok(g.append({ writer: 'agent', kind: 'traverse', from: '--p31-accent', to: '.feature-card', reason: 'references' }).valid, 'agent traverse valid');
  ok(g.append({ writer: 'human', kind: 'approve', proposal: pid }).valid, 'human approve valid');
  ok(g.getLogLength() === 5, `expected 5 events, got ${g.getLogLength()}`);
  ok(g.getLog()[0].seq === 0 && g.getLog()[4].seq === 4, 'seq must be assigned 0..4 by the gate');
}

// ── JSONL round-trip preserves fields ──────────────────────────────────
{
  const g1 = new ReplayGate();
  seedProposal(g1, 'prop_rt');
  g1.append({ writer: 'human', kind: 'reject', proposal: 'prop_rt', reason: 'incomplete' });

  const g2 = new ReplayGate();
  const r = g2.fromJSONL(g1.toJSONL());
  ok(r.valid, `fromJSONL valid: ${r.error ?? ''}`);
  ok(g2.getLogLength() === 2, `round-trip length 2, got ${g2.getLogLength()}`);
  ok(JSON.stringify(g2.getLog()[1]) === JSON.stringify(g1.getLog()[1]), 'round-trip must preserve every field');
}

// ── stateAt ↔ replay agreement ─────────────────────────────────────────
{
  const g = new ReplayGate();
  g.append({ writer: 'human', kind: 'focus', node: '--p31-bg' });
  const pid = seedProposal(g, 'prop_x');
  g.append({ writer: 'human', kind: 'revise', proposal: pid, body: { draft: 2 } });
  const log = g.getLog();
  for (const at of [0, 1, 2, 3]) {
    const a = canonicalize(g.stateAt(at));
    const b = canonicalize(replay(log, at));
    ok(a === b, `stateAt(${at}) must equal replay(events, ${at})`);
  }
}

// ── double-replay determinism + nondeterministic reducer caught ─────────
{
  const g = new ReplayGate();
  g.append({ writer: 'human', kind: 'focus', node: '--p31-bg' });
  seedProposal(g, 'prop_d');

  ok(g.verify(reduce, initialState()).valid, 'verify() must pass on a pure reducer');

  // Genuinely nondeterministic: the value depends on how many times the
  // reducer has been called, so the second fold diverges from the first.
  let calls = 0;
  const bad = (s, e) => ({ ...reduce(s, e), agentAttention: calls++ });
  const caught = g.verify(bad, initialState());
  ok(!caught.valid, 'verify() must catch a nondeterministic reducer');
  ok(/nondeterministic/i.test(caught.error ?? ''), 'the failure must name nondeterminism');
}

if (fails.length) {
  console.error(`\n❌ LOOM GATE FAILED — ${fails.length} failure(s):`);
  for (const f of fails) console.error(`   • ${f}`);
  process.exit(1);
}
console.log('✅ loom gate — writer-per-kind, duplicate/orphan, round-trip, stateAt, double-replay. All green.');
