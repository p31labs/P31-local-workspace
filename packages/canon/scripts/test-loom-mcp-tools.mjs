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

  // 2. propose stamps seq 0 on a fresh log.
  const p = propose(logPath, 'prop_1', '.glass-card', { draft: true });
  ok(p.valid && p.event?.seq === 0, `propose stamps seq 0 (${p.error ?? ''})`);

  // 3. observe after propose shows the proposal, pending.
  const o1 = observe(logPath);
  ok(o1.proposals.length === 1 && o1.proposals[0].id === 'prop_1', 'observe after propose shows the proposal');
  ok(o1.proposals[0].status === 'pending', 'proposal starts pending');
  ok(o1.agentPath.length === 0, 'no traverse yet, path empty');

  // 4. traverse stamps seq 1 and extends the path.
  const t = traverse(logPath, '--p31-accent', '.glass-card', 'referenced-by');
  ok(t.valid && t.event?.seq === 1, `traverse stamps seq 1 (${t.error ?? ''})`);
  const o2 = observe(logPath);
  ok(o2.agentPath.includes('.glass-card'), 'traverse extends agentPath');

  // 5. awaitReviews times out (the review event kind does not exist yet).
  const aw = await awaitReviews(logPath, 'prop_1', 300);
  ok(aw.status === 'timeout', `awaitReviews on unreviewed proposal times out (got ${aw.status})`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

if (fails.length) {
  console.error(`\n❌ LOOM MCP TOOLS FAILED — ${fails.length} failure(s):`);
  for (const f of fails) console.error(`   • ${f}`);
  process.exit(1);
}
console.log('✅ loom mcp tools — observe/propose/traverse/awaitReviews, all green.');
