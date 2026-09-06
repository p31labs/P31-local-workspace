#!/usr/bin/env node
/**
 * Snapshot component HTML previews using Playwright.
 *
 * Usage:
 *   node scripts/snapshot-components.mjs
 *
 * Opens each generated HTML preview in a headless browser and saves
 * the rendered DOM as a standalone static HTML file.
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SOURCE_DIR = path.join(ROOT, 'packages', 'design-core', 'src', 'generated-html');
const DEST_DIR = path.join(ROOT, 'packages', 'design-core', 'src', 'generated-html-snapshots');

async function snapshot() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Source directory not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  fs.mkdirSync(DEST_DIR, { recursive: true });

  const files = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.html'));
  console.error(`Snapshotting ${files.length} component previews...`);

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  for (const file of files) {
    const srcPath = path.join(SOURCE_DIR, file);
    const destPath = path.join(DEST_DIR, file);

    await page.goto(`file://${srcPath}`);
    await page.waitForSelector('.preview', { timeout: 5000 }).catch(() => {});

    const html = await page.content();
    fs.writeFileSync(destPath, html);
    console.error(`  Snapshotted ${file}`);
  }

  await browser.close();
  console.error(`\nDone: ${files.length} snapshots written to ${DEST_DIR}`);
}

snapshot().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
