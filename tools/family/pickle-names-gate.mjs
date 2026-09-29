#!/usr/bin/env node
/**
 * gate:pickle-names — the family domain's identity-integrity gate.
 *
 * Runs the pickle naming invariants from @p31ca/sovereign-primitives:
 *   - deterministic (same seed → same name)
 *   - vocabulary-closed (Prefix·Suffix only)
 *   - batch collision-free
 *   - canonical passports: unique ids, unique pickle names, one caregiver
 *
 * The pickle system is the family's privacy-preserving identity layer —
 * "the street never shows a human name." A violation means identity
 * integrity is broken. Exit 1 on any failure.
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

let sp;
// Negative-control injection point: when PICKLE_NC_FIXTURE is set, load the
// sabotaged copy so the gate can be proven to fail. Otherwise load the real
// package (or the local dist before publish).
if (process.env.PICKLE_NC_FIXTURE) {
  sp = require(process.env.PICKLE_NC_FIXTURE);
} else {
  try {
    sp = require('@p31ca/sovereign-primitives/pickle-names');
  } catch {
    const dist = '/home/p31/P31-local-workspace/packages/sovereign-primitives/dist/pickle-names/export.js';
    sp = require(dist);
  }
}

const failures = [];
const pickle = sp.pickleInvariants();
if (!pickle.ok) failures.push(...pickle.failures.map((f) => `pickle: ${f}`));
const passport = sp.passportInvariants();
if (!passport.ok) failures.push(...passport.failures.map((f) => `passport: ${f}`));

if (failures.length > 0) {
  console.error('✗ gate:pickle-names FAILED');
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log('✅ gate:pickle-names: identity invariants hold (determinism, vocabulary, uniqueness).');
process.exit(0);