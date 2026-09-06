#!/usr/bin/env node
/**
 * Export static HTML component previews to app public directories.
 *
 * Usage:
 *   node scripts/export-static-components.mjs
 *
 * Copies generated HTML previews from packages/design-core/src/generated-html/
 * into each consumer app's public/static-components/ directory.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SOURCE_DIR = path.join(ROOT, 'packages', 'design-core', 'src', 'generated-html-snapshots');
const APPS = ['p31ca', 'phosphorus31', 'phos', 'willow', 'bonding'];

function copyHtmlFiles() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Source directory not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.html'));
  console.error(`Found ${files.length} component previews in ${SOURCE_DIR}`);

  let totalCopied = 0;

  for (const app of APPS) {
    const destDir = path.join(ROOT, 'apps', app, 'public', 'static-components');
    fs.mkdirSync(destDir, { recursive: true });

    let copied = 0;
    for (const file of files) {
      const src = path.join(SOURCE_DIR, file);
      const dest = path.join(destDir, file);
      fs.copyFileSync(src, dest);
      copied++;
    }

    console.error(`  Copied ${copied} files to apps/${app}/public/static-components/`);
    totalCopied += copied;
  }

  console.error(`\nDone: ${totalCopied} component previews exported to ${APPS.length} apps.`);
}

copyHtmlFiles();
