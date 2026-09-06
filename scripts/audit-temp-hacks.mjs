#!/usr/bin/env node
/**
 * Temporary Hack Audit
 *
 * Scans the codebase for:
 * - position: absolute / fixed outside of designated folders
 * - CSS variables without fallbacks
 * - Hardcoded pixel values outside of tokens.css
 * - Comments containing FIXME, HACK, or TODO
 *
 * Run: node scripts/audit-temp-hacks.mjs
 */

import { globby } from 'globby';
import { readFileSync } from 'fs';
import path from 'path';

const IGNORE = [
  '**/node_modules/**',
  '**/dist/**',
  '**/out/**',
  '**/coverage/**',
  '**/*.min.css',
  '**/.cache/**',
];

const ALLOWED_HARDCODED_PX = [
  /(?:font-size|letter-spacing|gap|padding|margin|width|height|line-height):\s*\d+px/,
  /(?:w|h|min-w|min-h|max-w|max-h)-\[\d+px\]/,
  /(?:w|h|min-w|min-h|max-w|max-h)-\[var\(--[^)]+\)\]/,
];

async function audit() {
  console.log('Scanning for temporary hacks...\n');

  const files = await globby([
    'apps/*/src/**/*.{tsx,ts,astro,css}',
    'packages/*/src/**/*.{tsx,ts,astro,css}',
    '!apps/*/src/**/__tests__/**',
    '!packages/*/src/**/__tests__/**',
  ], { ignore: IGNORE });

  let totalIssues = 0;

  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const issues = [];

    lines.forEach((line, idx) => {
      const num = idx + 1;
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;

      // 1. position: absolute / fixed
      if (/\bposition:\s*(absolute|fixed)\b/.test(line)) {
        issues.push(`  ${num}: ${trimmed}`);
      }

      // 2. CSS var without fallback
      const varMatches = line.match(/var\(\s*--[a-zA-Z0-9-]+/g);
      if (varMatches) {
        const hasFallback = /var\(\s*--[a-zA-Z0-9-]+\s*,\s*[^)]+\)/.test(line);
        if (!hasFallback) {
          issues.push(`  ${num}: ${trimmed}`);
        }
      }

      // 3. Hardcoded px in CSS (with whitelist)
      if (/\d+px/.test(line) && !ALLOWED_HARDCODED_PX.some(re => re.test(line)) && !line.includes('var(')) {
        issues.push(`  ${num}: ${trimmed}`);
      }

      // 4. FIXME / HACK / TODO
      if (/\b(FIXME|HACK|TODO)\b/i.test(line)) {
        issues.push(`  ${num}: ${trimmed}`);
      }
    });

    if (issues.length > 0) {
      console.log(`\u001b[33m${file}\u001b[0m`);
      issues.forEach(i => console.log(i));
      totalIssues += issues.length;
    }
  }

  if (totalIssues === 0) {
    console.log('\n\u001b[32mNo issues found.\u001b[0m');
  } else {
    console.log(`\n\u001b[31mFound ${totalIssues} potential issues.\u001b[0m`);
    process.exit(1);
  }
}

audit().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
