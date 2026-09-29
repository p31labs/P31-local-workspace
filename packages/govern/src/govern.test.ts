/**
 * Runtime tests — the runtime tested by a committed suite, not ad-hoc runs.
 * Covers: validation (schema URI, lessons ID-resolution, OQE, four-party K4 at
 * BLOCKING), the ratchet lock-the-gain branch, the Genesis Block hash-chain
 * sink, the self-test furniture detection, the floating-neutral diagnose, and
 * abdication eligibility + human sign-off.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { validateConstitution, validateConstitutionAt } from './constitution.js';
import { JsonlHashChainSink } from './sink.js';
import { runRatchets } from './ratchet.js';
import { runSelfTest, summarizeSelfTest } from './self-test.js';
import { diagnose } from './diagnose.js';
import { abdicate, abdicationState } from './abdicate.js';
import { generate, specToConstitution } from './generate.js';
import { compose } from './compose.js';
import { CompositeSink } from './sink.js';

const SCHEMA = 'https://p31ca.org/schemas/govern/constitution/0.3.0.json';

const FOUR_PARTY = {
  user: { type: 'did:key' as const, id: 'did:key:u' },
  issuer: { type: 'did:key' as const, id: 'did:key:i' },
  ledger: { type: 'system' as const, id: 'genesis-chain' },
  court: { type: 'did:key' as const, id: 'did:key:c' },
};

const base = {
  schema: SCHEMA,
  domain: 'test',
  version: '0.1.0',
  genesisTimestamp: '2026-09-28T00:00:00.000Z',
  canonicalSource: { path: 'x.ts', description: 'test', oqe: { evidenceClass: 'primary-source' as const, reference: 'x.ts' } },
  mirrors: [{ path: 'gen.css', generatedFrom: 'x.ts', parityGate: 'p' }],
  gates: [{
    id: 'g1', command: 'node x.mjs', state: 'OBSERVATIONAL' as const, owner: 't',
    scope: 'x', remediation: 'runbooks/RUNBOOK-test.md',
    negativeControl: { type: 'capability' as const, command: 'nc.mjs', expected: 'proof-marker' as const },
    oqe: { evidenceClass: 'test-suite' as const, reference: 'g1.test.ts' },
  }],
  ratchets: [],
  runbooks: [],
  lessons: [],
  fleet: [],
  review: {
    who: [{ type: 'did:key' as const, id: 'did:key:z' }],
    cadence: 'c',
    onFailure: 'f',
    abdication: { afterCleanCycles: 3, requiresHumanSignoff: true as const },
  },
  auditLog: { chainName: 'genesis', sink: 'jsonl-hash-chain' as const },
  aspirational: [],
};

test('validate: schema URI must be version-in-URI', () => {
  const bad = { ...base, schema: 'https://p31ca.org/schemas/govern/constitution.schema.json' };
  const r = validateConstitution(bad);
  assert.equal(r.valid, false);
  assert.ok(r.violations.some((v) => v.includes('schema')));
});

test('validate: genesisTimestamp required (the domain Genesis Gate)', () => {
  const bad = { ...base };
  delete (bad as { genesisTimestamp?: string }).genesisTimestamp;
  const r = validateConstitution(bad);
  assert.equal(r.valid, false);
  assert.ok(r.violations.some((v) => v.includes('genesisTimestamp')));
});

test('validate: OQE required on gates (a claim without evidence is aspirational)', () => {
  const bad = { ...base, gates: [{ ...base.gates[0], oqe: undefined as never }] };
  const r = validateConstitution(bad);
  assert.equal(r.valid, false);
  assert.ok(r.violations.some((v) => v.includes('oqe')));
});

test('validate: a BLOCKING domain requires the four-party K4 review', () => {
  const blockingSingleOwner = { ...base, gates: [{ ...base.gates[0], state: 'BLOCKING' as const }] };
  const r = validateConstitution(blockingSingleOwner);
  assert.equal(r.valid, false);
  assert.ok(r.violations.some((v) => v.includes('four-party')));

  const blockingFourParty = {
    ...base,
    gates: [{ ...base.gates[0], state: 'BLOCKING' as const }],
    review: { ...base.review, who: FOUR_PARTY },
  };
  assert.equal(validateConstitution(blockingFourParty).valid, true);
});

test('validate: OBSERVATIONAL may keep a single review credential (bootstrap)', () => {
  assert.equal(validateConstitution(base).valid, true);
});

test('validate: lesson prevention must resolve to an EXISTING id', () => {
  const withRunbook = { ...base, runbooks: [{ id: 'RUNBOOK-real', path: 'runbooks/RUNBOOK-real.md', owner: 'o', lastVerified: '2026-09-28' }] };
  const ok = validateConstitution({
    ...withRunbook,
    lessons: [{ id: 'L-1', rootCause: 'c', prevention: 'RUNBOOK-real', oqe: { evidenceClass: 'primary-source' as const, reference: 'x' } }],
  });
  assert.equal(ok.valid, true);

  const bad = validateConstitution({
    ...base,
    lessons: [{ id: 'L-1', rootCause: 'c', prevention: 'gate:nonexistent', oqe: { evidenceClass: 'primary-source' as const, reference: 'x' } }],
  });
  assert.equal(bad.valid, false);
  assert.ok(bad.violations.some((v) => v.includes('EXISTING')));
});

test('validateAt: a runbook reference to a missing file fails (closes green-by-syntax)', () => {
  
  const dir = mkdtempSync(tmpdir() + '/govern-validateat-');
  // Constitution with a runbook + gate remediation pointing at a file that does not exist.
  const con = {
    ...base,
    runbooks: [{ id: 'RUNBOOK-real', path: 'runbooks/RUNBOOK-real.md', owner: 'o', lastVerified: '2026-09-28' }],
    gates: [{ ...base.gates[0], remediation: 'runbooks/RUNBOOK-real.md' }],
  };
  writeFileSync(dir + '/con.json', JSON.stringify(con));
  const r = validateConstitutionAt(dir + '/con.json');
  assert.equal(r.valid, false);
  assert.ok(r.violations.some((v) => v.includes('file not found')));

  // Now create the file — validation passes.
  mkdirSync(dir + '/runbooks', { recursive: true });
  writeFileSync(dir + '/runbooks/RUNBOOK-real.md', '# runbook\n');
  const ok = validateConstitutionAt(dir + '/con.json');
  assert.equal(ok.valid, true);
  rmSync(dir, { recursive: true, force: true });
});

test('validateAt: resolutionRoot redirects runbook resolution', () => {
  
  const dir = mkdtempSync(tmpdir() + '/govern-resroot-');
  const libDir = dir + '/lib';
  mkdirSync(libDir + '/runbooks', { recursive: true });
  writeFileSync(libDir + '/runbooks/RUNBOOK-real.md', '# runbook\n');
  const con = {
    ...base,
    resolutionRoot: 'lib', // relative to the constitution's dir (dir/)
    runbooks: [{ id: 'RUNBOOK-real', path: 'runbooks/RUNBOOK-real.md', owner: 'o', lastVerified: '2026-09-28' }],
    gates: [{ ...base.gates[0], remediation: 'runbooks/RUNBOOK-real.md' }],
  };
  writeFileSync(dir + '/con.json', JSON.stringify(con));
  const r = validateConstitutionAt(dir + '/con.json');
  assert.equal(r.valid, true);
  rmSync(dir, { recursive: true, force: true });
});

test('ratchet: lock-the-gain must fail when headroom exceeds threshold', () => {
  const dir = mkdtempSync(tmpdir() + '/govern-ratchet-');
  writeFileSync(dir + '/count.mjs', 'console.log(2);\n'); // emits current=2
  const con = { ...base, ratchets: [{ id: 'r', baseline: 15, countSource: 'count.mjs', lockThreshold: 2 }] };
  const results = runRatchets(con, dir);
  const r = results.find((x) => x.id === 'r');
  assert.equal(r?.ok, false);
  assert.ok(r?.detail.includes('LOCK THE GAIN'));
  rmSync(dir, { recursive: true, force: true });
});

test('ratchet: growth above baseline must fail', () => {
  const dir = mkdtempSync(tmpdir() + '/govern-ratchet-growth-');
  writeFileSync(dir + '/count.mjs', 'console.log(20);\n');
  const con = { ...base, ratchets: [{ id: 'r', baseline: 15, countSource: 'count.mjs', lockThreshold: 2 }] };
  const results = runRatchets(con, dir);
  const r = results.find((x) => x.id === 'r');
  assert.equal(r?.ok, false);
  assert.ok(r?.detail.includes('GROWTH'));
  rmSync(dir, { recursive: true, force: true });
});

test('sink: Genesis Block hash chain — block 0 is genesis with 64-zero prevHash', () => {
  const dir = mkdtempSync(tmpdir() + '/govern-sink-');
  const sink = new JsonlHashChainSink(dir + '/genesis.jsonl', 'genesis');
  const ev = {
    domain: 't', schemaVersion: '0.1.0', timestamp: 't', valid: true, violations: [],
    selfTest: { gates: 0, canFail: 0, furniture: [] },
    ratchets: [], floatingNeutrals: [], capacity: null,
  };
  const b0 = sink.append(ev);
  assert.equal(b0.blockNumber, 0);
  assert.equal(b0.eventType, 'genesis');
  assert.equal(b0.prevHash, '0'.repeat(64));
  assert.equal(b0.currentHash.length, 64);

  const b1 = sink.append(ev);
  assert.equal(b1.blockNumber, 1);
  assert.equal(b1.eventType, 'audit');
  assert.equal(b1.prevHash, b0.currentHash);

  const lines = readFileSync(dir + '/genesis.jsonl', 'utf8').trim().split('\n');
  assert.equal(lines.length, 2);
  assert.equal(JSON.parse(lines[0]).currentHash, b0.currentHash);
  assert.equal(JSON.parse(lines[1]).prevHash, b0.currentHash);
  rmSync(dir, { recursive: true, force: true });
});

test('self-test: a furniture gate (negative control exits 0 without marker) must be detected', () => {
  const dir = mkdtempSync(tmpdir() + '/govern-nc-');
  writeFileSync(dir + '/nc.mjs', 'console.log("did nothing");\n');
  const con = { ...base, gates: [{ ...base.gates[0], negativeControl: { type: 'capability' as const, command: 'nc.mjs', expected: 'proof-marker' as const } }] };
  const results = runSelfTest(con, dir);
  const sum = summarizeSelfTest(results);
  assert.equal(sum.ok, false);
  assert.deepEqual(sum.furniture, ['g1']);
  rmSync(dir, { recursive: true, force: true });
});

test('self-test: a WORKING negative control (exits 0 + marker) is proven', () => {
  const dir = mkdtempSync(tmpdir() + '/govern-nc-ok-');
  writeFileSync(dir + '/nc.mjs', 'console.log("NEGATIVE_CONTROL_OK");\n');
  const con = { ...base, gates: [{ ...base.gates[0], negativeControl: { type: 'capability' as const, command: 'nc.mjs', expected: 'proof-marker' as const } }] };
  const results = runSelfTest(con, dir);
  const sum = summarizeSelfTest(results);
  assert.equal(sum.ok, true);
  assert.deepEqual(sum.furniture, []);
  rmSync(dir, { recursive: true, force: true });
});

test('diagnose: a single-owner review is a floating-neutral (Wye) risk', () => {
  const risks = diagnose(base);
  assert.ok(risks.some((r) => r.primitive === 'review.who'));
  assert.ok(risks.every((r) => r.remediation.includes('Wye → Delta')));
});

test('diagnose: four-party review + mirrors + >1 gate clears the Wye flags', () => {
  const resilient = {
    ...base,
    mirrors: [{ path: 'gen.css', generatedFrom: 'x.ts', parityGate: 'p' }],
    gates: [
      { ...base.gates[0], id: 'g1', state: 'BLOCKING' as const },
      { ...base.gates[0], id: 'g2', state: 'BLOCKING' as const },
    ],
    review: { ...base.review, who: FOUR_PARTY },
  };
  const risks = diagnose(resilient);
  assert.ok(!risks.some((r) => r.primitive === 'review.who'));
  assert.ok(!risks.some((r) => r.primitive === 'gates'));
  assert.ok(!risks.some((r) => r.primitive === 'canonicalSource'));
});

test('abdicate: eligibility requires N clean cycles; sign-off is mandatory', () => {
  const stateNotEligible = abdicationState(base, 2);
  assert.equal(stateNotEligible.eligible, false);

  const stateEligible = abdicationState(base, 3);
  assert.equal(stateEligible.eligible, true);

  const noSignoff = abdicate(base, 3, '');
  assert.equal(noSignoff.ok, false);
  assert.ok(noSignoff.note.includes('human sign-off'));

  const signed = abdicate(base, 3, 'p31@labs');
  assert.equal(signed.ok, true);
  assert.ok(signed.note.includes('abdicated'));
});

test('generate: spec → constitution is conformant + honest (OBSERVATIONAL gates, stub NCs)', () => {
  const dir = mkdtempSync(tmpdir() + '/govern-generate-');
  const spec = {
    domain: 'gen',
    version: '0.1.0',
    description: 'test',
    genesisTimestamp: '2026-09-29T00:00:00.000Z',
    canonicalSource: { path: 'x.ts', description: 'x', oqe: { evidenceClass: 'primary-source' as const, reference: 'x.ts' } },
    mirrors: [{ path: 'y', generatedFrom: 'x', parityGate: 'p' }],
    gates: [{
      id: 'g1', description: 'd', command: 'node x.mjs', scope: 's',
      owner: [{ type: 'role' as const, id: 'o' }],
      remediation: 'runbooks/RUNBOOK-g1.md',
      oqe: { evidenceClass: 'test-suite' as const, reference: 't' },
      generateRunbook: true, generateNegativeControl: true,
    }],
    review: {
      cadence: 'c', onFailure: 'f',
      abdication: { afterCleanCycles: 1, requiresHumanSignoff: true as const },
      singleOwner: [{ type: 'role' as const, id: 'o' }],
    },
  };
  const result = generate(spec, { targetDir: dir, writeRunbooks: true, writeNegativeControls: true });
  assert.ok(result.files.includes(dir + '/constitution.json'));
  const con = JSON.parse(readFileSync(dir + '/constitution.json', 'utf8'));
  assert.equal(validateConstitution(con).valid, true);
  assert.equal(con.gates[0].state, 'OBSERVATIONAL');
  // The NC stub must be a failing stub — the generated gate is furniture.
  const ncContent = readFileSync(dir + '/scripts/nc/g1.mjs', 'utf8');
  assert.ok(ncContent.includes('STUB_NOT_IMPLEMENTED'));
  assert.ok(ncContent.includes('process.exit(1)'));
  // And self-test must catch it as furniture (declared, not governed).
  const results = runSelfTest(con, dir);
  assert.equal(summarizeSelfTest(results).ok, false);
  rmSync(dir, { recursive: true, force: true });
});

test('generate: a BLOCKING gate without four-party review is refused at generation time', () => {
  const spec = {
    domain: 'gen', version: '0.1.0', description: 't', genesisTimestamp: 't',
    canonicalSource: { path: 'x', description: 'x', oqe: { evidenceClass: 'primary-source' as const, reference: 'x' } },
    mirrors: [], gates: [{
      id: 'g1', description: 'd', command: 'c', scope: 's',
      owner: [{ type: 'role' as const, id: 'o' }],
      remediation: 'runbooks/RUNBOOK-g1.md', state: 'BLOCKING' as const,
      oqe: { evidenceClass: 'test-suite' as const, reference: 't' },
    }],
    review: {
      cadence: 'c', onFailure: 'f',
      abdication: { afterCleanCycles: 1, requiresHumanSignoff: true as const },
      singleOwner: [{ type: 'role' as const, id: 'o' }],
    },
  };
  assert.throws(() => specToConstitution(spec), /four-party/);
});

test('compose: a contract on a non-BLOCKING provider gate is refused', () => {
  const dir = mkdtempSync(tmpdir() + '/govern-compose-');
  const domainCon = JSON.parse(JSON.stringify(base));
  writeFileSync(dir + '/dom.json', JSON.stringify(domainCon, null, 2)); // g1 is OBSERVATIONAL
  const spec = {
    name: 'ent', version: '0.1.0', genesisTimestamp: 't', description: 't',
    domains: [{ name: 'test', ref: './dom.json' }],
    interDomainContracts: [{
      id: 'c1', provider: 'test', consumers: [], guarantee: 'g',
      evidence: { evidenceClass: 'test-suite' as const, reference: 'x' },
      gate: 'g1', // g1 is OBSERVATIONAL in the domain constitution
    }],
    crossCutting: {
      identity: { canonicalSource: 'x', oqe: { evidenceClass: 'primary-source' as const, reference: 'x' } },
      capacity: { model: 'spoon-dial' as const, range: [0, 5] as [number, number], contract: 'c', oqe: { evidenceClass: 'test-suite' as const, reference: 'x' } },
      audit: { chainName: 'genesis', sink: 'jsonl-hash-chain' as const },
    },
    review: {
      cadence: 'c', onFailure: 'f',
      abdication: { afterCleanCycles: 1, requiresHumanSignoff: true as const },
      fourParty: { user: { type: 'role' as const, id: 'u' }, issuer: { type: 'role' as const, id: 'i' }, ledger: { type: 'system' as const, id: 'l' }, court: { type: 'role' as const, id: 'c' } },
    },
  };
  const result = compose(spec, dir);
  assert.ok(result.contractViolations.some((v) => v.includes('not BLOCKING')));
  assert.equal(result.enterpriseConstitution.gates[0].state, 'BLOCKING');
  rmSync(dir, { recursive: true, force: true });
});

test('CompositeSink: writes the same event to every sink (enterprise timeline)', () => {
  const dir = mkdtempSync(tmpdir() + '/govern-composite-');
  const a = new JsonlHashChainSink(dir + '/a.jsonl', 'a');
  const b = new JsonlHashChainSink(dir + '/b.jsonl', 'b');
  const composite = new CompositeSink(a, b);
  const ev = {
    domain: 't', schemaVersion: '0.1.0', timestamp: 't', valid: true, violations: [],
    selfTest: { gates: 0, canFail: 0, furniture: [] },
    ratchets: [], floatingNeutrals: [], capacity: null,
  };
  composite.append(ev);
  const linesA = readFileSync(dir + '/a.jsonl', 'utf8').trim().split('\n');
  const linesB = readFileSync(dir + '/b.jsonl', 'utf8').trim().split('\n');
  assert.equal(linesA.length, 1);
  assert.equal(linesB.length, 1);
  assert.equal(JSON.parse(linesA[0]).currentHash, JSON.parse(linesB[0]).currentHash);
  rmSync(dir, { recursive: true, force: true });
});