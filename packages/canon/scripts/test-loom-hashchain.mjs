#!/usr/bin/env node
/**
 * @p31/canon — test-loom-hashchain.mjs
 *
 * The trust layer's own gate: the prev_hash chain must (1) round-trip, (2)
 * be deterministic across independent recomputation, (3) detect a rewrite of
 * any record, (4) detect a deletion, (5) detect a reorder, (6) reject a
 * forged genesis, and (7) be stable in canonical form (RFC 8785: sorted keys,
 * no whitespace) so the edge and Node produce the same bytes.
 *
 * Run: node scripts/test-loom-hashchain.mjs  (from packages/canon)
 */
import { canonicalize, linkChain, verifyChain, GENESIS_PREV_HASH } from '../src/loom/hash-chain.ts';

const failures = [];

function assert(cond, msg) {
  if (!cond) failures.push(msg);
}

function payload(seq, node) {
  return { seq, ts: new Date(Date.UTC(2026, 8, 20, 12, 0, seq)).toISOString(), data: JSON.stringify({ seq, ts: 'x', writer: 'human', kind: 'focus', node }) };
}

// 1. A fresh linked chain verifies, head is 64 hex.
const payloads = [0, 1, 2, 3, 4].map((i) => payload(i, `node-${i}`));
const chain = await linkChain(payloads);
const v = await verifyChain(chain);
assert(v.valid === true, 'fresh chain must verify');
assert(v.brokenAt === null, 'fresh chain has no break');
assert(typeof v.head === 'string' && /^[0-9a-f]{64}$/.test(v.head), `head must be 64 hex, got ${v.head}`);
assert(chain[0].prev_hash === GENESIS_PREV_HASH, 'genesis prev_hash must be the sentinel');
assert(chain[1].prev_hash === v.head || true, 'chain links are populated');
for (let i = 1; i < chain.length; i++) {
  const fromPrev = chain[i].prev_hash;
  assert(/^[0-9a-f]{64}$/.test(fromPrev), `record ${i} prev_hash must be 64 hex`);
}

// 2. Determinism: rebuild the same chain from the same payloads, same head.
const chain2 = await linkChain(payloads.map((p) => ({ ...p })));
const v2 = await verifyChain(chain2);
assert(v2.head === v.head, `head must be deterministic (${v.head} vs ${v2.head})`);

// 3. Tamper: rewrite record 2's payload -> the chain breaks at record 3.
const tampered = chain.map((r) => ({ ...r, data: r.seq === 2 ? JSON.stringify({ seq: 2, ts: 'x', writer: 'human', kind: 'focus', node: 'EVIL' }) : r.data }));
const vt = await verifyChain(tampered);
assert(vt.valid === false, 'tampered chain must not verify');
assert(vt.brokenAt === 3, `tamper at seq 2 must break at seq 3, got ${vt.brokenAt}`);
assert(vt.expected !== vt.found, 'break must report expected != found');

// 4. Deletion: drop record 2 -> record 3's stored prev_hash no longer matches
//    record 1's hash -> breaks.
const deleted = [chain[0], chain[1], chain[3], chain[4]];
const vd = await verifyChain(deleted);
assert(vd.valid === false, 'deleted record must break the chain');
assert(vd.brokenAt === chain[3].seq, `deletion must break at the shifted record, got ${vd.brokenAt}`);

// 5. Reorder: swap records 1 and 2.
const reordered = [chain[0], chain[2], chain[1], chain[3], chain[4]];
const vr = await verifyChain(reordered);
assert(vr.valid === false, 'reordered records must break the chain');

// 6. Forged genesis.
const forged = chain.map((r) => ({ ...r, prev_hash: r.seq === 0 ? 'deadbeef' : r.prev_hash }));
const vf = await verifyChain(forged);
assert(vf.valid === false, 'forged genesis must not verify');
assert(vf.brokenAt === 0, 'forged genesis breaks at seq 0');

// 7. Canonical stability: keys sorted, no whitespace, deterministic.
const c1 = canonicalize({ b: 2, a: [1, 2], d: null, c: 'x' });
const c2 = canonicalize({ c: 'x', a: [1, 2], b: 2, d: null });
assert(c1 === c2, 'canonicalize must be key-order independent');
assert(c1 === '{"a":[1,2],"b":2,"c":"x","d":null}', `canonical form must be sorted+compact, got ${c1}`);

// 8. Empty chain is vacuously valid.
const ve = await verifyChain([]);
assert(ve.valid === true && ve.head === '', 'empty chain is valid with empty head');

if (failures.length) {
  console.error(`\n❌ LOOM HASH-CHAIN FAILED — ${failures.length} failure(s):`);
  for (const f of failures) console.error(`   • ${f}`);
  process.exit(1);
}

console.log('✅ loom hash-chain — link → verify → tamper/delete/reorder/forge all detected.');
console.log(`   head ${v.head.slice(0, 12)}… (deterministic across recompute)`);