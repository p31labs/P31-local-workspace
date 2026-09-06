import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DENSE = resolve(ROOT, 'schemas/tokens.dense.json');

const tokenName = process.argv[2];

if (!tokenName) {
  console.error('Usage: node scripts/dense-token-query.mjs <token-name>');
  console.error('Example: node scripts/dense-token-query.mjs p31-color-cyan');
  process.exit(1);
}

if (!existsSync(DENSE)) {
  console.error('Dense token file not found. Run `node scripts/generate-dense-tokens.mjs` first.');
  process.exit(1);
}

const dense = JSON.parse(readFileSync(DENSE, 'utf-8'));
const value = dense.tokens[tokenName];

if (value === undefined) {
  console.error(`Token not found: ${tokenName}`);
  process.exit(1);
}

console.log(value);
