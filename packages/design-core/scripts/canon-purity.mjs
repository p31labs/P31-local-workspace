#!/usr/bin/env node
/**
 * canon-purity gate — fails the build if the canon contains a corrupt color.
 *
 * Guards:
 *   1. No `oklch(NaN NaN NaN)` anywhere in design-core source/manifests.
 *   2. No `NaN` in the DTCG manifest (tokens can resolve to NaN from a bad
 *      transform — text-secondary/tertiary and the glass/glow shadows did).
 *   3. The governance palette resolves (chainVerified etc. are present).
 *
 * This is the gate that would have caught the `migrate-oklch.mjs` corruption
 * and the undefined `GOVERNANCE` token before either shipped.
 */
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
// --root <dir> lets negative controls point the gate at a fixture copy so it
// never mutates the real canon tree. A crash mid-NC then leaves no residue in
// design-core/src. Defaults to the real tree.
const rootArg = process.argv.indexOf('--root');
const SCAN_ROOT = rootArg !== -1 && process.argv[rootArg + 1] ? resolve(process.argv[rootArg + 1]) : ROOT;
let failures = 0;

function walk(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (e === 'node_modules' || e === 'dist' || e === '.git' || e === 'baseline') continue;
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (/\.(css|ts|tsx|js|mjs|json|yml|yaml)$/.test(e)) acc.push(p);
  }
  return acc;
}

const files = walk(join(SCAN_ROOT, 'src'));
files.push(join(SCAN_ROOT, 'manifest.json'), join(SCAN_ROOT, 'tokens', 'tokens.json'));

// Guard 1 + 2: NaN literals
const nanFiles = [];
for (const f of files) {
  if (!existsSync(f)) continue;
  const text = readFileSync(f, 'utf8');
  if (text.includes('oklch(NaN NaN NaN)')) nanFiles.push(f);
  else if (text.includes('NaN') && f.includes('tokens.json')) nanFiles.push(f);
}
if (nanFiles.length) {
  failures += nanFiles.length;
  console.error(`\n❌ canon-purity: NaN color literal found in ${nanFiles.length} file(s):`);
  for (const f of nanFiles.slice(0, 10)) console.error(`   ${f}`);
}

// Guard 3: governance palette present
try {
  const manifest = JSON.parse(readFileSync(join(SCAN_ROOT, 'manifest.json'), 'utf8'));
  const governance = manifest.tokens?.color;
  const required = ['quantum-green', 'quantum-gold', 'quantum-red', 'quantum-cyan', 'quantum-violet'];
  const missing = required.filter((k) => !governance?.[k]);
  if (missing.length) {
    failures += 1;
    console.error(`\n❌ canon-purity: governance colors missing from manifest: ${missing.join(', ')}`);
  }
} catch (e) {
  failures += 1;
  console.error(`\n❌ canon-purity: manifest.json unreadable: ${e.message}`);
}

if (failures) {
  console.error(`\ncanon-purity: ${failures} violation(s) — refusing.`);
  process.exit(1);
}
console.log('✅ canon-purity: no NaN colors, governance palette present.');