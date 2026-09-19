#!/usr/bin/env node
/**
 * @p31/canon — test-loom-review.mjs
 *
 * The review event kind: agent-authored, advisory only. It records an opinion
 * on a proposal at a specific revision and does NOT change proposal status —
 * the human approve/reject events remain authoritative.
 *
 * Ten cases: schema recording, stale-revision rejection, non-empty reason,
 * migration of pre-author propose events, self-review (recorded, not forbidden),
 * and gate rehydration rebuilding the revision tracker.
 *
 * Run: node scripts/test-loom-review.mjs  (from packages/canon)
 */
import { ReplayGate } from '../src/loom/gate.ts';
import { replay } from '../src/loom/events.ts';

const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); };

function seedProposal(g, id = 'prop_1', author = 'agentA') {
  const r = g.append({ writer: 'agent', kind: 'propose', id, node: '.feature-card', body: { draft: 1 }, author });
  ok(r.valid, `seed propose should be valid: ${r.error ?? ''}`);
  return id;
}

// ── 1. approve recorded; status stays pending ──────────────────────────
{
  const g = new ReplayGate();
  const id = seedProposal(g);
  const r = g.append({ writer: 'agent', kind: 'review', agent: 'agentB', proposalId: id, decision: 'approve', revision: 0 });
  ok(r.valid, `review approve valid: ${r.error ?? ''}`);
  const p = replay(g.getLog()).proposals.get(id);
  ok(p.reviews.length === 1, 'one review recorded');
  ok(p.reviews[0].decision === 'approve', 'review decision is approve');
  ok(p.reviews[0].agent === 'agentB', 'review agent is agentB');
  ok(p.reviews[0].revision === 0, 'review revision is 0');
  ok(p.status === 'pending', 'status remains pending after agent review');
  ok(replay(g.getLog()).agentCursor === null, 'review does not move agentCursor');
}

// ── 2. amend without reason rejected ───────────────────────────────────
{
  const g = new ReplayGate();
  const id = seedProposal(g);
  const r = g.append({ writer: 'agent', kind: 'review', agent: 'agentB', proposalId: id, decision: 'amend', revision: 0 });
  ok(!r.valid, 'amend without reason rejected');
  ok(/non-empty reason/.test(r.error ?? ''), 'error names the reason rule');
}

// ── 3. reject without reason rejected ──────────────────────────────────
{
  const g = new ReplayGate();
  const id = seedProposal(g);
  const r = g.append({ writer: 'agent', kind: 'review', agent: 'agentB', proposalId: id, decision: 'reject', revision: 0 });
  ok(!r.valid, 'reject without reason rejected');
}

// ── 4. whitespace-only reason rejected ─────────────────────────────────
{
  const g = new ReplayGate();
  const id = seedProposal(g);
  const r = g.append({ writer: 'agent', kind: 'review', agent: 'agentB', proposalId: id, decision: 'amend', reason: '   ', revision: 0 });
  ok(!r.valid, 'whitespace-only reason rejected');
}

// ── 5. review on unknown proposal rejected ─────────────────────────────
{
  const g = new ReplayGate();
  const r = g.append({ writer: 'agent', kind: 'review', agent: 'agentB', proposalId: 'prop_nope', decision: 'approve', revision: 0 });
  ok(!r.valid, 'review on unknown proposal rejected');
  ok(/unknown proposal/.test(r.error ?? ''), 'error names the unknown-proposal rule');
}

// ── 6. review on stale revision rejected ───────────────────────────────
{
  const g = new ReplayGate();
  const id = seedProposal(g);
  g.append({ writer: 'human', kind: 'revise', proposal: id, body: { draft: 2 } });
  // Current revision is now 1. A review targeting revision 0 is stale.
  const stale = g.append({ writer: 'agent', kind: 'review', agent: 'agentB', proposalId: id, decision: 'approve', revision: 0 });
  ok(!stale.valid, 'stale revision review rejected');
  ok(/does not match current revision/.test(stale.error ?? ''), 'error names the revision mismatch');
  const fresh = g.append({ writer: 'agent', kind: 'review', agent: 'agentB', proposalId: id, decision: 'approve', revision: 1 });
  ok(fresh.valid, `current-revision review valid: ${fresh.error ?? ''}`);
}

// ── 7. two reviews accumulate (additive) ───────────────────────────────
{
  const g = new ReplayGate();
  const id = seedProposal(g);
  g.append({ writer: 'agent', kind: 'review', agent: 'agentB', proposalId: id, decision: 'approve', revision: 0 });
  g.append({ writer: 'agent', kind: 'review', agent: 'agentC', proposalId: id, decision: 'amend', reason: 'needs mass', revision: 0 });
  const p = replay(g.getLog()).proposals.get(id);
  ok(p.reviews.length === 2, 'two reviews accumulate');
  ok(p.reviews[0].agent === 'agentB' && p.reviews[1].agent === 'agentC', 'reviews in seq order');
  ok(p.status === 'pending', 'status still pending after two agent reviews');
}

// ── 8. self-review lands (policy deferred) ─────────────────────────────
// The proposing agent reviews its own proposal. The gate does not forbid this
// today — it records. A future policy may disallow it at a higher layer.
{
  const g = new ReplayGate();
  const id = seedProposal(g, 'prop_self', 'agentA');
  const r = g.append({ writer: 'agent', kind: 'review', agent: 'agentA', proposalId: id, decision: 'approve', revision: 0 });
  ok(r.valid, `self-review lands: ${r.error ?? ''}`);
  const p = replay(g.getLog()).proposals.get(id);
  ok(p.reviews.length === 1 && p.reviews[0].agent === 'agentA', 'self-review recorded');
}

// ── 9. missing author migration ────────────────────────────────────────
// Pre-author propose events load with author='unknown'; reviews against them
// still succeed — the revision check does not care about author.
{
  const legacyLine = JSON.stringify({
    seq: 0, ts: '2026-01-01T00:00:00.000Z', writer: 'agent', kind: 'propose',
    id: 'prop_legacy', node: '.legacy', body: {},
  });
  const g = new ReplayGate();
  const load = g.fromJSONL(legacyLine);
  ok(load.valid, `legacy log loads: ${load.error ?? ''}`);
  const p = replay(g.getLog()).proposals.get('prop_legacy');
  ok(p.author === 'unknown', 'missing author defaults to unknown');
  const r = g.append({ writer: 'agent', kind: 'review', agent: 'agentB', proposalId: 'prop_legacy', decision: 'approve', revision: 0 });
  ok(r.valid, `review on legacy proposal valid: ${r.error ?? ''}`);
}

// ── 10. fromJSONL rebuilds revisions so reviews validate ───────────────
// A fresh gate loading a log with revised proposals must know the current
// revision before accepting a review; without the rebuild, reviews fail with
// a mysterious mismatch on the first append after reload.
{
  const g = new ReplayGate();
  const id = seedProposal(g, 'prop_rt');
  g.append({ writer: 'human', kind: 'revise', proposal: id, body: { v: 2 } });
  g.append({ writer: 'human', kind: 'revise', proposal: id, body: { v: 3 } });
  // Log: propose (rev 0), revise (rev 1), revise (rev 2).
  const jsonl = g.toJSONL();

  const g2 = new ReplayGate();
  const load = g2.fromJSONL(jsonl);
  ok(load.valid, `rehydrate valid: ${load.error ?? ''}`);

  const fresh = g2.append({ writer: 'agent', kind: 'review', agent: 'agentB', proposalId: id, decision: 'approve', revision: 2 });
  ok(fresh.valid, `post-rehydrate review at current revision valid: ${fresh.error ?? ''}`);

  const stale = g2.append({ writer: 'agent', kind: 'review', agent: 'agentC', proposalId: id, decision: 'approve', revision: 1 });
  ok(!stale.valid, 'stale review still rejected after rehydrate');
}

if (fails.length) {
  console.error(`\n❌ LOOM REVIEW FAILED — ${fails.length} failure(s):`);
  for (const f of fails) console.error(`   • ${f}`);
  process.exit(1);
}
console.log('✅ loom review — schema, stale-revision gate, reason rule, migration, rehydrate. All green.');
