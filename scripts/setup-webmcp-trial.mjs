#!/usr/bin/env node
/**
 * setup-webmcp-trial.mjs
 *
 * Injects the WebMCP origin trial token into all P31 app HTML shells.
 * Reads token from env var WEBMCP_ORIGIN_TRIAL_TOKEN.
 *
 * Usage:
 *   export WEBMCP_ORIGIN_TRIAL_TOKEN="Av9...AAA="
 *   node scripts/setup-webmcp-trial.mjs
 *
 * Set WEBMCP_ORIGIN_TRIAL_TOKEN to empty to remove the meta tag from all shells.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, relative } from 'path';

const PLACEHOLDER = '__WEBMCP_ORIGIN_TRIAL_TOKEN__';
const token = process.env.WEBMCP_ORIGIN_TRIAL_TOKEN || '';

const htmlFiles = [
  'apps/phos/index.html',
  'apps/willow/index.html',
  'apps/bonding/index.html',
  'apps/phosphorus31/index.html',
  'apps/phosphorus31/deploy/index.html',
];

const root = resolve(process.cwd());
const modified = [];

for (const filePath of htmlFiles) {
  const absPath = resolve(root, filePath);
  if (!existsSync(absPath)) {
    console.warn(`[warn] File not found: ${absPath}`);
    continue;
  }

  let content = readFileSync(absPath, 'utf-8');
  const original = content;

  if (token) {
    // Replace placeholder with actual token
    content = content.replaceAll(PLACEHOLDER, token);
  } else {
    // No token: remove the whole <meta> line containing the placeholder
    content = content.replace(
      new RegExp(`\\s*<meta[^>]*${escapeRegex(PLACEHOLDER)}[^>]*>\\s*`, 'g'),
      '\n'
    );
  }

  if (content !== original) {
    writeFileSync(absPath, content, 'utf-8');
    modified.push(relative(root, absPath));
  }
}

// Also update Astro .env files for PUBLIC_WEBMCP_ORIGIN_TRIAL
if (token) {
  const envFiles = [
    resolve(root, 'apps/p31ca/.env'),
    resolve(root, 'apps/phosphorus31/.env'),
    resolve(root, 'apps/phos/.env'),
    resolve(root, 'apps/willow/.env'),
    resolve(root, 'apps/bonding/.env'),
  ];

  for (const envPath of envFiles) {
    try {
      let envContent = existsSync(envPath) ? readFileSync(envPath, 'utf-8') : '';
      const line = token.includes('VITE_')
        ? `VITE_WEBMCP_ORIGIN_TRIAL=${token}\n`
        : `PUBLIC_WEBMCP_ORIGIN_TRIAL=${token}\n`;

      if (!envContent.includes('WEBMCP_ORIGIN_TRIAL')) {
        envContent += `\n# WebMCP Origin Trial\n${line}`;
        writeFileSync(envPath, envContent, 'utf-8');
        modified.push(relative(root, envPath));
      }
    } catch {
      // skip unwritable env files
    }
  }

  // Update the root .env.example token placeholder
  const envExample = resolve(root, '.env.example');
  if (existsSync(envExample)) {
    let example = readFileSync(envExample, 'utf-8');
    if (example.includes('your-origin-trial-token-here')) {
      example = example.replaceAll('your-origin-trial-token-here', token);
      writeFileSync(envExample, example, 'utf-8');
      modified.push(relative(root, envExample));
    }
  }
}

console.log('\n=== WebMCP Origin Trial Injection Summary ===');
if (modified.length === 0) {
  console.log('No files modified.');
} else {
  for (const f of modified) {
    console.log(`  ✔ ${f}`);
  }
}
console.log(`\nToken ${token ? 'injected' : 'cleared'} across ${modified.length} file(s).`);

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
