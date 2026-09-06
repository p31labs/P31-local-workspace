import { globby } from 'globby';
import { readFileSync } from 'fs';

const files = await globby([
  'packages/ui/src/**/*.{tsx,astro}',
  'apps/*/src/**/*.{tsx,astro}',
], {
  ignore: ['**/node_modules/**', '**/__tests__/**', '**/dist/**'],
});

let totalAnnotations = 0;
let totalWarnings = 0;
let hasErrors = false;

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  const regex = /data-mcp-\w+="[^"]*"/g;
  const matches = content.match(regex) || [];

  if (matches.length === 0) continue;

  console.log(`${file}: ${matches.length} annotations`);
  totalAnnotations += matches.length;
}

console.log(`\n📊 Total annotations: ${totalAnnotations}`);
console.log(`⚠️  Total warnings: ${totalWarnings}`);

if (hasErrors) process.exit(1);
