/**
 * scan-components.mjs — Automated component usage scanner.
 * Scans all 5 apps for @p31/ui imports and outputs JSON to stdout.
 *
 * Usage: node scripts/scan-components.mjs
 * Output: Prints JSON to stdout, also writes to ground-truth/component-usage.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, extname, join, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const APP_DIRS = ['apps/phos', 'apps/willow', 'apps/p31ca', 'apps/phosphorus31', 'apps/bonding'];

const importPattern = /from\s+['"]@p31\/ui\/?([^'"]*)['"]/g;

function globSync(pattern, rootDir) {
  const results = [];
  const allowedExt = new Set(['.ts', '.tsx', '.astro']);
  function walk(dir) {
    let entries;
    try { entries = readdirSync(dir); } catch { return; }
    for (const entry of entries) {
      const full = join(dir, entry);
      const st = statSync(full);
      if (st.isDirectory()) {
        if (!entry.startsWith('.') && entry !== 'node_modules') walk(full);
      } else if (st.isFile() && allowedExt.has(extname(full))) {
        results.push(full);
      }
    }
  }
  walk(rootDir);
  return results;
}

const results = {};

for (const appDir of APP_DIRS) {
  const fullDir = resolve(ROOT, appDir);
  if (!existsSync(fullDir)) {
    console.error(`Skipping ${appDir} — not found`);
    continue;
  }
  const files = globSync(`${fullDir}/src/**/*.{ts,tsx,astro}`, fullDir);
  const appName = appDir.replace('apps/', '');

  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    const matches = Array.from(content.matchAll(importPattern));
    for (const match of matches) {
      const importPath = match[1] || 'index';
      if (!results[importPath]) {
        results[importPath] = { apps: new Set(), files: [] };
      }
      results[importPath].apps.add(appName);
      results[importPath].files.push(relative(ROOT, file));
    }
  }
}

const output = {};
for (const [component, data] of Object.entries(results)) {
  output[component] = {
    apps: Array.from(data.apps).sort(),
    count: data.apps.size,
    fileCount: data.files.length,
  };
}

const gtDir = resolve(ROOT, 'ground-truth');
if (!existsSync(gtDir)) mkdirSync(gtDir, { recursive: true });
writeFileSync(resolve(gtDir, 'component-usage.json'), JSON.stringify(output, null, 2));

console.log(JSON.stringify(output, null, 2));
console.error(`\n\x1b[32m✓\x1b[0m Scanned ${APP_DIRS.length} apps. Found ${Object.keys(output).length} unique \x1b[1m@p31/ui\x1b[0m imports.`);
