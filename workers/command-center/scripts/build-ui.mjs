#!/usr/bin/env node
/**
 * Build the Command Center operator UI → ./public
 * Uses the local esbuild (present in the workspace) — no extra toolchain.
 */
import { build } from 'esbuild';
import { rm, mkdir, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const outdir = path.join(root, 'public');
const staticDir = path.join(root, 'static');

const watch = process.argv.includes('--watch');

await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });
await cp(staticDir, outdir, { recursive: true });

/** @type {import('esbuild').BuildOptions} */
const options = {
  entryPoints: [path.join(root, 'ui/main.tsx')],
  outdir,
  entryNames: 'dashboard',
  bundle: true,
  format: 'esm',
  splitting: false,
  target: ['es2021'],
  jsx: 'automatic',
  minify: !watch,
  sourcemap: true,
  legalComments: 'none',
  loader: { '.css': 'css', '.svg': 'dataurl', '.woff2': 'dataurl' },
  define: { 'process.env.NODE_ENV': watch ? '"development"' : '"production"' },
  logLevel: 'info',
};

if (watch) {
  const { context } = await import('esbuild');
  const ctx = await context(options);
  await ctx.watch();
  console.log('[build-ui] watching…');
} else {
  await build(options);
  console.log('[build-ui] built → public/dashboard.js + dashboard.css');
}
