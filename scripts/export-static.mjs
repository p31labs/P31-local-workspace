#!/usr/bin/env node
/**
 * Unified static HTML export pipeline.
 *
 * Usage:
 *   node scripts/export-static.mjs
 *
 * Steps:
 *   1. Snapshot component previews with Playwright
 *   2. Tokenize snapshots (replace hardcoded colors with var(--p31-*))
 *   3. Copy tokenized snapshots into each app public/static-components directory
 *
 * Output:
 *   packages/design-core/src/generated-html-snapshots/
 *   packages/design-core/src/generated-html-tokenized/
 *   apps/<app>/public/static-components/
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SOURCE_DIR = path.join(ROOT, 'packages', 'design-core', 'src', 'generated-html');
const SNAPSHOT_DIR = path.join(ROOT, 'packages', 'design-core', 'src', 'generated-html-snapshots');
const TOKENIZED_DIR = path.join(ROOT, 'packages', 'design-core', 'src', 'generated-html-tokenized');
const APPS = ['p31ca', 'phosphorus31', 'phos', 'willow', 'bonding'];

async function snapshotComponents() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Source directory not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });

  const files = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.html'));
  console.error(`Snapshotting ${files.length} component previews...`);

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  for (const file of files) {
    const srcPath = path.join(SOURCE_DIR, file);
    const destPath = path.join(SNAPSHOT_DIR, file);

    await page.goto(`file://${srcPath}`);
    await page.waitForSelector('.preview', { timeout: 5000 }).catch(() => {});

    const html = await page.content();
    fs.writeFileSync(destPath, html);
    console.error(`  Snapshotted ${file}`);
  }

  await browser.close();
  console.error(`Done: ${files.length} snapshots written to ${SNAPSHOT_DIR}\n`);
}

function copyToApps() {
  const sourceDir = fs.existsSync(TOKENIZED_DIR) ? TOKENIZED_DIR : SNAPSHOT_DIR;
  const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.html'));
  console.error(`Copying ${files.length} files to app public directories...`);

  let totalCopied = 0;

  for (const app of APPS) {
    const destDir = path.join(ROOT, 'apps', app, 'public', 'static-components');
    fs.mkdirSync(destDir, { recursive: true });

    let copied = 0;
    for (const file of files) {
      const src = path.join(sourceDir, file);
      const dest = path.join(destDir, file);
      fs.copyFileSync(src, dest);
      copied++;
    }

    console.error(`  Copied ${copied} files to apps/${app}/public/static-components/`);
    totalCopied += copied;
  }

  console.error(`\nDone: ${totalCopied} component previews exported to ${APPS.length} apps.`);
}

async function main() {
  console.log('P31 Static HTML Export Pipeline');
  console.log('════════════════════════════════\n');

  await snapshotComponents();

  // Tokenize snapshots
  console.log('\nTokenizing snapshots...');
  try {
    const tokenizeScript = path.join(__dirname, 'tokenize-static-html.mjs');
    execSync(`node ${tokenizeScript}`, { stdio: 'inherit', cwd: ROOT });
  } catch (err) {
    console.error('Tokenization failed:', err.message);
    process.exit(1);
  }

  copyToApps();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
