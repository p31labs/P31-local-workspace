#!/usr/bin/env node
/**
 * Backfill prev_hash for existing D1 rows.
 *
 * The `prev_hash` column was added via ALTER; every existing row holds ''.
 * This script reads the rows in seq order, recomputes each row's chain link
 * from the previous row's canonical preimage (RFC 8785, via the canon's
 * hash-chain module), and writes the links back. Genesis stays ''.
 *
 * Deterministic and idempotent: given the same rows, the same chain is
 * produced every run. Safe to re-run after new appends (it only fills '').
 *
 * Uses the wrangler D1 CLI for reads and writes (remote by default). The
 * chain computation itself runs in-process through the SAME hash-chain module
 * the Functions and the dev middleware use, so the backfill cannot drift from
 * the runtime.
 *
 * Usage:
 *   node apps/loom/scripts/backfill-prev-hash.mjs          # remote (default)
 *   node apps/loom/scripts/backfill-prev-hash.mjs --local   # local D1
 */
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { linkChain, GENESIS_PREV_HASH } from '../../../packages/canon/src/loom/hash-chain.ts';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..', '..');
const DATABASE = 'loom';
const LOCAL = process.argv.includes('--local');

function d1(command) {
  const args = ['d1', 'execute', DATABASE];
  if (LOCAL) args.push('--local');
  else args.push('--remote');
  args.push('--command', command, '--json');
  const out = execFileSync('wrangler', args, { cwd: repo, encoding: 'utf8' });
  const json = JSON.parse(out.slice(out.indexOf('[')));
  return json[0];
}

// Read all rows, oldest first.
const read = d1('SELECT seq, ts, data, prev_hash FROM events ORDER BY seq ASC');
const rows = read?.results ?? [];
if (!rows.length) {
  console.log('no rows to backfill');
  process.exit(0);
}

// Compute the chain for rows missing their link (genesis stays '').
const needsLink = rows.filter((r) => r.prev_hash === GENESIS_PREV_HASH && r.seq !== 0);
const linked = await linkChain(
  rows.map((r) => ({ seq: Number(r.seq), ts: r.ts, data: r.data })),
);
const updates = linked.filter((r) => rows.find((row) => Number(row.seq) === r.seq)?.prev_hash !== r.prev_hash);

if (!updates.length) {
  console.log(`chain already consistent (${rows.length} rows) — nothing to write`);
  process.exit(0);
}

// Write links back one row at a time.
let changed = 0;
for (const r of updates) {
  const res = d1(`UPDATE events SET prev_hash = '${r.prev_hash}' WHERE seq = ${r.seq};`);
  if (res?.success) changed++;
  else {
    console.error(`UPDATE failed for seq ${r.seq}: ${JSON.stringify(res)}`);
    process.exit(1);
  }
}

const head = linked[linked.length - 1].prev_hash;
console.log(`backfilled ${changed}/${updates.length} rows (${rows.length} total); head ${head}`);
console.log(needsLink.length ? `note: ${needsLink.length} row(s) had a stale '' link and were fixed` : 'chain consistent.');