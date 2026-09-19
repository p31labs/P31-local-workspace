#!/usr/bin/env node
/**
 * @p31/canon-react — gen-exports.mjs
 *
 * Exports point at built artifacts. The gate hard-fails if dist is stale.
 * Run after `pnpm build`.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const expected = {
  '.': {
    types: './dist/index.d.ts',
    import: './dist/index.js',
    require: './dist/index.cjs',
  },
  './client': {
    types: './dist/client.d.ts',
    import: './dist/client.js',
    require: './dist/client.cjs',
  },
  './styles.css': './dist/styles.css',
  './package.json': './package.json',
};

const ghosts = [];
for (const [spec, target] of Object.entries(expected)) {
  if (spec === './package.json') continue;
  const paths = typeof target === 'string' ? [target] : Object.values(target);
  for (const p of paths) {
    if (!existsSync(join(root, p))) ghosts.push(`${spec} → ${p}`);
  }
}

if (ghosts.length) {
  console.error('\n❌ canon-react gen:exports: ghost exports — run `pnpm build` first.');
  for (const g of ghosts) console.error(`   • ${g}`);
  process.exit(1);
}

const pkgPath = join(root, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
pkg.exports = expected;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`✅ canon-react exports: ${Object.keys(expected).length} specifiers, 0 ghosts`);