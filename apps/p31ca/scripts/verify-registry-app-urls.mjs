#!/usr/bin/env node
/**
 * Every hub registry relative appUrl must resolve to an existing file under public/.
 * External https URLs are skipped. Fails CI on broken Launch targets.
 *
 * Run: npm run verify:registry-urls
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const P31CA = path.join(__dirname, '..');
const PUBLIC = path.join(P31CA, 'public');

const regPath = path.join(P31CA, 'scripts', 'hub', 'registry.mjs');
const { registry } = await import(pathToFileURL(regPath).href);

/** Status values that don't require a live file (concept/draft are not shipped) */
const SKIP_STATUSES = new Set(['concept', 'draft']);
let errs = 0;
function fail(m) {
  console.error('[FAIL] verify-registry-app-urls:', m);
  errs++;
}

for (const item of registry) {
  if (SKIP_STATUSES.has(item.status)) continue;
  const u = String(item.appUrl ?? '').trim();
  // External URLs — runtime-resolved, no file check
  if (/^https?:\/\//i.test(u)) continue;
  // Absolute paths starting with '/' — Astro routes or SPA paths; no static file to check
  if (u.startsWith('/')) continue;
  const target = path.join(PUBLIC, u);
  if (!fs.existsSync(target)) {
    fail(`${item.id}: appUrl "${item.appUrl}" → missing ${path.relative(P31CA, target)}`);
  }
}

if (errs > 0) {
  console.error(`verify-registry-app-urls: ${errs} missing file(s)`);
  process.exit(1);
}
console.log(
  `[ OK ] verify-registry-app-urls: ${registry.length} registry row(s); relative targets exist under public/ ✓`
);
