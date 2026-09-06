#!/usr/bin/env node
/**
 * Build script for p31-edge-render Worker.
 * Bundles design-system.json from the canonical source into the worker.
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

// Find the canonical design-system.json
const sourcePaths = [
  resolve(ROOT, 'apps/phos/public/.well-known/design-system.json'),
  resolve(ROOT, 'apps/phos/dist/.well-known/design-system.json'),
];

let designSystemPath = null;
for (const p of sourcePaths) {
  if (existsSync(p)) {
    designSystemPath = p;
    break;
  }
}

if (!designSystemPath) {
  console.error('ERROR: design-system.json not found. Run cli/tokens/build-sovereign.mjs first.');
  process.exit(1);
}

// Read and validate
const raw = readFileSync(designSystemPath, 'utf-8');
const ds = JSON.parse(raw);

if (!ds.tokens || !ds.components) {
  console.error('ERROR: Invalid design-system.json — missing tokens or components');
  process.exit(1);
}

// Write to worker src directory
const outputPath = resolve(__dirname, 'src/design-system.json');
writeFileSync(outputPath, JSON.stringify(ds));

const tokenCount = Object.keys(ds.tokens).length;
const componentCount = ds.components.length;
const sizeKB = (Buffer.byteLength(raw) / 1024).toFixed(1);

console.log(`✅ Bundled design-system.json → ${outputPath}`);
console.log(`   Tokens: ${tokenCount} groups · Components: ${componentCount} · Size: ${sizeKB} KB`);
console.log(`   Ready for deployment: npx wrangler deploy`);
