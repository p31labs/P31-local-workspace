#!/usr/bin/env node
/**
 * count-orphan-blocks — the count source for the audit domain's orphan-blocks
 * ratchet. Emits {"count": N} where N = number of domain blocks whose
 * currentHash is NOT in the enterprise chain. Always exits 0 (the ratchet
 * enforces the baseline; this only measures).
 *
 * Overrides: argv[2] / $AUDIT_CHAIN_DIR (domains dir), argv[3] / $ENTERPRISE_CHAIN.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));

const overrideDir = process.argv[2] ?? process.env.AUDIT_CHAIN_DIR;
const enterpriseChain = process.argv[3] ?? process.env.ENTERPRISE_CHAIN ?? resolve(scriptDir, '../../../specs/enterprise-audit.jsonl');

let chains = [];
if (overrideDir) {
  for (const entry of readdirSync(overrideDir)) {
    const p = resolve(overrideDir, entry, '.govern-audit.jsonl');
    if (existsSync(p)) chains.push(p);
  }
} else {
  const base = resolve(scriptDir, '../../../domains');
  for (const entry of readdirSync(base)) {
    // The audit domain is the reconciler; its own ledger is mirrored by the
    // same reconcile that reads it (idempotent, self-consistent). Counting its
    // own pending block would be infinite regress — the reconciler cannot be
    // its own orphan. The court vertex (K4) is the check on the reconciler.
    if (entry === 'audit') continue;
    const p = resolve(base, entry, '.govern-audit.jsonl');
    if (existsSync(p)) chains.push(p);
  }
  const runtimeChain = resolve(scriptDir, '../../../.govern-audit.jsonl');
  if (existsSync(runtimeChain)) chains.push(runtimeChain);
}

const enterpriseHashes = new Set();
if (existsSync(enterpriseChain)) {
  for (const l of readFileSync(enterpriseChain, 'utf8').trim().split('\n').filter(Boolean)) {
    const b = JSON.parse(l);
    enterpriseHashes.add(b.currentHash);
    // A domain block's hash is recorded in the mirror block's payload.blockHash.
    if (b.payload && typeof b.payload === 'object' && 'blockHash' in b.payload) {
      enterpriseHashes.add(b.payload.blockHash);
    }
  }
}

let orphans = 0;
for (const chain of chains) {
  for (const l of readFileSync(chain, 'utf8').trim().split('\n').filter(Boolean)) {
    const b = JSON.parse(l);
    if (!enterpriseHashes.has(b.currentHash)) orphans++;
  }
}

console.log(JSON.stringify({ count: orphans }));