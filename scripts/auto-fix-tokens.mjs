#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, statSync, readdirSync } from 'fs';
import { resolve, extname, join, relative } from 'path';
import { fileURLToPath } from 'url';
import { COLOR_MAP } from './token-replacement-map.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');

const TOKEN_DIR_PATTERNS = [/tokens/, /token-replacement-map/];
const ALLOWED_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.astro', '.css']);

const SRC_DIRS = [
  'packages/ui/src',
  'apps/phos/src',
  'apps/willow/src',
  'apps/p31ca/src',
  'apps/phosphorus31/src',
  'apps/bonding/src',
];

function isTokenDirectory(filePath) {
  return TOKEN_DIR_PATTERNS.some(p => p.test(filePath));
}

function collectSourceFiles() {
  const files = [];
  for (const dir of SRC_DIRS) {
    const fullDir = resolve(ROOT, dir);
    if (!existsSync(fullDir)) continue;
    walkDir(fullDir, files);
  }
  return files;
}

function walkDir(dir, acc) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (!entry.startsWith('.') && entry !== 'node_modules' && entry !== 'dist') {
        walkDir(full, acc);
      }
    } else if (st.isFile() && ALLOWED_EXT.has(extname(full))) {
      acc.push(full);
    }
  }
}

function applyReplacements(content, map) {
  let result = content;
  for (const [value, replacement] of Object.entries(map)) {
    const escaped = value.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
    result = result.replace(new RegExp(escaped, 'g'), replacement);
  }
  return result;
}

function main() {
  const files = collectSourceFiles();
  let changedCount = 0;
  let totalReplacements = 0;
  const changedFiles = [];

  for (const file of files) {
    if (isTokenDirectory(file)) continue;

    const content = readFileSync(file, 'utf8');
    const fixed = applyReplacements(content, COLOR_MAP);

    if (fixed !== content) {
      const rel = relative(ROOT, file);
      changedFiles.push({ file: rel, content, fixed });
      changedCount++;
    }
  }

  if (changedCount === 0) {
    console.log('No hardcoded colors found — all clean.');
    process.exit(0);
  }

  for (const { file, content, fixed } of changedFiles) {
    writeFileSync(resolve(ROOT, file), fixed, 'utf8');
    const oldLines = content.split('\n');
    const newLines = fixed.split('\n');
    const diffs = [];

    for (let i = 0; i < Math.max(oldLines.length, newLines.length); i++) {
      const oldLine = oldLines[i] ?? '';
      const newLine = newLines[i] ?? '';
      if (oldLine !== newLine) {
        diffs.push({ line: i + 1, from: oldLine, to: newLine });
      }
    }

    totalReplacements += diffs.length;

    console.log(`\n${file}:`);
    for (const d of diffs) {
      console.log(`  L${d.line}  -${d.from}`);
      console.log(`       +${d.to}`);
    }
  }

  console.log(`\nFixed ${totalReplacements} hardcoded color(s) across ${changedCount} file(s).`);

  if (changedCount > 0) {
    console.log('\nNext step: rebuild all consumer apps with `pnpm run -r build`.');
  }

  process.exit(1);
}

main();
