#!/usr/bin/env node
/**
 * check-css-vars.mjs — verifies every var(--p31-*) referenced in
 * component CSS has a corresponding --p31-* declaration in the
 * emitted token CSS (packages/canon/dist/tokens.css).
 *
 * jsdom cannot evaluate CSS variables; this is the source-level
 * proxy for the real-browser check that Phase 3 will perform.
 *
 * Usage:
 *   node scripts/check-css-vars.mjs        # check Button.css
 *   node scripts/check-css-vars.mjs --all  # check all component CSS
 *
 * Exit 0: all references resolve. Exit 1: unresolvable references found.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const TOKENS_CSS = resolve(ROOT, '..', 'canon', 'dist', 'tokens.css');
const SRC_DIR = resolve(ROOT, 'src');
const ALL = process.argv.includes('--all');

function extractVarDeclarations(css) {
  const declared = new Set();
  for (const match of css.matchAll(/(--p31-[a-z0-9-]+)\s*:/g)) {
    declared.add(match[1]);
  }
  return declared;
}

function extractVarReferences(css) {
  const referenced = new Set();
  for (const match of css.matchAll(/var\((--p31-[a-z0-9-]+)\)/g)) {
    referenced.add(match[1]);
  }
  return referenced;
}

function collectCssFiles(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      collectCssFiles(full, files);
    } else if (entry.endsWith('.css') && !full.includes('dist/')) {
      files.push(full);
    }
  }
  return files;
}

let cssFiles;
if (ALL) {
  cssFiles = collectCssFiles(SRC_DIR);
} else {
  const buttonCss = resolve(SRC_DIR, 'Button', 'Button.css');
  cssFiles = [buttonCss];
}

const emitted = readFileSync(TOKENS_CSS, 'utf-8');
const declared = extractVarDeclarations(emitted);

let failed = false;
for (const file of cssFiles) {
  const css = readFileSync(file, 'utf-8');
  const referenced = extractVarReferences(css);
  const missing = [...referenced].filter((v) => !declared.has(v));
  if (missing.length === 0) {
    console.log(`✓ ${file.replace(ROOT + '/', '')} — all ${referenced.size} var(--p31-*) references resolve`);
  } else {
    failed = true;
    console.error(`✗ ${file.replace(ROOT + '/', '')} — ${missing.length} unresolvable references:`);
    for (const v of missing) {
      console.error(`  MISSING: ${v} (referenced in CSS but not declared in tokens.css)`);
    }
  }
}

if (failed) {
  console.error('\nUnresolvable CSS variables found. A component references a --p31-* name not emitted by gen:tokens.');
  console.error('Either the token name is wrong or gen:tokens has not been run since the reference was added.');
  process.exit(1);
}

console.log(`\nAll ${cssFiles.length} CSS file(s) — every var(--p31-*) resolves to an emitted token.`);
