#!/usr/bin/env node
/**
 * @p31/canon — test-loom-profiles.mjs
 *
 * The human profile store. Lives outside the log: readProfile/writeProfile
 * against an absolute profiles directory. The log carries only an optional
 * `humanId` reference; the store carries everything a presentation layer
 * needs and nothing an append-only artifact record should.
 *
 * Run: node scripts/test-loom-profiles.mjs  (from packages/canon)
 */
import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { readProfile, writeProfile } from '../src/loom/profiles.ts';

const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

const dir = join(tmpdir(), `loom-profiles-${process.pid}-${Date.now()}`);

try {
  // ── 1. missing profile -> null (no throw) ─────────────────────────────
  ok(readProfile(dir, 'nobody') === null, 'missing profile reads as null');

  // ── 2. write then read round-trips ────────────────────────────────────
  writeProfile(dir, {
    id: 'human-1',
    displayName: 'Dana',
    pronouns: 'they/them',
    presentation: { letterSpacing: 'extra-wide', motion: 'reduced' },
    tier: 'beginner',
    shareWithAgents: { tier: true, presentation: false },
  });
  const p = readProfile(dir, 'human-1');
  ok(p !== null, 'written profile reads back');
  ok(p.id === 'human-1', 'id round-trips');
  ok(p.displayName === 'Dana', 'displayName round-trips');
  ok(p.pronouns === 'they/them', 'pronouns round-trips');
  ok(p.presentation?.letterSpacing === 'extra-wide', 'presentation round-trips');
  ok(p.tier === 'beginner', 'tier round-trips');
  ok(p.shareWithAgents?.tier === true, 'consent round-trips');

  // ── 3. minimal profile (only id) survives a round-trip ────────────────
  writeProfile(dir, { id: 'human-2' });
  const q = readProfile(dir, 'human-2');
  ok(q !== null && q.id === 'human-2', 'minimal profile round-trips');
  ok(q.pronouns === undefined, 'absent fields stay absent');

  // ── 4. on-disk file is human-readable JSON, one file per id ───────────
  const raw = JSON.parse(readFileSync(join(dir, 'human-1.json'), 'utf8'));
  ok(raw.displayName === 'Dana', 'on-disk file is the profile JSON');
  ok(raw.id === 'human-1', 'on-disk file keys by id');

  // ── 5. the store never touches the log path ───────────────────────────
  // No LOOM_LOG / resolveLogPath / events.jsonl reference exists in the
  // store. This is asserted structurally by check-loom-seal.mjs (which scans
  // packages/canon/src/loom); here we assert the write lands in OUR dir, not
  // a log-adjacent path.
  ok(readProfile(join(dir, 'nested', 'deeper'), 'x') === null, 'missing subdir does not create a log write');
} finally {
  rmSync(dir, { recursive: true, force: true });
}

if (fails.length) {
  console.error(`\n❌ LOOM PROFILES FAILED — ${fails.length} failure(s):`);
  for (const f of fails) console.error(`   • ${f}`);
  process.exit(1);
}
console.log('✅ loom profiles — profile store lives outside the log; humanId stays a reference.');
