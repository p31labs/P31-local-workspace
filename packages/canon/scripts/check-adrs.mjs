#!/usr/bin/env node
/**
 * @p31/canon — check-adrs.mjs
 *
 * Validates the design ADR corpus. The trigger list (from the 2026 agent-ADR
 * research) is the filter: an ADR is written when a decision meets a trigger —
 * NOT every token gets an ADR. This gate enforces WELL-FORMEDNESS, not
 * coverage:
 *   - every ADR file has a number and a title (ADR-NNN-*.md)
 *   - every ADR has the required sections: Status / Context / Decision /
 *     Consequences / Considered alternatives
 *   - every Status is a recognized value (Accepted / Proposed / Superseded)
 *   - numbers are unique
 *   - every Supersedes reference points at a real ADR file
 *
 * Run: node scripts/check-adrs.mjs  (from packages/canon)
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ADR_DIR = resolve(here, '..', 'adr');

const failures = [];
const fail = (msg) => failures.push(msg);

const REQUIRED = ['## Status', '## Context', '## Decision', '## Consequences', '## Considered alternatives'];
const STATUSES = ['Accepted', 'Proposed', 'Superseded'];

if (!existsSync(ADR_DIR)) {
  console.error('❌ ADR directory missing — expected packages/canon/adr/');
  process.exit(1);
}

const files = readdirSync(ADR_DIR).filter((f) => /^ADR-\d+-.+\.md$/.test(f)).sort();
if (files.length === 0) {
  console.error('❌ no ADR files found');
  process.exit(1);
}

const seenNumbers = new Set();
const supersedes = [];

for (const f of files) {
  const numMatch = f.match(/^ADR-(\d+)-/);
  if (!numMatch) continue; // regex already ensured
  const num = Number(numMatch[1]);
  if (seenNumbers.has(num)) fail(`${f}: duplicate ADR number ${num}`);
  seenNumbers.add(num);

  const text = readFileSync(join(ADR_DIR, f), 'utf8');
  const lines = text.split('\n');

  // Title: first line is `# ADR-NNN-title`.
  const title = lines[0] ?? '';
  if (!/^# ADR-\d+-.+/.test(title)) fail(`${f}: first line must be '# ADR-NNN-title'`);

  // Required sections, in order.
  const lineFor = (h) => lines.findIndex((l) => l.startsWith(h));
  let prev = -1;
  for (const h of REQUIRED) {
    const idx = lineFor(h);
    if (idx === -1) { fail(`${f}: missing '${h}'`); continue; }
    if (idx <= prev) fail(`${f}: sections out of order (${h})`);
    prev = idx;
  }

  // Status value.
  const statusLine = lines.find((l) => l.startsWith('**Status**')) ?? '';
  const statusVal = (statusLine.match(/\*\*Status\*\*:?\s*(\w+)/) ?? [])[1];
  if (!statusVal || !STATUSES.includes(statusVal)) {
    fail(`${f}: Status must be one of ${STATUSES.join('/')}, got '${statusVal}'`);
  }

  // Supersedes references.
  for (const m of text.matchAll(/\*\*Supersedes\*\*:?\s*(ADR-\d+-[^\s.]+)/g)) {
    supersedes.push({ from: f, to: m[1] });
  }
}

for (const { from, to } of supersedes) {
  if (!existsSync(join(ADR_DIR, `${to}.md`)) && !existsSync(join(ADR_DIR, `${to}.md`))) {
    fail(`${from}: Supersedes points at missing ${to}.md`);
  }
}

if (failures.length) {
  console.error(`\n❌ ADR GATE FAILED — ${failures.length} problem(s):`);
  for (const f of failures) console.error(`   • ${f}`);
  process.exit(1);
}

console.log(`✅ adr gate — ${files.length} ADRs, numbers unique, sections well-formed, Supersedes resolvable.`);
for (const f of files) {
  const status = (readFileSync(join(ADR_DIR, f), 'utf8').match(/\*\*Status\*\*:?\s*(\w+)/) ?? [])[1];
  console.log(`   ${f.slice(0, -3)} — ${status}`);
}