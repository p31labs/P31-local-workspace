#!/usr/bin/env node
/**
 * @p31/canon — test-loom-delegation.mjs
 *
 * The delegation chain: `parentAgent` on propose and review records who
 * spawned the acting agent. It is pure audit data — the reducer and gate do
 * nothing with it. The gate does NOT enforce one-level depth: the log records
 * what happened; the doctrine advises what should have.
 *
 * Run: node scripts/test-loom-delegation.mjs  (from packages/canon)
 */
import { ReplayGate } from '../src/loom/gate.ts';
import { replay } from '../src/loom/events.ts';

const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

// ── 1. top-level agent: no parentAgent, accepted ───────────────────────
{
  const g = new ReplayGate();
  const r = g.append({ writer: 'agent', kind: 'propose', id: 'p1', node: '.x', body: {}, author: 'orchestrator-1' });
  ok(r.valid, `top-level propose valid: ${r.error ?? ''}`);
  ok(g.getLog()[0].parentAgent === undefined, 'top-level propose has no parentAgent');
}

// ── 2. sub-agent: parentAgent present, accepted, in the fold ───────────
{
  const g = new ReplayGate();
  const r = g.append({ writer: 'agent', kind: 'propose', id: 'p1', node: '.x', body: {}, author: 'worker-a', parentAgent: 'orchestrator-1' });
  ok(r.valid, `sub-agent propose valid: ${r.error ?? ''}`);
  ok(g.getLog()[0].parentAgent === 'orchestrator-1', 'parentAgent recorded on the event');
  const s = replay(g.getLog());
  ok(s.proposals.get('p1').author === 'worker-a', 'author is the acting agent');
}

// ── 3. review with parentAgent accepted ────────────────────────────────
{
  const g = new ReplayGate();
  g.append({ writer: 'agent', kind: 'propose', id: 'p1', node: '.x', body: {} });
  const r = g.append({ writer: 'agent', kind: 'review', agent: 'worker-b', proposalId: 'p1', decision: 'approve', revision: 0, parentAgent: 'orchestrator-1' });
  ok(r.valid, `sub-agent review valid: ${r.error ?? ''}`);
  ok(g.getLog()[1].parentAgent === 'orchestrator-1', 'parentAgent recorded on the review');
}

// ── 4. two-level chain (orchestrator -> sub-agent) records ─────────────
{
  const g = new ReplayGate();
  g.append({ writer: 'agent', kind: 'propose', id: 'top', node: '.x', body: {}, author: 'orchestrator-1' });
  g.append({ writer: 'agent', kind: 'propose', id: 'sub', node: '.y', body: {}, author: 'worker-a', parentAgent: 'orchestrator-1' });
  const log = g.getLog();
  ok(log.length === 2, 'two proposals in the log');
  ok(log[0].parentAgent === undefined && log[1].parentAgent === 'orchestrator-1', 'one-level chain recorded');
}

// ── 5. three-level chain records (doctrine is advice, not enforcement) ─
{
  const g = new ReplayGate();
  g.append({ writer: 'agent', kind: 'propose', id: 'a', node: '.x', body: {}, author: 'orchestrator-1' });
  g.append({ writer: 'agent', kind: 'propose', id: 'b', node: '.y', body: {}, author: 'worker-a', parentAgent: 'orchestrator-1' });
  const r = g.append({ writer: 'agent', kind: 'propose', id: 'c', node: '.z', body: {}, author: 'worker-b', parentAgent: 'worker-a' });
  ok(r.valid, `three-level propose still valid: ${r.error ?? ''}`);
  ok(g.getLog()[2].parentAgent === 'worker-a', 'deep delegation records the truth');
}

// ── 6. fromJSONL round-trip preserves parentAgent ──────────────────────
{
  const g1 = new ReplayGate();
  g1.append({ writer: 'agent', kind: 'propose', id: 'p1', node: '.x', body: {}, author: 'worker-a', parentAgent: 'orchestrator-1' });
  g1.append({ writer: 'agent', kind: 'review', agent: 'worker-b', proposalId: 'p1', decision: 'approve', revision: 0, parentAgent: 'orchestrator-1' });

  const g2 = new ReplayGate();
  const load = g2.fromJSONL(g1.toJSONL());
  ok(load.valid, `round-trip valid: ${load.error ?? ''}`);
  ok(g2.getLog()[0].parentAgent === 'orchestrator-1', 'propose parentAgent preserved');
  ok(g2.getLog()[1].parentAgent === 'orchestrator-1', 'review parentAgent preserved');
}

if (fails.length) {
  console.error(`\n❌ LOOM DELEGATION FAILED — ${fails.length} failure(s):`);
  for (const f of fails) console.error(`   • ${f}`);
  process.exit(1);
}
console.log('✅ loom delegation — parentAgent records the chain; depth is advice, not gate.');
