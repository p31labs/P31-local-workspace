#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, extname, join, relative } from 'path';
import { fileURLToPath } from 'url';
import config from './token-usage.config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function resolveTokens(root, relPath) {
  return resolve(root, relPath);
}

const ALLOWED_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.css', '.scss', '.sass', '.less', '.styl',
  '.astro', '.vue', '.svelte',
  '.json', '.html', '.mdx',
]);

function walkFiles(dir, excludeDirs) {
  const files = [];
  const excludeSet = new Set(excludeDirs);
  function walk(current) {
    let entries;
    try { entries = readdirSync(current); } catch { return; }
    for (const entry of entries) {
      const full = join(current, entry);
      let st;
      try { st = statSync(full); } catch { continue; }
      if (st.isDirectory()) {
        if (!excludeSet.has(entry) && !entry.startsWith('.')) {
          walk(full);
        }
      } else if (st.isFile() && ALLOWED_EXTENSIONS.has(extname(full))) {
        files.push(full);
      }
    }
  }
  walk(dir);
  return files;
}

function tokenNameToCategory(name) {
  const rest = name.replace(/^--p31-/, '');
  if (rest.startsWith('bg') || rest.startsWith('surface')) return 'color';
  if (rest.startsWith('accent') || rest.startsWith('text')) return 'color';
  if (rest.startsWith('glass')) return 'glass';
  if (rest.startsWith('glow')) return 'glow';
  if (rest.startsWith('blur')) return 'blur';
  if (rest.startsWith('spacing') || rest.startsWith('space')) return 'spacing';
  if (rest.startsWith('radius')) return 'spacing';
  if (rest.startsWith('font') || rest.startsWith('type') || rest.startsWith('typography')) return 'typography';
  if (rest.startsWith('duration') || rest.startsWith('easing') || rest.startsWith('animation')) return 'animation';
  if (rest.startsWith('scale')) return 'spacing';
  if (rest.startsWith('icon') || rest.startsWith('header') || rest.startsWith('nav')) return 'component';
  if (rest.startsWith('color')) return 'color';
  if (rest.startsWith('ref')) return 'reference';
  if (rest.startsWith('sys')) return 'system';
  return 'other';
}

function extractTokens(cssPath) {
  const content = readFileSync(cssPath, 'utf-8');
  const tokens = [];
  const regex = /(--p31-[\w-]+)\s*:/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    tokens.push(match[1]);
  }
  return [...new Set(tokens)];
}

function scanTokenReferences(files, allTokens, tokenSourcePath) {
  const tokenSet = new Set(allTokens);
  const usage = {};
  for (const token of allTokens) {
    usage[token] = { count: 0, files: [] };
  }

  for (const file of files) {
    if (file === tokenSourcePath) continue;
    let content;
    try { content = readFileSync(file, 'utf-8'); } catch { continue; }
    const tokensFoundInFile = new Set();
    const varRefRegex = /var\((--p31-[\w-]+)/g;
    let varMatch;
    while ((varMatch = varRefRegex.exec(content)) !== null) {
      if (tokenSet.has(varMatch[1])) tokensFoundInFile.add(varMatch[1]);
    }
    const declRefRegex = /(--p31-[\w-]+)\s*:/g;
    let declMatch;
    while ((declMatch = declRefRegex.exec(content)) !== null) {
      if (tokenSet.has(declMatch[1])) tokensFoundInFile.add(declMatch[1]);
    }
    const dataAttrRegex = /data-mcp-[\w-]+/g;
    while (dataAttrRegex.exec(content) !== null) {
      /* count data-mcp-* occurrences */
    }

    if (tokensFoundInFile.size > 0) {
      for (const token of tokensFoundInFile) {
        usage[token].count++;
        const relPath = relative(ROOT, file);
        if (usage[token].files.length < 5) {
          usage[token].files.push(relPath);
        }
      }
    }
  }

  return usage;
}

function categorizeTokens(usage) {
  const byCategory = {};
  for (const [token, info] of Object.entries(usage)) {
    const cat = tokenNameToCategory(token);
    if (!byCategory[cat]) byCategory[cat] = {};
    byCategory[cat][token] = info;
  }
  return byCategory;
}

function run() {
  const tokenSourcePath = resolveTokens(ROOT, config.tokenSourceFile);
  const allTokens = extractTokens(tokenSourcePath);
  const allFiles = [];
  for (const dir of config.scanDirs) {
    const absDir = resolve(ROOT, dir);
    allFiles.push(...walkFiles(absDir, config.excludeDirs));
  }

  const usage = scanTokenReferences(allFiles, allTokens, tokenSourcePath);
  const total = allTokens.length;
  const used = Object.values(usage).filter(u => u.count > 0).length;
  const unused = total - used;

  const byCategory = categorizeTokens(usage);

  const report = {
    generated: new Date().toISOString(),
    totalTokensDefined: total,
    tokensUsed: used,
    tokensUnused: unused,
    usagePercent: total > 0 ? ((used / total) * 100).toFixed(1) : '0.0',
    unusedPercent: total > 0 ? ((unused / total) * 100).toFixed(1) : '0.0',
    tokens: usage,
    categories: {},
  };

  for (const [cat, tokens] of Object.entries(byCategory)) {
    report.categories[cat] = {
      total: Object.keys(tokens).length,
      used: Object.values(tokens).filter(t => t.count > 0).length,
      unused: Object.values(tokens).filter(t => t.count === 0).length,
    };
  }

  console.log(`Token Usage Report — ${report.generated}`);
  console.log('='.repeat(60));
  console.log(`Total tokens defined: ${total}`);
  console.log(`Tokens used: ${used} (${report.usagePercent}%)`);
  console.log(`Tokens unused: ${unused} (${report.unusedPercent}%)`);
  console.log('');

  console.log('Token Details:');
  console.log('-'.repeat(60));
  for (const token of allTokens.sort()) {
    const info = usage[token];
    const cat = tokenNameToCategory(token);
    const status = info.count > 0 ? 'USED' : 'UNUSED';
    console.log(`${token}  [${cat}]  ${status}  (${info.count} files)`);
    if (info.files.length > 0) {
      for (const f of info.files) {
        console.log(`  └ ${f}`);
      }
    }
  }

  console.log('');
  console.log('Unused Tokens (by category):');
  console.log('-'.repeat(60));
  const unusedByCategory = {};
  for (const token of allTokens) {
    if (usage[token].count === 0) {
      const cat = tokenNameToCategory(token);
      if (!unusedByCategory[cat]) unusedByCategory[cat] = [];
      unusedByCategory[cat].push(token);
    }
  }
  for (const [cat, tokens] of Object.entries(unusedByCategory).sort()) {
    console.log(`  ${cat} (${tokens.length}):`);
    for (const t of tokens) {
      console.log(`    ${t}`);
    }
  }

  writeFileSync(config.outputFile, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\nReport written to ${config.outputFile}`);
  process.exit(0);
}

run();
