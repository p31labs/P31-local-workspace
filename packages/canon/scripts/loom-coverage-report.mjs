#!/usr/bin/env node
/**
 * @p31/canon — loom-coverage-report.mjs
 *
 * Coverage report — a derived artifact, NOT a log event. Reads the registry
 * and the CSS, and prints: how many class families are contracted, how many
 * are not, and the top uncontracted gaps by signal. A human reads this to
 * decide which proposals to approve; the agent reads it to decide what to
 * propose next.
 *
 * Run: node scripts/loom-coverage-report.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectFamilies, uncontractedFamilies, pascalize } from './loom-coverage.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const registry = JSON.parse(readFileSync(join(root, 'registry.json'), 'utf8'));

const cssDir = join(root, 'src', 'css');
const classVars = new Map();
for (const f of readdirSync(cssDir).filter((x) => x.endsWith('.css'))) {
  const text = readFileSync(join(cssDir, f), 'utf8');
  for (const m of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const body = m[2];
    const used = [...new Set([...body.matchAll(/var\((--p31-[a-z0-9-]+)/g)].map((x) => x[1]))];
    if (!used.length) continue;
    for (const c of m[1].matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)) {
      const name = '.' + c[1];
      if (!classVars.has(name)) classVars.set(name, { files: new Set(), tokens: new Set() });
      classVars.get(name).files.add(f);
      used.forEach((t) => classVars.get(name).tokens.add(t));
    }
  }
}

const families = detectFamilies(classVars);
const contracted = registry.components.map((c) => c.name);
const gaps = uncontractedFamilies(families, contracted);

const contractedFamilies = families.filter((f) => {
  const p = pascalize(f.base);
  return contracted.some((c) => c.toLowerCase() === p.toLowerCase());
});

console.log('loom coverage report');
console.log(`  component families detected : ${families.length}`);
console.log(`  contracted                 : ${contractedFamilies.length}`);
console.log(`  uncontracted (gaps)        : ${gaps.length}`);
console.log('');
if (gaps.length) {
  console.log('  top gaps by signal:');
  for (const g of gaps.slice(0, 10)) {
    console.log(`    ${g.base.padEnd(24)} signal ${String(g.signal).padStart(5)} · ${g.modifierCount} variants · ${g.tokenCount} tokens · ${g.fileCount} file(s)`);
  }
} else {
  console.log('  no gaps — the canon is fully contracted.');
}
