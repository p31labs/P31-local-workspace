/**
 * reconcile tests — the enterprise timeline operation.
 *
 * Covers: reconcile mirrors a domain's blocks into the enterprise chain (mirror
 * blocks are eventType 'audit' with payload {domain, blockNumber, blockHash});
 * reconcile exits ok when every domain's latest block is mirrored; a domain
 * block missing from the enterprise chain makes the reconcile check report it;
 * reconcile re-run is idempotent.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { reconcile, checkReconciliation } from './reconcile.js';
import { JsonlHashChainSink, type AuditEvent } from './sink.js';

const SCHEMA = 'https://p31ca.org/schemas/govern/constitution/0.3.0.json';

const ev: AuditEvent = {
  domain: 't', schemaVersion: '0.1.0', timestamp: 't', valid: true, violations: [],
  selfTest: { gates: 0, canFail: 0, furniture: [] },
  ratchets: [], floatingNeutrals: [], capacity: null,
};

function writeConstitution(dir: string, domain = 'test') {
  const con = {
    schema: SCHEMA,
    domain,
    version: '0.1.0',
    genesisTimestamp: '2026-09-28T00:00:00.000Z',
    canonicalSource: { path: 'x.ts', description: 't', oqe: { evidenceClass: 'primary-source', reference: 'x.ts' } },
    mirrors: [{ path: 'gen.css', generatedFrom: 'x.ts', parityGate: 'p' }],
    gates: [{
      id: 'g1', command: 'node x.mjs', state: 'OBSERVATIONAL', owner: 't',
      scope: 'x', remediation: 'runbooks/RUNBOOK-test.md',
      negativeControl: { type: 'capability', command: 'nc.mjs', expected: 'proof-marker' },
      oqe: { evidenceClass: 'test-suite', reference: 'g1.test.ts' },
    }],
    ratchets: [],
    runbooks: [],
    lessons: [],
    fleet: [],
    review: {
      who: [{ type: 'did:key', id: 'did:key:z' }],
      cadence: 'c', onFailure: 'f',
      abdication: { afterCleanCycles: 3, requiresHumanSignoff: true },
    },
    auditLog: { chainName: 'test', sink: 'jsonl-hash-chain' },
    aspirational: [],
  };
  writeFileSync(join(dir, 'constitution.json'), JSON.stringify(con, null, 2) + '\n');
}

function writeEnterpriseSpec(dir: string, domain = 'test') {
  const spec = `name: Test Enterprise
version: "0.1.0"
genesisTimestamp: "2026-01-01T00:00:00.000Z"
description: test
domains:
  - { name: ${domain}, ref: ./constitution.json }
interDomainContracts: []
crossCutting:
  identity: { canonicalSource: x, oqe: { evidenceClass: primary-source, reference: x } }
  capacity: { model: spoon-dial, range: [0, 5], contract: c, oqe: { evidenceClass: test-suite, reference: x } }
  audit: { chainName: genesis, sink: jsonl-hash-chain }
review:
  cadence: c
  onFailure: f
  abdication: { afterCleanCycles: 1, requiresHumanSignoff: true }
  fourParty:
    user: { type: role, id: u }
    issuer: { type: role, id: i }
    ledger: { type: system, id: enterprise-genesis-chain }
    court: { type: role, id: c }
`;
  writeFileSync(join(dir, 'enterprise.govern.yaml'), spec);
}

test('reconcile: mirrors a domain chain into the enterprise timeline and exits ok', () => {
  const dir = mkdtempSync(tmpdir() + '/govern-reconcile-');
  writeConstitution(dir);
  const sink = new JsonlHashChainSink(join(dir, '.govern-audit.jsonl'), 'test');
  sink.append(ev); // genesis
  const auditBlock = sink.append(ev); // latest block
  writeEnterpriseSpec(dir);

  const result = reconcile(join(dir, 'enterprise.govern.yaml'));
  assert.equal(result.ok, true);
  assert.equal(result.domains.length, 1);
  assert.equal(result.domains[0].latestBlockNumber, 1);
  assert.equal(result.domains[0].mirrored, true);
  assert.equal(result.domains[0].blocksMirrored, 2);

  // The enterprise chain exists: genesis anchor + 2 mirrors.
  const lines = readFileSync(join(dir, 'enterprise-audit.jsonl'), 'utf8').trim().split('\n');
  assert.equal(lines.length, 3);
  // Mirror blocks are eventType 'audit' with {domain, blockNumber, blockHash}.
  for (const line of lines.slice(1)) {
    const b = JSON.parse(line);
    assert.equal(b.eventType, 'audit');
    assert.deepEqual(Object.keys(b.payload), ['domain', 'blockNumber', 'blockHash']);
  }
  // The latest domain block is mirrored.
  assert.ok(lines.some((l) => JSON.parse(l).payload.blockHash === auditBlock.currentHash));
  rmSync(dir, { recursive: true, force: true });
});

test('reconcile: a domain block missing from the enterprise chain makes the reconcile CHECK report it', () => {
  const dir = mkdtempSync(tmpdir() + '/govern-reconcile-orphan-');
  writeConstitution(dir);
  const sink = new JsonlHashChainSink(join(dir, '.govern-audit.jsonl'), 'test');
  sink.append(ev); // genesis
  writeEnterpriseSpec(dir);

  // Fully reconcile once.
  assert.equal(reconcile(join(dir, 'enterprise.govern.yaml')).ok, true);

  // A fresh audit writes a NEW block to the domain chain (not yet mirrored).
  const orphanBlock = sink.append(ev);
  const check = checkReconciliation(join(dir, 'enterprise.govern.yaml'));
  assert.equal(check.ok, false);
  assert.equal(check.domains[0].mirrored, false);
  assert.ok((check.domains[0].error ?? '').includes('not mirrored'));

  // Re-running reconcile mirrors it and returns ok.
  const again = reconcile(join(dir, 'enterprise.govern.yaml'));
  assert.equal(again.ok, true);
  assert.equal(again.domains[0].blocksMirrored, 1);
  assert.equal(checkReconciliation(join(dir, 'enterprise.govern.yaml')).ok, true);

  // The orphan block is now present in the enterprise chain.
  const lines = readFileSync(join(dir, 'enterprise-audit.jsonl'), 'utf8').trim().split('\n');
  assert.ok(lines.some((l) => JSON.parse(l).payload.blockHash === orphanBlock.currentHash));
  rmSync(dir, { recursive: true, force: true });
});

test('reconcile: a missing/unreadable domain chain is reported (not ok)', () => {
  const dir = mkdtempSync(tmpdir() + '/govern-reconcile-missing-');
  writeConstitution(dir);
  // No .govern-audit.jsonl written → chain missing.
  writeEnterpriseSpec(dir);

  const result = reconcile(join(dir, 'enterprise.govern.yaml'));
  assert.equal(result.ok, false);
  assert.equal(result.domains[0].mirrored, false);
  assert.ok((result.domains[0].error ?? '').includes('domain chain missing or unreadable'));
  rmSync(dir, { recursive: true, force: true });
});