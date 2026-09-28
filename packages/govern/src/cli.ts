#!/usr/bin/env node
/**
 * govern CLI — the P31 universal governance runtime interface.
 *
 *   govern validate <constitution.json>          validate a domain constitution
 *   govern self-test <constitution.json> <dir>   run every gate's negative control
 *   govern ratchet <constitution.json> <dir>     run every ratchet
 *   govern audit <constitution.json> <dir>       full pass: validate + self-test + ratchets
 *   govern init <domain>                         scaffold a conformant empty constitution
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateConstitution, loadConstitution } from './constitution.js';
import { runSelfTest, summarizeSelfTest } from './self-test.js';
import { runRatchets } from './ratchet.js';
import { buildAuditEvent } from './audit.js';

const [, , cmd, arg1, arg2] = process.argv;

function fail(msg: string, code = 1): never {
  console.error(`✗ ${msg}`);
  process.exit(code);
}

if (!cmd || !arg1) {
  console.log('Usage: govern <validate|self-test|ratchet|audit|init> <args>');
  process.exit(0);
}

switch (cmd) {
  case 'validate': {
    const con = loadConstitution(arg1);
    const r = validateConstitution(con);
    if (!r.valid) fail(`constitution ${arg1} invalid:\n  ${r.violations.join('\n  ')}`);
    console.log(`✅ constitution ${con.domain}@${con.version} valid.`);
    break;
  }
  case 'self-test': {
    const con = loadConstitution(arg1);
    const results = runSelfTest(con, arg2 ?? '.');
    const sum = summarizeSelfTest(results);
    for (const r of results) {
      console.log(`  ${r.canFail ? '✓' : '✗'} ${r.gate}: ${r.detail} (${r.ms}ms)`);
    }
    if (!sum.ok) fail(`${sum.furniture.length} gate(s) are furniture.`);
    console.log(`✅ self-test: ${results.length} gates proven able to fail.`);
    break;
  }
  case 'ratchet': {
    const con = loadConstitution(arg1);
    const results = runRatchets(con, arg2 ?? '.');
    for (const r of results) console.log(`  ${r.ok ? '✓' : '✗'} ratchet ${r.id}: ${r.detail}`);
    if (results.some((r) => !r.ok)) fail('ratchet violation');
    console.log(`✅ ratchets: ${results.length} enforced.`);
    break;
  }
  case 'audit': {
    const con = loadConstitution(arg1);
    const validation = validateConstitution(con);
    const results = runSelfTest(con, arg2 ?? '.');
    const sum = summarizeSelfTest(results);
    const ratchets = runRatchets(con, arg2 ?? '.');
    const audit = buildAuditEvent(con, validation, { gates: results.length, canFail: results.filter((r) => r.canFail).length, furniture: sum.furniture }, ratchets);
    console.log(JSON.stringify(audit, null, 2));
    if (!audit.valid || audit.selfTest.furniture.length > 0 || ratchets.some((r) => !r.ok)) fail('govern audit FAILED');
    console.log(`✅ audit: ${con.domain} governed.`);
    break;
  }
  case 'init': {
    const domain = arg1;
    const con = {
      schema: 'https://p31ca.org/schemas/govern/constitution.schema.json',
      domain,
      version: '0.1.0',
      canonicalSource: { path: '', description: `the canonical source for ${domain}` },
      mirrors: [],
      gates: [],
      ratchets: [],
      runbooks: [],
      lessons: [],
      fleet: [],
      review: { who: '', artifact: `runbooks/RUNBOOK-${domain}.md`, cadence: '', onFailure: '' },
    };
    mkdirSync(domain, { recursive: true });
    const out = resolve(domain, 'constitution.json');
    writeFileSync(out, JSON.stringify(con, null, 2) + '\n');
    console.log(`✅ scaffolded empty constitution for domain "${domain}" at ${out}.`);
    console.log('  Fill canonicalSource, add gates (each with a negativeControl), then `govern audit`.');
    break;
  }
  default:
    fail(`unknown command: ${cmd}`);
}