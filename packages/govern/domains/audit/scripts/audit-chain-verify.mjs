#!/usr/bin/env node
/**
 * audit-chain-verify — tamper-evidence gate for every per-domain Genesis chain.
 *
 * Recomputes each block's SHA-256 from its canonical JSON
 *   {blockNumber, timestamp, eventType, payload, prevHash}
 * and verifies the prevHash linkage (block N.prevHash == block N-1.currentHash)
 * plus the 64-zero genesis anchor on block 0. If any chain is broken, names the
 * chain and block and exits 1.
 *
 * Target override: pass a domains directory as argv[2] or $AUDIT_CHAIN_DIR; the
 * gate then scans <dir>/<name>/.govern-audit.jsonl instead of the default
 * ../../../domains/<name>/.govern-audit.jsonl (relative to this script).
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const domainsDir = process.argv[2] ?? process.env.AUDIT_CHAIN_DIR ?? resolve(scriptDir, '../../../domains');
const ZERO64 = '0'.repeat(64);

const canonical = (b) =>
  JSON.stringify({ blockNumber: b.blockNumber, timestamp: b.timestamp, eventType: b.eventType, payload: b.payload, prevHash: b.prevHash });

const chains = [];
for (const entry of readdirSync(domainsDir)) {
  const p = resolve(domainsDir, entry, '.govern-audit.jsonl');
  if (existsSync(p)) chains.push(p);
}
if (chains.length === 0) {
  console.error(`audit-chain-verify: no .govern-audit.jsonl chains found under ${domainsDir}`);
  process.exit(1);
}

let failures = 0;
for (const chain of chains) {
  const lines = readFileSync(chain, 'utf8').trim().split('\n').filter(Boolean);
  if (lines.length === 0) {
    console.error(`✗ ${chain}: empty chain`);
    failures++;
    continue;
  }
  let prev = null;
  for (let i = 0; i < lines.length; i++) {
    let b;
    try {
      b = JSON.parse(lines[i]);
    } catch {
      console.error(`✗ ${chain}: line ${i + 1} is not valid JSON`);
      failures++;
      continue;
    }
    const computed = createHash('sha256').update(canonical(b)).digest('hex');
    if (computed !== b.currentHash) {
      console.error(`✗ ${chain}: block ${b.blockNumber} hash mismatch (computed ${computed.slice(0, 16)}…, stored ${b.currentHash.slice(0, 16)}…)`);
      failures++;
    }
    if (i === 0) {
      if (b.prevHash !== ZERO64) {
        console.error(`✗ ${chain}: genesis block ${b.blockNumber} prevHash is not the 64-zero anchor`);
        failures++;
      }
    } else if (b.prevHash !== prev) {
      console.error(`✗ ${chain}: block ${b.blockNumber} prevHash does not link to block ${b.blockNumber - 1} (${b.prevHash.slice(0, 16)}… vs ${(prev ?? '').slice(0, 16)}…)`);
      failures++;
    }
    prev = b.currentHash;
  }
  if (failures === 0) console.log(`✓ ${chain}: ${lines.length} blocks verified`);
}

if (failures > 0) {
  console.error(`audit-chain-verify: ${failures} broken hash/linkage detected — chains are NOT tamper-evident`);
  process.exit(1);
}
console.log('audit-chain-verify: all chains tamper-evident');