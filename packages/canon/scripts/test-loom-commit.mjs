#!/usr/bin/env node
/**
 * @p31/canon — test-loom-commit.mjs
 *
 * The unified write path. Tests:
 *   - happy path: commit writes exactly one event, stamped with seq + ts
 *   - rejection writes nothing: an invalid input leaves the log untouched
 *   - concurrency: N processes x M events -> N*M unique, contiguous seqs
 *   - the concurrent log still replays through the gate
 *
 * Run: node scripts/test-loom-commit.mjs  (from packages/canon)
 */
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Worker } from 'node:worker_threads';
import { commit } from '../src/loom/commit.ts';
import { ReplayGate } from '../src/loom/gate.ts';
import { readEvents } from '../src/loom/jsonl.ts';

const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

function withDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'loom-commit-'));
  try { return fn(join(dir, 'events.jsonl')); }
  finally { rmSync(dir, { recursive: true, force: true }); }
}

// ── happy path ─────────────────────────────────────────────────────────
withDir((logPath) => {
  const r1 = commit(logPath, { writer: 'human', kind: 'focus', node: '--p31-accent' });
  ok(r1.valid, `first commit valid: ${r1.error ?? ''}`);
  ok(r1.event?.seq === 0, `first event seq 0, got ${r1.event?.seq}`);
  ok(typeof r1.event?.ts === 'string' && r1.event.ts.includes('T'), 'gate must stamp ISO ts');

  const r2 = commit(logPath, { writer: 'agent', kind: 'presence', node: '--p31-accent', attention: 0.5 });
  ok(r2.valid, `second commit valid: ${r2.error ?? ''}`);
  ok(r2.event?.seq === 1, `second event seq 1, got ${r2.event?.seq}`);

  ok(readEvents(logPath).length === 2, 'log has 2 events');
});

// ── rejection writes nothing ───────────────────────────────────────────
withDir((logPath) => {
  commit(logPath, { writer: 'human', kind: 'focus', node: '--p31-accent' });
  const before = readEvents(logPath).length;

  const bad = commit(logPath, { writer: 'agent', kind: 'focus', node: 'x' });
  ok(!bad.valid, 'agent focus must be rejected');
  ok(readEvents(logPath).length === before, 'writer-per-kind rejection must not write');

  const orphan = commit(logPath, { writer: 'human', kind: 'approve', proposal: 'nope' });
  ok(!orphan.valid, 'orphan approve must be rejected');
  ok(readEvents(logPath).length === before, 'orphan rejection must not write');
});

// ── concurrency ────────────────────────────────────────────────────────
{
  const dir = mkdtempSync(join(tmpdir(), 'loom-commit-'));
  const logPath = join(dir, 'events.jsonl');
  const WORKER = new URL('./loom-commit-worker.mjs', import.meta.url);
  const N = 3;
  const M = 20;

  const run = (wid) => new Promise((resolve, reject) => {
    const w = new Worker(WORKER, { workerData: { logPath, wid, count: M } });
    w.once('message', resolve);
    w.once('error', reject);
  });

  try {
    const results = await Promise.all(Array.from({ length: N }, (_, i) => run(i)));
    const totalWritten = results.reduce((a, r) => a + r.written, 0);
    ok(totalWritten === N * M, `expected ${N * M} writes, got ${totalWritten}`);

    const events = readEvents(logPath);
    const seqs = events.map((e) => e.seq);
    const unique = new Set(seqs);
    ok(events.length === N * M, `log has ${N * M} events, got ${events.length}`);
    ok(unique.size === seqs.length, `seqs unique: ${seqs.length} events, ${unique.size} unique`);
    ok(
      Math.min(...seqs) === 0 && Math.max(...seqs) === N * M - 1,
      `seqs contiguous 0..${N * M - 1}, got [${Math.min(...seqs)}..${Math.max(...seqs)}]`,
    );

    // The invariant: if it's in the log, it replays.
    const gate = new ReplayGate();
    const load = gate.fromJSONL(readFileSync(logPath, 'utf8').trim());
    ok(load.valid, `concurrent log must replay: ${load.error ?? ''}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

if (fails.length) {
  console.error(`\n❌ LOOM COMMIT FAILED — ${fails.length} failure(s):`);
  for (const f of fails) console.error(`   • ${f}`);
  process.exit(1);
}
console.log('✅ loom commit — atomic write path, rejections write nothing, 3x20 concurrent commits yield 60 unique seqs, log replays.');
