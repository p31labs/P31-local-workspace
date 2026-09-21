#!/usr/bin/env node
/**
 * @p31/canon — test-loom-love.mjs
 *
 * The care-proof derivation must be stable, threshold-correct, and privacy-safe:
 * given a balance, the proof is a verdict + pools — never the events. Covers
 * the bound/unbound, verified/unverified split at the 0.5 threshold, and the
 * structural guarantee that the proof shape cannot carry event data.
 *
 * Run: node scripts/test-loom-love.mjs  (from packages/canon)
 */
import { careProofOf, CARE_THRESHOLD } from '../src/loom/love.ts';

const failures = [];

function assert(cond, msg) {
  if (!cond) failures.push(msg);
}

// Unbound (null balance) — degrades gracefully, never throws.
const unbound = careProofOf('did:key:unbound', null);
assert(unbound.bound === false, 'null balance must be unbound');
assert(unbound.careScore === 0, 'unbound care score must be 0');
assert(unbound.verified === false, 'unbound must not be verified');
assert(unbound.sovereigntyPool === 0 && unbound.performancePool === 0, 'unbound pools must be 0');

// Verified caregiver at/above threshold.
const verified = careProofOf('did:key:caregiver', {
  userId: 'did:key:caregiver',
  totalEarned: 120,
  sovereigntyPool: 60,
  performancePool: 60,
  careScore: 0.7,
  availableBalance: 42,
  frozenBalance: 18,
  totalSpoonDebt: 2,
  updatedAt: 1788818753571,
});
assert(verified.bound === true, 'balance must bind');
assert(verified.careScore === 0.7, 'care score passes through');
assert(verified.verified === true, `0.7 >= ${CARE_THRESHOLD} must verify`);
assert(verified.sovereigntyPool === 60, 'sovereignty pool passes through');
assert(verified.performancePool === 60, 'performance pool passes through');
assert(verified.totalEarned === 120, 'totalEarned passes through');
assert(verified.updatedAt === 1788818753571, 'updatedAt passes through');

// Below threshold — not verified.
const borderline = careProofOf('did:key:new', {
  userId: 'did:key:new',
  totalEarned: 4,
  sovereigntyPool: 2,
  performancePool: 2,
  careScore: 0.49,
  availableBalance: 0.98,
  frozenBalance: 1.02,
  totalSpoonDebt: 0,
  updatedAt: null,
});
assert(borderline.verified === false, '0.49 < threshold must not verify');

// Exactly at threshold — verified (inclusive boundary, matches ledger + chain).
const exact = careProofOf('did:key:exact', {
  userId: 'did:key:exact',
  totalEarned: 0,
  sovereigntyPool: 0,
  performancePool: 0,
  careScore: CARE_THRESHOLD,
  availableBalance: 0,
  frozenBalance: 0,
  totalSpoonDebt: 0,
  updatedAt: null,
});
assert(exact.verified === true, 'exactly threshold must verify (inclusive)');

// Privacy-safe: the proof keys are verdicts + balances. A future change that
// adds an event or transaction field to the proof FAILS this gate.
const PROOF_KEYS = ['did', 'bound', 'careScore', 'verified', 'sovereigntyPool', 'performancePool', 'totalEarned', 'updatedAt'];
const actualKeys = Object.keys(verified).sort();
assert(
  JSON.stringify(actualKeys) === JSON.stringify(PROOF_KEYS.sort()),
  `proof shape must be verdict+pools only, got: ${actualKeys.join(', ')}`,
);

if (failures.length) {
  console.error(`\n❌ LOOM LOVE CARE-PROOF FAILED — ${failures.length} failure(s):`);
  for (const f of failures) console.error(`   • ${f}`);
  process.exit(1);
}

console.log('✅ loom love care-proof — bound/unbound, 0.5 threshold (inclusive), privacy-safe shape.');
console.log(`   verified at 0.7, not at 0.49, exactly at ${CARE_THRESHOLD}.`);