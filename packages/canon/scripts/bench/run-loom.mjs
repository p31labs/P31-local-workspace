#!/usr/bin/env node
/**
 * @p31/canon — bench/run-loom.mjs
 *
 * Runs the Loom contract agent against a fixture and captures the proposal
 * body as a scored artifact. Deterministic: two runs on the same fixture must
 * produce byte-identical output — that is the Loom's structural win.
 *
 * A fixture is a directory with `components.css` and `tokens.json` (see
 * fixtures/foreign/ for the shape). The agent runs over the fixture CSS and
 * the fixture token list, and emits the first proposal body to stdout as JSON.
 *
 * Run: node scripts/bench/run-loom.mjs <fixture-dir>
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseCss, parseTokens } from '../../src/loom/ingest.ts';
import { detectFamilies, uncontractedFamilies, groundTokens, buildContractBody } from '../loom-coverage.mjs';

const fixtureDir = resolve(process.argv[2] ?? 'scripts/fixtures/foreign');

// Scan the fixture CSS.
const classes = [];
for (const f of readdirSync(fixtureDir).filter((x) => x.endsWith('.css'))) {
  classes.push(...parseCss(readFileSync(join(fixtureDir, f), 'utf8'), f));
}
const classVars = new Map();
for (const c of classes) {
  classVars.set(c.name, { files: new Set(c.files), tokens: new Set(c.tokens) });
}

// Load the fixture token list.
const tokensFile = join(fixtureDir, 'tokens.json');
const dtcgTokens = new Map();
if (readFileSync) {
  const parsed = parseTokens(readFileSync(tokensFile, 'utf8'));
  for (const t of parsed) dtcgTokens.set(t.name, t.value);
}

const families = detectFamilies(classVars);
const candidates = uncontractedFamilies(families, []);

if (candidates.length === 0) {
  console.log(JSON.stringify({ error: 'no component family found in fixture' }));
  process.exit(0);
}

const family = candidates[0];
const tokenContract = groundTokens(classVars, family, dtcgTokens);
const body = buildContractBody(family, tokenContract, dtcgTokens);
console.log(JSON.stringify(body, null, 2));
