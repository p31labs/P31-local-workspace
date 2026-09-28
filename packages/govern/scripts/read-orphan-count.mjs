#!/usr/bin/env node
// Emits the orphan count as {"count": N} — the input the govern ratchet reads.
// The count is produced by design's audit-orphans.mjs (writes orphan-count.json).
import { readFileSync } from 'node:fs';
const f = '/home/p31/production/portals/design/tests/acceptance/orphan-count.json';
try {
  const d = JSON.parse(readFileSync(f, 'utf8'));
  console.log(`{"count": ${d.count}}`);
} catch {
  console.error('orphan-count.json missing — run audit-orphans first.');
  process.exit(1);
}
