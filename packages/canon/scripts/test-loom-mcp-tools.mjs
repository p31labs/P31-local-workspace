#!/usr/bin/env node
/**
 * @p31/canon — test-loom-mcp-tools.mjs
 *
 * Smoke suite for the β-1 presence handlers (canon-mcp/src/loom-tools.ts):
 * observe / propose / traverse / awaitReviews. Writes to a TEMP log via
 * commit(); never touches the real log, never writes registry.json.
 *
 * Run: node scripts/test-loom-mcp-tools.mjs  (from packages/canon)
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { observe, traverse, propose, awaitReviews } from '../../canon-mcp/src/loom-tools.ts';
import { commit } from '@p31/canon/loom/commit';

const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

const dir = mkdtempSync(join(tmpdir(), 'loom-mcp-'));
const logPath = join(dir, 'events.jsonl');

try {
  // 1. observe on an empty log returns initial state.
  const o0 = observe(logPath);
  ok(
    o0.focused === null && o0.agentCursor === null && o0.agentAttention === 1 && o0.proposals.length === 0,
    'observe on empty log returns initial state',
  );

  // 2. propose stamps seq 0 on a fresh log, and author is recorded.
  const p = propose(logPath, 'prop_1', '.glass-card', { draft: true }, 'presence-01');
  ok(p.valid && p.event?.seq === 0, `propose stamps seq 0 (${p.error ?? ''})`);

  // 3. observe after propose shows the proposal, pending, with author and no reviews.
  const o1 = observe(logPath);
  ok(o1.proposals.length === 1 && o1.proposals[0].id === 'prop_1', 'observe after propose shows the proposal');
  ok(o1.proposals[0].status === 'pending', 'proposal starts pending');
  ok(o1.proposals[0].author === 'presence-01', 'propose author is recorded');
  ok(Array.isArray(o1.proposals[0].reviews) && o1.proposals[0].reviews.length === 0, 'no reviews yet');
  ok(o1.agentPath.length === 0, 'no traverse yet, path empty');

  // 4. traverse stamps seq 1 and extends the path.
  const t = traverse(logPath, '--p31-accent', '.glass-card', 'referenced-by');
  ok(t.valid && t.event?.seq === 1, `traverse stamps seq 1 (${t.error ?? ''})`);
  const o2 = observe(logPath);
  ok(o2.agentPath.includes('.glass-card'), 'traverse extends agentPath');

  // 5. awaitReviews resolves when a review lands during the wait (fs.watch).
  const wait = awaitReviews(logPath, 'prop_1', 2000);
  await new Promise((r) => setTimeout(r, 50));
  const rv = commit(logPath, { writer: 'agent', kind: 'review', agent: 'presence-02', proposalId: 'prop_1', decision: 'approve', revision: 0 });
  ok(rv.valid, `review commit valid (${rv.error ?? ''})`);
  const aw = await wait;
  ok(aw.status === 'complete', `awaitReviews resolves on review (got ${aw.status})`);
  ok(Array.isArray(aw.reviews) && aw.reviews.length === 1, 'awaitReviews returns the review');

  // 6. observe now surfaces the review.
  const o3 = observe(logPath);
  ok(o3.proposals[0].reviews.length === 1 && o3.proposals[0].reviews[0].agent === 'presence-02', 'observe surfaces the review');

  // 7. awaitReviews still times out when no review is forthcoming (unreviewed proposal).
  propose(logPath, 'prop_2', '.button', { draft: false }, 'presence-01');
  const awTimeout = await awaitReviews(logPath, 'prop_2', 200);
  ok(awTimeout.status === 'timeout', `awaitReviews times out on unreviewed proposal (got ${awTimeout.status})`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

if (fails.length) {
  console.error(`\n❌ LOOM MCP TOOLS FAILED — ${fails.length} failure(s):`);
  for (const f of fails) console.error(`   • ${f}`);
  process.exit(1);
}
console.log('✅ loom mcp tools — observe/propose/traverse/awaitReviews, all green.');