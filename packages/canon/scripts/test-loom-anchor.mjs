#!/usr/bin/env node
/**
 * @p31/canon — test-loom-anchor.mjs
 *
 * The cross-anchor must match love-ledger's chainAppend format byte-for-byte,
 * be deterministic, and link the Loom head to the LOVE chain head.
 *
 * Run: node scripts/test-loom-anchor.mjs  (from packages/canon)
 */
import { loomHeadAnchor, loveMessage, loveEntryHash, LOVE_GENESIS_HASH, sha256Hex } from '../src/loom/anchor.ts';

const failures = [];

function assert(cond, msg) {
  if (!cond) failures.push(msg);
}

// A LOOM_HEAD anchor against the genesis LOVE head.
const payload = {
  loomHead: 'aa11bb22cc33dd44ee55ff66aa11bb22cc33dd44ee55ff66aa11bb22cc33dd44',
  loomSeq: 17,
  brokenAt: null,
  verified: true,
  anchoredAt: '2026-09-21T00:00:00.000Z',
};
const anchor = await loomHeadAnchor(payload, LOVE_GENESIS_HASH);

assert(anchor.entryType === 'LOOM_HEAD', 'entry type must be LOOM_HEAD');
assert(anchor.prevHash === LOVE_GENESIS_HASH, 'prevHash must be the LOVE genesis against an empty chain');
assert(/^[0-9a-f]{64}$/.test(anchor.entryHash), `entryHash must be 64 hex, got ${anchor.entryHash}`);

// The message must be exactly `${entryType}|${JSON.stringify(payload)}|${prevHash}`.
const expectedMessage = `LOOM_HEAD|${JSON.stringify(payload)}|${LOVE_GENESIS_HASH}`;
assert(anchor.message === expectedMessage, 'message must match love-ledger chainAppend format');
assert(
  anchor.entryHash === await sha256Hex(expectedMessage),
  'entryHash must equal SHA-256 of the exact message',
);

// loveEntryHash / loveMessage must be consistent with loomHeadAnchor.
assert(
  await loveEntryHash('LOOM_HEAD', payload, LOVE_GENESIS_HASH) === anchor.entryHash,
  'loveEntryHash must agree with loomHeadAnchor',
);

// Determinism: same inputs, same entryHash.
const again = await loomHeadAnchor({ ...payload }, LOVE_GENESIS_HASH);
assert(again.entryHash === anchor.entryHash, 'anchor must be deterministic');

// Two different LOVE heads produce different entryHashes (the anchor links to
// WHERE in the LOVE chain it lands, not just what it says).
const otherPrev = 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';
const other = await loomHeadAnchor({ ...payload }, otherPrev);
assert(other.entryHash !== anchor.entryHash, 'anchor must depend on the LOVE chain head');
assert(other.prevHash === otherPrev, 'anchor must carry the given LOVE prevHash');

// Verified=false anchors still hash fine (an honest anchor of a broken log is
// itself court-admissible — it proves the break was recorded).
const broken = await loomHeadAnchor({ ...payload, verified: false, brokenAt: 9, loomSeq: 9 }, LOVE_GENESIS_HASH);
assert(/^[0-9a-f]{64}$/.test(broken.entryHash), 'broken-log anchor must still hash');

if (failures.length) {
  console.error(`\n❌ LOOM CROSS-ANCHOR FAILED — ${failures.length} failure(s):`);
  for (const f of failures) console.error(`   • ${f}`);
  process.exit(1);
}

console.log('✅ loom cross-anchor — LOVE chainAppend format matched byte-for-byte, deterministic, head-linked.');
console.log(`   entry ${anchor.entryHash.slice(0, 12)}… against genesis.`);