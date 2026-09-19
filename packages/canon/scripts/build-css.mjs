#!/usr/bin/env node
/**
 * @p31/canon — build-css.mjs
 *
 * Copies the canonical component/layout CSS from src/css/ into dist/css/, and
 * places the generated token stylesheet (dist/tokens.css) beside it so
 * `dist/css/all.css`'s `@import './tokens.css'` resolves. Canon owns the CSS;
 * this is the only writer of dist/css/.
 */
import { readdirSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const srcDir = join(root, 'src', 'css');
const distDir = join(root, 'dist');
const outDir = join(distDir, 'css');

mkdirSync(outDir, { recursive: true });

for (const f of readdirSync(srcDir)) {
  if (f.endsWith('.css')) copyFileSync(join(srcDir, f), join(outDir, f));
}

const generatedTokens = join(distDir, 'tokens.css');
if (existsSync(generatedTokens)) {
  copyFileSync(generatedTokens, join(outDir, 'tokens.css'));
}

console.log(`build-css — ${readdirSync(outDir).length} files in dist/css/`);
