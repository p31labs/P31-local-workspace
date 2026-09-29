#!/usr/bin/env node
/**
 * govern CLI — the P31 universal governance runtime interface.
 *
 *   govern validate <constitution.json>                     does the domain conform to the schema?
 *   govern self-test <constitution.json>                    every gate proves it can fail
 *   govern ratchet <constitution.json>                      every ratchet is enforced
 *   govern audit <constitution.json> [--capacity N]         full pass → structured audit event (Genesis Block)
 *   govern diagnose <constitution.json>                     flag floating-neutral (Wye) topologies
 *   govern abdicate <constitution.json> <cycles> [signoff]  review cadence terminal state (human sign-off)
 *   govern init <domain> [targetDir]                        scaffold a conformant empty constitution
 *   govern compose <enterprise.yaml>                        compose the enterprise constitution
 *   govern reconcile <enterprise.yaml>                      mirror domain chains into the enterprise timeline
 *
 * The runtime is portable: relative paths resolve against the constitution's
 * directory (constitutionRoot), never against a hardcoded /home/p31/...
 */
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { loadConstitution, validateConstitutionAt, constitutionRoot } from './constitution.js';
import { govern } from './index.js';
import { diagnose } from './diagnose.js';
import { abdicate, abdicationState } from './abdicate.js';
import { generate } from './generate.js';
import { compose } from './compose.js';
import { reconcile } from './reconcile.js';
import { loadSpecFromYaml, loadEnterpriseFromYaml } from './spec-yaml.js';

const [, , cmd, ...rest] = process.argv;

function fail(msg: string, code = 1): never {
  console.error(`✗ ${msg}`);
  process.exit(code);
}

if (!cmd) {
  console.log('Usage: govern <validate|self-test|ratchet|audit|diagnose|abdicate|init|compose|reconcile> <constitution.json|enterprise.yaml> [args]');
  process.exit(0);
}

switch (cmd) {
  case 'validate': {
    const path = rest[0];
    if (!path) fail('validate: missing constitution path');
    const r = validateConstitutionAt(path);
    if (!r.valid) fail(`constitution ${path} invalid:\n  ${r.violations.join('\n  ')}`);
    const c = loadConstitution(path);
    console.log(`✅ constitution ${c.domain}@${c.version} valid (schema ${c.schema}).`);
    break;
  }

  case 'self-test': {
    const path = rest[0];
    if (!path) fail('self-test: missing constitution path');
    const con = loadConstitution(path);
    const { selfTestResults, audit } = govern(path);
    for (const r of selfTestResults) {
      console.log(`  ${r.canFail ? '✓' : '✗'} ${r.gate}: ${r.detail ?? ''} (${r.ms}ms)`);
    }
    if (audit.selfTest.furniture.length > 0) {
      fail(`self-test: ${audit.selfTest.furniture.join(', ')} gate(s) are furniture.`);
    }
    console.log(`✅ self-test: ${audit.selfTest.canFail}/${audit.selfTest.gates} gates proven able to fail.`);
    break;
  }

  case 'ratchet': {
    const path = rest[0];
    if (!path) fail('ratchet: missing constitution path');
    const con = loadConstitution(path);
    const { audit } = govern(path);
    for (const r of audit.ratchets) console.log(`  ${r.ok ? '✓' : '✗'} ratchet ${r.id}: ${r.detail}`);
    if (audit.ratchets.some((r) => !r.ok)) fail('ratchet violation');
    console.log(`✅ ratchets: ${audit.ratchets.length} enforced.`);
    break;
  }

  case 'audit': {
    const path = rest[0];
    if (!path) fail('audit: missing constitution path');
    let capacity: number | null = null;
    const capIdx = rest.indexOf('--capacity');
    if (capIdx !== -1) {
      capacity = Number(rest[capIdx + 1]);
      if (Number.isNaN(capacity) || capacity < 0 || capacity > 5) {
        fail('audit: --capacity must be an integer 0-5 (the spoon dial)');
      }
    }
    const con = loadConstitution(path);
    const { audit, block, floatingNeutrals } = govern(path, capacity);
    console.log(JSON.stringify(audit, null, 2));
    if (floatingNeutrals.length > 0) {
      console.log(`\n⚠ floating-neutral (Wye topology) risks:`);
      for (const f of floatingNeutrals) console.log(`  - ${f.primitive}: ${f.detail}`);
    }
    console.log(`\n  (Genesis Block #${block.blockNumber} on chain "${con.auditLog.chainName}" → ${block.currentHash.slice(0, 16)}…)`);
    if (!audit.valid) fail('govern audit FAILED');
    console.log(`✅ audit: ${con.domain} governed.`);
    break;
  }

  case 'diagnose': {
    const path = rest[0];
    if (!path) fail('diagnose: missing constitution path');
    const con = loadConstitution(path);
    const risks = diagnose(con);
    if (risks.length === 0) {
      console.log(`✅ ${con.domain}: no floating-neutral risks (Delta topology).`);
      break;
    }
    console.log(`⚠ ${con.domain}: ${risks.length} floating-neutral risk(s) — Wye topology:`);
    for (const r of risks) {
      console.log(`  - ${r.primitive}: ${r.detail}`);
      console.log(`    remediation: ${r.remediation}`);
    }
    fail(`diagnose: ${risks.length} floating-neutral risk(s)`);
    break;
  }

  case 'abdicate': {
    const path = rest[0];
    if (!path) fail('abdicate: missing constitution path');
    const cycles = Number(rest[1]);
    if (Number.isNaN(cycles)) fail('abdicate: second arg must be the clean cycle count');
    const con = loadConstitution(path);
    const state = abdicationState(con, cycles);
    console.log(`  ${con.domain}: ${state.note}`);
    if (!state.eligible) break;
    const signoff = rest[2];
    const result = abdicate(con, cycles, signoff);
    if (!result.ok) fail(result.note);
    console.log(`✅ ${result.note}`);
    break;
  }

  case 'init': {
    const domain = rest[0];
    if (!domain) fail('init: missing domain name');
    if (!rest[1]) {
      fail('init: a target directory is REQUIRED (blast-radius rule) — a scaffold written to the runtime CWD is a config blast-radius hazard. Usage: govern init <domain> <targetDir>');
    }
    const target = resolve(rest[1]);
    const now = new Date().toISOString();
    const con = {
      schema: 'https://p31ca.org/schemas/govern/constitution/0.3.0.json',
      domain,
      version: '0.1.0',
      genesisTimestamp: now,
      canonicalSource: { path: '', description: `the canonical source for ${domain}`, oqe: { evidenceClass: 'primary-source', reference: '' } },
      mirrors: [],
      gates: [],
      ratchets: [],
      runbooks: [],
      lessons: [],
      fleet: [],
      review: {
        who: [{ type: 'did:key', id: '' }],
        cadence: 'monthly',
        onFailure: 'demote the affected gate to OBSERVATIONAL until the failure is understood',
        abdication: { afterCleanCycles: 12, requiresHumanSignoff: true },
      },
      auditLog: { chainName: domain, sink: 'jsonl-hash-chain' },
      aspirational: [],
    };
    const out = resolve(target, `${domain}.constitution.json`);
    writeFileSync(out, JSON.stringify(con, null, 2) + '\n');
    console.log(`✅ scaffolded empty constitution for domain "${domain}" at ${out}.`);
    console.log('  Fill canonicalSource + oqe, add gates (each with a negativeControl + oqe), then `govern audit`.');
    break;
  }

  case 'generate': {
    const specPath = rest[0];
    if (!specPath) fail('generate: missing spec path');
    const targetIdx = rest.indexOf('--target');
    const target = targetIdx !== -1 ? rest[targetIdx + 1] : dirname(specPath);
    const spec = loadSpecFromYaml(specPath);
    const result = generate(spec, {
      targetDir: target,
      dryRun: rest.includes('--dry-run'),
      writeRunbooks: !rest.includes('--no-runbooks'),
      writeNegativeControls: !rest.includes('--no-ncs'),
      writeTests: !rest.includes('--no-tests'),
    });
    console.log(`✅ generated ${result.files.length} files from ${spec.domain}:`);
    for (const f of result.files) console.log(`   ${f}`);
    console.log(`\n  Constitution: ${result.constitutionPath}`);
    console.log(`  Next: govern validate ${result.constitutionPath}`);
    console.log(`  Note: generated gates are OBSERVATIONAL; NCs are stubs that fail.`);
    console.log(`        The domain is DECLARED, not governed, until the NCs are real.`);
    break;
  }

  case 'compose': {
    const specPath = rest[0];
    if (!specPath) fail('compose: missing enterprise spec path');
    const spec = loadEnterpriseFromYaml(specPath);
    const result = compose(spec, dirname(specPath));
    writeFileSync(resolve(dirname(specPath), 'enterprise-constitution.json'), JSON.stringify(result.enterpriseConstitution, null, 2) + '\n');
    writeFileSync(resolve(dirname(specPath), 'compliance.md'), result.complianceMarkdown);
    console.log(`✅ composed ${spec.name}@${spec.version}`);
    console.log(`   domains: ${result.domainAudits.length}`);
    console.log(`   contracts: ${spec.interDomainContracts.length}`);
    console.log(`   domain audits: ${result.domainAudits.filter((d) => d.valid).length}/${result.domainAudits.length} valid`);
    if (result.contractViolations.length) {
      console.error(`\n✗ ${result.contractViolations.length} contract violation(s):`);
      for (const v of result.contractViolations) console.error(`   - ${v}`);
      process.exit(1);
    }
    console.log(`   enterprise constitution: ${resolve(dirname(specPath), 'enterprise-constitution.json')}`);
    console.log(`   compliance: ${resolve(dirname(specPath), 'compliance.md')}`);
    break;
  }

  case 'reconcile': {
    const specPath = rest[0];
    if (!specPath) fail('reconcile: missing enterprise spec path');
    const result = reconcile(specPath);
    console.log(`reconcile ${specPath} → ${result.enterpriseChainPath}`);
    for (const d of result.domains) {
      const status = d.error
        ? `✗ ${d.error}`
        : d.mirrored
          ? 'mirrored'
          : '✗ NOT mirrored';
      const mirrorNote = d.blocksMirrored > 0 ? `(+${d.blocksMirrored} mirror block${d.blocksMirrored === 1 ? '' : 's'})` : '';
      console.log(`   ${d.name}: latest block #${d.latestBlockNumber ?? '—'} ${mirrorNote} ${status}`);
    }
    if (!result.ok) fail('reconcile: not fully reconciled');
    console.log('✅ enterprise timeline reconciled.');
    break;
  }

  default:
    fail(`unknown command: ${cmd}`);
}