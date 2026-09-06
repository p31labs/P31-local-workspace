#!/usr/bin/env node
/**
 * Scans the repo for wrangler.toml files and writes docs/WORKER_PAGES_MANIFEST.md
 * Run from anywhere: node 04_SOFTWARE/scripts/generate-worker-manifest.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');

function walk(dir, acc = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist' || e.name === '.turbo') continue;
      walk(full, acc);
    } else if (e.name === 'wrangler.toml') {
      acc.push(full);
    }
  }
  return acc;
}

function parseWrangler(text) {
  const nameM = /^name\s*=\s*["']([^"']+)["']/m.exec(text);
  const name = nameM ? nameM[1].trim() : '(unnamed)';
  const mainM = /^main\s*=\s*["']([^"']+)["']/m.exec(text);
  const main = mainM ? mainM[1].trim() : '';
  const pagesDirM = /^pages_build_output_dir\s*=\s*["']([^"']+)["']/m.exec(text);
  const pagesDir = pagesDirM ? pagesDirM[1].trim() : '';
  const compatM = /^compatibility_date\s*=\s*["']([^"']+)["']/m.exec(text);
  const compat = compatM ? compatM[1].trim() : '';
  const kind = pagesDir ? 'Pages' : 'Worker';
  return { name, main, pagesDir, compat, kind };
}

const scanRoots = [
  join(REPO_ROOT, '04_SOFTWARE'),
  join(REPO_ROOT, 'phosphorus31.org'),
];

const files = [];
for (const root of scanRoots) {
  walk(root, files);
}

const rows = [];
for (const abs of files.sort()) {
  const text = readFileSync(abs, 'utf8');
  const p = parseWrangler(text);
  rows.push({
    rel: relative(REPO_ROOT, abs).replace(/\\/g, '/'),
    ...p,
  });
}

const generatedAt = new Date().toISOString();
const workerCount = rows.filter((r) => r.kind === 'Worker').length;
const pagesCount = rows.filter((r) => r.kind === 'Pages').length;

const lines = [
  '# Worker & Pages manifest (generated)',
  '',
  `> **Generated:** ${generatedAt} (UTC) · **Source:** \`04_SOFTWARE/scripts/generate-worker-manifest.mjs\``,
  '',
  'This file lists every `wrangler.toml` found under `04_SOFTWARE/` and `phosphorus31.org/`.',
  'It is the in-repo complement to the older snapshot `docs/WORKER_INVENTORY.md` (manual narrative + dashboard cross-check).',
  '',
  '| Kind | Wrangler `name` | Path | `main` / output |',
  '|------|-----------------|------|-----------------|',
];

for (const r of rows) {
  const detail = r.kind === 'Pages' ? `\`${r.pagesDir || '?'}\` (Pages build dir)` : (r.main ? `\`${r.main}\`` : '—');
  lines.push(`| ${r.kind} | \`${r.name}\` | \`${r.rel}\` | ${detail} |`);
}

lines.push('');
lines.push('## Counts');
lines.push('');
lines.push(`- **Worker-style** configs (no \`pages_build_output_dir\`): **${workerCount}**`);
lines.push(`- **Pages-style** configs: **${pagesCount}**`);
lines.push(`- **Total \`wrangler.toml\` files:** **${rows.length}**`);
lines.push('');
lines.push('## Pages deploy note (p31ca.org vs ops.p31ca.org)');
lines.push('');
lines.push(
  '**Use separate Pages project names:** hub `04_SOFTWARE/p31ca/` → project **`p31ca`** (domains: `p31ca.org`). ' +
    'Hearing Ops `04_SOFTWARE/p31-hearing-ops/` → project **`p31-hearing-ops`** (domain: `ops.p31ca.org`). ' +
    'Deploying two different apps to the **same** `--project-name` overwrites the single production bundle for **all** domains on that project.',
);
lines.push('');

const outPath = join(REPO_ROOT, 'docs', 'WORKER_PAGES_MANIFEST.md');
writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log(`Wrote ${relative(REPO_ROOT, outPath)} (${rows.length} wrangler.toml)`);
