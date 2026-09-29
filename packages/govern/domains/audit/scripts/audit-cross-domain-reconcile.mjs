#!/usr/bin/env node
/**
 * audit-cross-domain-reconcile — every domain block's currentHash must appear
 * in the enterprise timeline (specs/enterprise-audit.jsonl). An orphaned
 * domain block means the unified timeline is missing evidence.
 *
 * Reads every domain chain (default: ../../../domains/<name>/.govern-audit.jsonl
 * PLUS the runtime's own chain at ../../../.govern-audit.jsonl — the enterprise
 * spec's `govern` domain) and the enterprise chain, and verifies each domain
 * block's currentHash is present. Exit 0 if fully reconciled; exit 1 naming the
 * orphaned domain/block if not.
 *
 * Overrides (for negative controls / fixtures):
 *   argv[2] or $AUDIT_CHAIN_DIR  — a domains directory (scans <dir>/<name>/.govern-audit.jsonl)
 *   argv[3] or $ENTERPRISE_CHAIN — the enterprise chain file path
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
    const p = resolve(base, entry, '.govern-audit.jsonl');
    if (existsSync(p)) chains.push(p);
  }
  const runtimeChain = resolve(scriptDir, '../../../.govern-audit.jsonl');
  if (existsSync(runtimeChain)) chains.push(runtimeChain);
}
chains.sort();

if (chains.length === 0) {
  console.error(`audit-cross-domain-reconcile: no domain chains found${overrideDir ? ` under ${overrideDir}` : ''}`);
  process.exit(1);
}
if (!existsSync(enterpriseChain)) {
  console.error(`audit-cross-domain-reconcile: enterprise chain not found: ${enterpriseChain}`);
  process.exit(1);
}

const enterpriseHashes = new Set();
for (const line of readFileSync(enterpriseChain, 'utf8').trim().split('\n').filter(Boolean)) {
  const b = JSON.parse(line);
  enterpriseHashes.add(b.currentHash);
  // A domain block's hash is recorded in the mirror block's payload.blockHash.
  if (b.payload && typeof b.payload === 'object' && 'blockHash' in b.payload) {
    enterpriseHashes.add(b.payload.blockHash);
  }
}

let orphans = 0;
for (const chain of chains) {
  const lines = readFileSync(chain, 'utf8').trim().split('\n').filter(Boolean);
  for (const line of lines) {
    const b = JSON.parse(line);
    if (!enterpriseHashes.has(b.currentHash)) {
      console.error(`✗ ${chain}: block #${b.blockNumber} (${b.currentHash.slice(0, 16)}…) is ORPHANED — not present in ${enterpriseChain}`);
      orphans++;
    }
  }
}

if (orphans > 0) {
  console.error(`audit-cross-domain-reconcile: ${orphans} orphaned domain block(s) — enterprise timeline is NOT authoritative`);
  process.exit(1);
}
console.log('audit-cross-domain-reconcile: every domain block is mirrored in the enterprise timeline');