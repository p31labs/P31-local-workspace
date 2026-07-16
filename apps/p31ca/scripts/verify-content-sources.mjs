#!/usr/bin/env node
/**
 * verify-content-sources.mjs — Checks that all content JSON files in
 * ground-truth/content/ have a lastVerified within their stalenessThreshold.
 *
 * If any file is stale, exits with code 1 and lists the offending files.
 *
 * Usage:
 *   node scripts/verify-content-sources.mjs            # strict mode
 *   node scripts/verify-content-sources.mjs --dry-run  # warn but don't fail
 */

import { readFileSync, readdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = resolve(__dirname, '..', 'ground-truth', 'content');
const DRY_RUN = process.argv.includes('--dry-run');

function main() {
  const entries = readdirSync(CONTENT_DIR, { withFileTypes: true });
  const jsonFiles = entries.filter((e) => e.isFile() && e.name.endsWith('.json'));

  const issues = [];

  for (const entry of jsonFiles) {
    const path = join(CONTENT_DIR, entry.name);
    const data = JSON.parse(readFileSync(path, 'utf-8'));

    if (!data.lastVerified) {
      issues.push(`${entry.name}: missing lastVerified field`);
      continue;
    }

    const threshold = data.stalenessThreshold ?? 7;
    const last = new Date(data.lastVerified).getTime();
    const now = Date.now();
    const hoursElapsed = (now - last) / 36e5;
    const maxHours = threshold * 24;

    if (hoursElapsed > maxHours) {
      const daysOverdue = Math.round((hoursElapsed - maxHours) / 24);
      issues.push(`${entry.name}: last verified ${Math.round(hoursElapsed)}h ago (threshold: ${maxHours}h) — ${daysOverdue}d overdue`);
    }
  }

  if (issues.length > 0) {
    console.error('\n❌ Content freshness check FAILED');
    for (const issue of issues) {
      console.error(`  • ${issue}`);
    }
    console.error(`\n  Run: node scripts/fetch-content-stats.mjs --force`);
    console.error(`  Or manually update lastVerified in the affected files.\n`);

    if (!DRY_RUN) process.exit(1);
  }

  console.log(`✅ Content freshness OK — ${jsonFiles.length} file(s) checked`);
}

main();
