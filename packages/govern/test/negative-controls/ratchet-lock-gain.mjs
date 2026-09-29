#!/usr/bin/env node
/**
 * Negative control for the `govern-ratchet` gate (lock-the-gain branch).
 *
 * Proves the ratchet can fail when headroom exceeds the lock threshold. Runs a
 * fixture ratchet (baseline 15, count source emits 2, threshold 2 → headroom
 * 13 > 2) and asserts it fails with LOCK THE GAIN.
 *
 * STRONG CONTRACT: this must exit 0 AND emit NEGATIVE_CONTROL_OK to prove the
 * gate can fail. If the ratchet accepts the headroom, exit 1 — the ratchet
 * gate is furniture.
 */
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const { runRatchets } = await import(join(here, '../../dist/index.js'));

const dir = mkdtempSync(join(tmpdir(), 'govern-nc-ratchet-'));
try {
  writeFileSync(join(dir, 'count.mjs'), 'console.log(2);\n');
  const con = {
    schema: 'https://p31ca.org/schemas/govern/constitution/0.3.0.json',
    domain: 'fixture',
    version: '0.0.1',
    genesisTimestamp: new Date().toISOString(),
    canonicalSource: { path: 'x', description: 'x', oqe: { evidenceClass: 'primary-source', reference: 'x' } },
    mirrors: [],
    gates: [],
    ratchets: [{ id: 'r', baseline: 15, countSource: join(dir, 'count.mjs'), lockThreshold: 2 }],
    runbooks: [], lessons: [], fleet: [],
    review: { who: [{ type: 'role', id: 'fixture' }], cadence: 'c', onFailure: 'f', abdication: { afterCleanCycles: 1, requiresHumanSignoff: true } },
    auditLog: { chainName: 'fixture', sink: 'stdout' },
    aspirational: [],
  };
  const results = runRatchets(con, dir);
  const r = results.find((x) => x.id === 'r');
  if (!r || r.ok || !r.detail.includes('LOCK THE GAIN')) {
    console.error('RATCHET ACCEPTED HEADROOM — the lock-the-gain branch cannot fail, so it is furniture.');
    process.exit(1);
  }
  console.log('NEGATIVE_CONTROL_OK');
} finally {
  rmSync(dir, { recursive: true, force: true });
}