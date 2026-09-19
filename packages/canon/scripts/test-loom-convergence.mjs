#!/usr/bin/env node
/**
 * @p31/canon — test-loom-convergence.mjs
 *
 * Real convergence: three independent worker processes read the SAME JSONL log
 * from disk and fold it independently. Their canonical state hashes must be
 * identical. This is the proof that a second writer (Path β) and a third
 * (Claude's canvas) will see the same world DeepSeek's reducer produces.
 *
 * Run: node scripts/test-loom-convergence.mjs  (from packages/canon)
 */
import { Worker } from 'node:worker_threads';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ReplayGate } from '../src/loom/gate.ts';

const WORKER = new URL('./loom-convergence-worker.mjs', import.meta.url);

function runWorker(logPath) {
  return new Promise((resolve, reject) => {
    const w = new Worker(WORKER, { workerData: { logPath } });
    w.once('message', resolve);
    w.once('error', reject);
  });
}

// Build a varied log.
const g = new ReplayGate();
g.append({ writer: 'human', kind: 'focus', node: '--p31-glass-surface' });
g.append({ writer: 'agent', kind: 'presence', node: '--p31-glass-surface', attention: 1 });
for (let i = 0; i < 20; i++) {
  const id = `prop_${i}`;
  g.append({ writer: 'agent', kind: 'propose', id, node: `.class-${i}`, body: { i } });
  g.append({ writer: 'agent', kind: 'traverse', from: '--p31-glass-surface', to: `.class-${i}`, reason: 'referenced-by' });
  if (i % 3 === 0) g.append({ writer: 'human', kind: 'approve', proposal: id });
  else if (i % 3 === 1) g.append({ writer: 'human', kind: 'reject', proposal: id, reason: 'deferred' });
  else g.append({ writer: 'human', kind: 'revise', proposal: id, body: { i, v: 2 } });
}

const dir = mkdtempSync(join(tmpdir(), 'loom-conv-'));
const logPath = join(dir, 'events.jsonl');
writeFileSync(logPath, g.toJSONL() + '\n');

try {
  const hashes = await Promise.all([runWorker(logPath), runWorker(logPath), runWorker(logPath)]);
  const [h1, h2, h3] = hashes;
  if (h1 !== h2 || h2 !== h3) {
    console.error('\n❌ LOOM CONVERGENCE FAILED — worker states diverged');
    console.error(`   A: ${h1.slice(0, 120)}`);
    console.error(`   B: ${h2.slice(0, 120)}`);
    console.error(`   C: ${h3.slice(0, 120)}`);
    process.exit(1);
  }
  console.log(`✅ loom convergence — 3 independent processes, identical state (${h1.length} bytes canonical, ${g.getLogLength()} events).`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
