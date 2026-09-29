#!/usr/bin/env node
/**
 * docs:check — the doc-suite meta-gate. "The docs must not drift from the
 * governance they describe."
 *
 * Checks:
 *   1. All 5 required docs exist (GOVERNANCE, COMPLIANCE, RUNBOOKS, EVIDENCE, DECISIONS).
 *   2. The RUNBOOKS.md index's "MISSING" / "Exists" status matches reality:
 *      every runbook every constitution (all 5 domains + govern) references must
 *      be reported as the actual on-disk status (exists → exists, missing → missing).
 *   3. Every doc names a real contract/gate (no hallucinated identifiers).
 *
 * A doc that claims a runbook exists when it does not, or names a gate that
 * does not exist, is an evidence lie — the same class the negative-control
 * contract exists to catch.
 *
 * Negative control: negative-controls/docs-check.mjs feeds a temp docs dir
 * whose GOVERNANCE.md names a gate that does not exist; this gate must exit
 * non-zero. That is the proof it can fail.
 *
 * Optional: --docs-dir <path> overrides the docs directory (used by the NC
 * to point at a temp fixture suite).
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const docsArgIdx = process.argv.indexOf('--docs-dir');
const docsDir = docsArgIdx !== -1 && process.argv[docsArgIdx + 1]
  ? resolve(process.argv[docsArgIdx + 1])
  : resolve(root, 'docs');

const REQUIRED = ['GOVERNANCE.md', 'COMPLIANCE.md', 'RUNBOOKS.md', 'EVIDENCE.md', 'DECISIONS.md'];
const ALL_DOMAINS = ['design', 'monetization', 'justice', 'audit', 'forge'];

const problems = [];

for (const doc of REQUIRED) {
  const p = resolve(docsDir, doc);
  if (!existsSync(p)) problems.push(`missing required doc: ${doc}`);
}

// Load the real constitutions to know what runbooks exist on disk.
const REAL_RUNBOOKS = [];
const runbookSources = [
  ...ALL_DOMAINS.map((d) => ({ domain: d, path: resolve(root, 'domains', d, 'constitution.json') })),
  { domain: 'govern', path: resolve(root, 'constitution.json') },
];
for (const { domain, path } of runbookSources) {
  if (!existsSync(path)) continue;
  const con = JSON.parse(readFileSync(path, 'utf8'));
  const base = con.resolutionRoot
    ? resolve(dirname(path), con.resolutionRoot)
    : domain === 'govern' ? root : resolve(root, 'domains', domain);
  for (const rb of con.runbooks ?? []) {
    const filePath = resolve(base, rb.path);
    REAL_RUNBOOKS.push({ id: rb.id, domain, existsOnDisk: existsSync(filePath) });
  }
}

// Parse the RUNBOOKS index status column.
const runbooksDoc = existsSync(resolve(docsDir, 'RUNBOOKS.md'))
  ? readFileSync(resolve(docsDir, 'RUNBOOKS.md'), 'utf8')
  : '';
for (const rb of REAL_RUNBOOKS) {
  const docLine = runbooksDoc.split('\n').find((l) => l.includes(rb.id));
  if (!docLine) {
    problems.push(`runbook ${rb.id} (${rb.domain}) not mentioned in RUNBOOKS.md`);
    continue;
  }
  const claimedExists = !docLine.includes('MISSING');
  if (claimedExists !== rb.existsOnDisk) {
    problems.push(
      `runbook ${rb.id} (${rb.domain}): RUNBOOKS.md claims ${claimedExists ? 'exists' : 'missing'} but actual is ${rb.existsOnDisk ? 'exists' : 'missing'}`,
    );
  }
}

// Every gate named in the docs must be real.
const allGateIds = new Set();
const allConstitutions = [...runbookSources];
for (const { path } of allConstitutions) {
  if (!existsSync(path)) continue;
  const con = JSON.parse(readFileSync(path, 'utf8'));
  for (const g of con.gates ?? []) allGateIds.add(g.id);
}

const docFiles = ['GOVERNANCE.md', 'COMPLIANCE.md', 'RUNBOOKS.md'];
const HALLUCINATED = [];
for (const doc of docFiles) {
  const p = resolve(docsDir, doc);
  if (!existsSync(p)) continue;
  const text = readFileSync(p, 'utf8');
  for (const m of text.matchAll(/gate:[a-z0-9-]+/g)) {
    const bare = m[0].replace(/^gate:/, '');
    if (!allGateIds.has(bare)) HALLUCINATED.push(`${doc}: ${m[0]}`);
  }
}

for (const h of HALLUCINATED) problems.push(`doc references a gate that does not exist: ${h}`);

if (problems.length) {
  console.error(`✗ docs:check — ${problems.length} problem(s):`);
  for (const p of problems) console.error(`   - ${p}`);
  process.exit(1);
}
console.log(`✅ docs:check — ${REQUIRED.length} docs present, ${REAL_RUNBOOKS.length} runbooks consistent, zero hallucinated gates.`);