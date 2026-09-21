#!/usr/bin/env node
/**
 * @p31/canon — test-loom-scope.mjs
 *
 * The scope layer, enforced at the gate (shape) + the legacy adapter
 * (normalize). Covers:
 *   1. personal requires humanId
 *   2. shared rejects humanId (a family record carries the family, not an
 *      individual)
 *   3. agent events default to shared (co-presence) — traverse/propose/review
 *      are shared by definition
 *   4. session is reserved — allowed by the type, rejected by nothing, written
 *      by nothing
 *   5. legacy rows (no scope, with humanId) replay through normalizeLegacyScope
 *      with the humanId stripped — the stored chain data is untouched
 *
 * Run: node scripts/test-loom-scope.mjs  (from packages/canon)
 */
import { ReplayGate, normalizeLegacyScope } from '../src/loom/gate.ts';

const failures = [];
function assert(cond, msg) {
  if (!cond) failures.push(msg);
}

const gate = () => new ReplayGate();

// 1. personal requires humanId.
{
  const g = gate();
  const r = g.append({ writer: 'human', kind: 'focus', node: 'orb', scope: 'personal' });
  assert(!r.valid, 'personal without humanId must be rejected');
  assert(r.error?.includes('humanId'), 'error must name humanId');
}

// 2. shared rejects humanId.
{
  const g = gate();
  const r = g.append({ writer: 'human', kind: 'focus', node: 'orb', scope: 'shared', humanId: 'alice' });
  assert(!r.valid, 'shared with humanId must be rejected');
  assert(r.error?.includes('shared'), 'error must name shared');
}

// 2b. shared MAY carry statedBy — a code-name handle, never a raw id. The
// family page names its authors this way without exposing identity.
{
  const g = gate();
  const r = g.append({ writer: 'human', kind: 'focus', node: 'orb', scope: 'shared', statedBy: 'Dill·ember' });
  assert(r.valid, 'shared with statedBy (a handle) must be accepted');
}

// Default (no scope) is shared — so a human event with a humanId is rejected
// unless it declares personal.
{
  const g = gate();
  const r = g.append({ writer: 'human', kind: 'focus', node: 'orb', humanId: 'alice' });
  assert(!r.valid, 'unscoped human event with humanId must default to shared and be rejected');
}

// 3. Agent events are shared — no scope needed, humanId absent.
{
  const g = gate();
  assert(g.append({ writer: 'agent', kind: 'traverse', from: 'a', to: 'b', reason: 'r' }).valid, 'agent traverse must be valid');
  assert(g.append({ writer: 'agent', kind: 'propose', id: 'p1', node: 'n', body: {} }).valid, 'agent propose must be valid');
  assert(g.append({ writer: 'agent', kind: 'presence', node: 'n', attention: 0.7 }).valid, 'agent presence must be valid');
}

// 4. Session is reserved — the type allows it, no writer rejects it, and the
//    gate does not special-case it (it is structurally indistinguishable from
//    shared, minus the humanId rule). A session human event without humanId
//    passes through like shared.
{
  const g = gate();
  const r = g.append({ writer: 'human', kind: 'focus', node: 'orb', scope: 'session' });
  assert(r.valid, 'session scope must be allowed (reserved, no writers)');
}

// 5. Legacy normalize: an unscoped shared event with a humanId strips the id
//    on replay; a personal event keeps it.
{
  const legacy = { writer: 'human', kind: 'focus', node: 'orb', humanId: 'alice' };
  const n = normalizeLegacyScope(legacy);
  assert(!('humanId' in n), 'legacy unscoped humanId must be stripped');
  assert(n.scope === undefined, 'legacy event keeps no scope');

  const personal = { writer: 'human', kind: 'focus', node: 'orb', scope: 'personal', humanId: 'alice' };
  const np = normalizeLegacyScope(personal);
  assert(np.humanId === 'alice', 'personal humanId must be kept');
}

// 6. Replay of a legacy JSONL line through the gate succeeds after normalize.
{
  const g = gate();
  const line = JSON.stringify({ seq: 0, ts: '2026-09-21T00:00:00Z', writer: 'human', kind: 'focus', node: 'orb', humanId: 'alice' });
  const r = g.fromJSONL(line);
  assert(r.valid, 'legacy JSONL line must replay after normalize');
  const log = g.getLog();
  assert(!('humanId' in log[0]), 'replayed legacy event must not carry humanId');
}

if (failures.length) {
  console.error(`\n❌ LOOM SCOPE FAILED — ${failures.length} failure(s):`);
  for (const f of failures) console.error(`   • ${f}`);
  process.exit(1);
}

console.log('✅ loom scope — personal↔shared shape enforced; agent=shared (co-presence); session reserved; legacy normalize.');
console.log('   legacy humanId stripped on replay; personal humanId preserved.');