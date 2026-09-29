#!/usr/bin/env node
/**
 * Negative control for `audit-chain-verify`.
 *
 * Builds a FAKE tampered chain in a temp dir — block 0 valid genesis, block 1
 * with a corrupted currentHash (does not match its canonical SHA-256) — runs the
 * REAL gate against the fixture, and asserts the gate exits 1 (tampering
 * detected). Emits NEGATIVE_CONTROL_OK on success. Fixture is cleaned up in a
 * finally.
 */
import { createHash } from 'node:crypto';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const gatePath = resolve(scriptDir, '../audit-chain-verify.mjs');

const canonical = (b) =>
  JSON.stringify({ blockNumber: b.blockNumber, timestamp: b.timestamp, eventType: b.eventType, payload: b.payload, prevHash: b.prevHash });
const hash = (b) => createHash('sha256').update(canonical(b)).digest('hex');

let dir;
try {
  dir = mkdtempSync(join(tmpdir(), 'govern-nc-chain-'));

  const genesis = {
    blockNumber: 0,
    timestamp: '2026-01-01T00:00:00.000Z',
    eventType: 'genesis',
    payload: { domain: 'fixture', genesis: true },
    prevHash: '0'.repeat(64),
  };
  genesis.currentHash = hash(genesis);

  // Tampered: currentHash does not match the recomputed canonical hash.
  const tampered = {
    blockNumber: 1,
    timestamp: '2026-01-01T00:00:01.000Z',
    eventType: 'audit',
    payload: { domain: 'fixture', blockNumber: 0, blockHash: 'tampered' },
    prevHash: genesis.currentHash,
    currentHash: 'f'.repeat(64),
  };

  mkdirSync(join(dir, 'domains', 'tampered'), { recursive: true });
  writeFileSync(
    join(dir, 'domains', 'tampered', '.govern-audit.jsonl'),
    [genesis, tampered].map((b) => JSON.stringify(b)).join('\n') + '\n',
  );

  let exit = 0;
  try {
    execFileSync(process.execPath, [gatePath, join(dir, 'domains')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    exit = (e && e.status !== undefined ? e.status : 1);
  }

  if (exit === 1) {
    console.log('NEGATIVE_CONTROL_OK: tampered fixture chain rejected (gate exited 1)');
    process.exit(0);
  }
  console.error(`NC_FAILED: gate exited ${exit}, expected 1 — did not detect tampering`);
  process.exit(1);
} finally {
  if (dir) rmSync(dir, { recursive: true, force: true });
}