#!/usr/bin/env node
/**
 * @p31/canon — test-loom-sbt-anchor.mjs
 *
 * The SBT witness anchor must: (1) treat the QPJ block's own hash as an
 * opaque witness value (never re-derived), (2) produce a LOVE-format message,
 * (3) be deterministic, and (4) link each block to its prior anchored hash.
 *
 * Run: node scripts/test-loom-sbt-anchor.mjs  (from packages/canon)
 */
import { sbtAnchor, loomHeadAnchor, LOVE_GENESIS_HASH, sha256Hex } from '../src/loom/anchor.ts';

const failures = [];
function assert(cond, msg) {
  if (!cond) failures.push(msg);
}

// A QPJ block as appendSBT produces it (portals/qpj/src/lib/sbt.ts).
function qpjBlock(blockNumber, prevHash, name) {
  const payload = {
    id: `sbt-test-${blockNumber}`,
    kind: 'achievement',
    name,
    description: 'test block',
    issuedAt: '2026-09-21T00:00:00.000Z',
    blockNumber,
    prevHash,
    metadata: {},
    tetrahedronHash: 't-abc',
  };
  return { ...payload, hash: '' }; // hash filled below
}

// Simulate QPJ's own hashing: sha256(JSON.stringify(payload)) — insertion
// order, NOT RFC 8785. This is exactly why the Loom witnesses rather than
// recomputes.
async function qpjHash(block) {
  const { hash: _h, ...payload } = block;
  return sha256Hex(JSON.stringify(payload));
}

const b0 = qpjBlock(0, null, 'first');
b0.hash = await qpjHash(b0);
const anchor0 = await sbtAnchor('did:key:test-sbt', b0, LOVE_GENESIS_HASH);

assert(anchor0.entryType === 'LOOM_SBT', 'entry type must be LOOM_SBT');
assert(anchor0.payload.blockHash === b0.hash, 'must witness the QPJ block hash as-is');
assert(anchor0.payload.did === 'did:key:test-sbt', 'did passes through');
assert(anchor0.payload.blockNumber === 0, 'blockNumber passes through');
assert(anchor0.payload.prevBlockHash === null, 'genesis block has null prevHash');
assert(/^[0-9a-f]{64}$/.test(anchor0.entryHash), `entryHash must be 64 hex, got ${anchor0.entryHash}`);

// The message is the LOVE chainAppend format with the OPQUE witness payload.
const expectedMessage0 = `LOOM_SBT|${JSON.stringify(anchor0.payload)}|${LOVE_GENESIS_HASH}`;
assert(anchor0.message === expectedMessage0, 'message must match LOVE chainAppend format');
assert(anchor0.entryHash === await sha256Hex(expectedMessage0), 'entryHash must equal SHA-256 of the message');

// Determinism of the primitive: the same payload + prevHash produce the same
// message and the same entryHash. (sbtAnchor stamps its own anchoredAt, so two
// calls differ only by timestamp — the message/hash primitive is what is
// deterministic, and it is what the cross-anchor verification recomputes.)
const { loveMessage } = await import('../src/loom/anchor.ts');
const msgA = loveMessage('LOOM_SBT', anchor0.payload, LOVE_GENESIS_HASH);
const msgB = loveMessage('LOOM_SBT', { ...anchor0.payload }, LOVE_GENESIS_HASH);
assert(msgA === msgB, 'message must be deterministic for the same payload');
assert(anchor0.message === msgA, 'anchor0.message must equal the primitive message');

// A second block links to the first's hash (QPJ's prevHash = prior hash).
const b1 = qpjBlock(1, b0.hash, 'second');
b1.hash = await qpjHash(b1);
const anchor1 = await sbtAnchor('did:key:test-sbt', b1, anchor0.entryHash);
assert(anchor1.payload.prevBlockHash === b0.hash, 'block 1 prevHash links to block 0 hash');
assert(anchor1.entryHash !== anchor0.entryHash, 'different blocks produce different entries');

// Witness semantics: if QPJ's hash is a valid 64-hex, the Loom accepts it
// without re-deriving. (The Loom never recomputes qpj's insertion-order hash.)
assert(anchor1.payload.blockHash === b1.hash, 'must witness block 1 hash as-is');

if (failures.length) {
  console.error(`\n❌ LOOM SBT ANCHOR FAILED — ${failures.length} failure(s):`);
  for (const f of failures) console.error(`   • ${f}`);
  process.exit(1);
}

console.log('✅ loom sbt anchor — QPJ hash witnessed as opaque, LOVE-format message, deterministic, linked.');
console.log(`   genesis ${anchor0.entryHash.slice(0, 12)}… → block1 ${anchor1.entryHash.slice(0, 12)}…`);