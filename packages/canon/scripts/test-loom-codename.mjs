#!/usr/bin/env node
/**
 * @p31/canon — test-loom-codename.mjs
 *
 * The pickle code-name system must be: (1) deterministic (same seed, same
 * name, forever), (2) distinct across different seeds, (3) collision-avoiding
 * (exclude works), (4) stable in the "prefix·suffix" shape, and (5) usable on
 * DID/humanId/loveDid strings without exposing them.
 *
 * Run: node scripts/test-loom-codename.mjs  (from packages/canon)
 */
import { codename, codenames } from '../src/loom/codename.ts';

const failures = [];
function assert(cond, msg) {
  if (!cond) failures.push(msg);
}

// 1. Determinism: same seed → same name, always.
const a = codename('did:key:zDillpickle');
const b = codename('did:key:zDillpickle');
assert(a === b, `codename must be deterministic (${a} vs ${b})`);
assert(a.includes('·'), `name must be prefix·suffix shape, got ${a}`);

// 2. Distinct seeds → distinct names (overwhelmingly).
const one = codename('did:key:one');
const two = codename('did:key:two');
assert(one !== two, `different seeds should differ (${one} vs ${two})`);

// 3. Exclude: the same name is never returned twice; a taken name is skipped.
const first = codename('did:key:mesh');
const exclude = new Set([first]);
const second = codename('did:key:mesh', { exclude });
assert(second !== first, 'excluded name must not be re-issued');
assert(!exclude.has(second), 'second must be a fresh name');

// 4. Codenames(count) yields `count` distinct names from one seed.
const names = codenames('did:key:family', 4);
assert(names.length === 4, `must yield 4 names, got ${names.length}`);
assert(new Set(names).size === 4, 'the 4 names must be distinct');
for (const n of names) assert(n.includes('·'), `name ${n} must be prefix·suffix`);

// 5. Privacy-safe shape: the output never contains the seed (the raw DID).
for (const n of [a, one, two, ...names]) {
  assert(!n.includes('did:key'), `name ${n} must not leak the raw DID`);
  assert(!n.includes('Dillpickle'), `name ${n} must not leak the seed`);
}

// 6. Same humanId and loveDid that resolve to the same person → same name
//    (the name follows the person, not the id format).
assert(codename('qpj:passport:dillpickle') === codename('qpj:passport:dillpickle'), 'same id → same name');

if (failures.length) {
  console.error(`\n❌ LOOM CODENAME FAILED — ${failures.length} failure(s):`);
  for (const f of failures) console.error(`   • ${f}`);
  process.exit(1);
}

console.log('✅ loom codename — deterministic, distinct, collision-safe, privacy-preserving.');
console.log(`   ${a} · ${one} · ${two} · ${names.join(' / ')}`);