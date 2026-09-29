#!/usr/bin/env node
/**
 * Negative control for the `govern-self-test` gate.
 *
 * Proves the self-test machinery can detect a furniture gate. Builds a fixture
 * constitution whose negative control exits 0 WITHOUT the proof marker, runs
 * runSelfTest against it, and asserts the gate is flagged as furniture.
 *
 * STRONG CONTRACT: this must exit 0 AND emit NEGATIVE_CONTROL_OK to prove the
 * gate can fail. If the self-test fails to detect furniture, exit 1 — the gate
 * is furniture.
 */
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const { runSelfTest, summarizeSelfTest } = await import(join(here, '../../dist/index.js'));

const dir = mkdtempSync(join(tmpdir(), 'govern-nc-furniture-'));
try {
  // A fixture gate whose negative control does nothing (exits 0, no marker).
  writeFileSync(join(dir, 'nc.mjs'), 'console.log("did nothing");\n');
  const con = {
    schema: 'https://p31ca.org/schemas/govern/constitution/0.3.0.json',
    domain: 'fixture',
    version: '0.0.1',
    genesisTimestamp: new Date().toISOString(),
    canonicalSource: { path: 'x', description: 'x', oqe: { evidenceClass: 'primary-source', reference: 'x' } },
    mirrors: [],
    gates: [{
      id: 'g1', command: 'node x.mjs', state: 'OBSERVATIONAL', owner: 'fixture',
      scope: 'x', remediation: 'runbooks/RUNBOOK-x.md',
      negativeControl: { type: 'fixture', command: join(dir, 'nc.mjs'), expected: 'proof-marker' },
      oqe: { evidenceClass: 'test-suite', reference: 'fixture' },
    }],
    ratchets: [], runbooks: [], lessons: [], fleet: [],
    review: { who: [{ type: 'role', id: 'fixture' }], cadence: 'c', onFailure: 'f', abdication: { afterCleanCycles: 1, requiresHumanSignoff: true } },
    auditLog: { chainName: 'fixture', sink: 'stdout' },
    aspirational: [],
  };
  const results = runSelfTest(con, dir);
  const sum = summarizeSelfTest(results);
  if (sum.ok || sum.furniture.length !== 1) {
    console.error('SELF-TEST FAILED TO DETECT FURNITURE — the meta-gate cannot fail, so it is furniture.');
    process.exit(1);
  }
  console.log('NEGATIVE_CONTROL_OK');
} finally {
  rmSync(dir, { recursive: true, force: true });
}