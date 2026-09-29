#!/usr/bin/env node
// Emits the orphan count as {"count": N} — the input the govern ratchet reads.
// Portable: the orphan-count.json path is passed as argv[2], never hardcoded.
// The count is produced by design's audit-orphans.mjs (writes orphan-count.json).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const f = resolve(process.argv[2] ?? 'orphan-count.json');
try {
  const d = JSON.parse(readFileSync(f, 'utf8'));
  console.log(`{"count": ${d.count}}`);
} catch {
  console.error(`orphan-count.json missing — run audit-orphans first. (${f})`);
  process.exit(1);
}