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
  // Source of truth: the enterprise spec's domain list. A declared-but-not-
  // governed domain (e.g. family, K3/OBSERVATIONAL) is NOT an enterprise
  // orphan — it simply isn't part of the enterprise timeline until governed.
  // This must mirror `govern reconcile`'s domain enumeration exactly, or the
  // gate and the reconciler will disagree about what an orphan is.
  const specPath = resolve(scriptDir, '../../../specs/enterprise.govern.yaml');
  const { readFileSync } = await import('node:fs');
  const { parse } = await import('yaml');
  const spec = parse(readFileSync(specPath, 'utf8'));
  const specDir = resolve(specPath, '..');
  for (const d of spec.domains ?? []) {
    const conPath = resolve(specDir, d.ref);
    const p = resolve(dirname(conPath), '.govern-audit.jsonl');
    if (existsSync(p)) chains.push(p);
  }
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