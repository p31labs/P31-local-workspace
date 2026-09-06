#!/usr/bin/env node

import { statSync, readdirSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, extname, join, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

let config;
try {
  config = (await import(resolve(__dirname, 'performance-budget.config.mjs'))).default;
} catch (e) {
  console.error('Failed to load performance-budget.config.mjs:', e.message);
  process.exit(1);
}

const ROOT = resolve(__dirname, '..');
const SCAN_DIRS = ['apps'];
const BUILD_SUBDIRS = ['dist', 'public'];

function collectFiles(baseDir, extensions) {
  const files = [];
  const apps = readdirSync(baseDir).filter(e => !e.startsWith('_') && !e.startsWith('.'));

  for (const app of apps) {
    for (const subdir of BUILD_SUBDIRS) {
      const dir = join(baseDir, app, subdir);
      if (!existsSync(dir)) continue;
      walkDir(dir, file => {
        const ext = extname(file).toLowerCase();
        if (extensions.includes(ext)) {
          const fp = resolve(dir, file);
          files.push({ path: relative(ROOT, fp), sizeBytes: statSync(fp).size });
        }
      });
    }
  }
  return files;
}

function walkDir(dir, cb, prefix = '') {
  let entries;
  try { entries = readdirSync(join(dir, prefix)); } catch { return; }
  for (const entry of entries) {
    const full = join(dir, prefix, entry);
    const rel = prefix ? `${prefix}/${entry}` : entry;
    try {
      if (statSync(full).isDirectory()) {
        walkDir(dir, cb, rel);
      } else {
        cb(rel);
      }
    } catch { /* skip unreadable */ }
  }
}

function formatKB(bytes) {
  return (bytes / 1024).toFixed(1);
}

function bold(s) {
  return `\x1b[1m${s}\x1b[22m`;
}

function red(s) {
  return `\x1b[31m${s}\x1b[0m`;
}

function green(s) {
  return `\x1b[32m${s}\x1b[0m`;
}

// --- Main ---

console.log(bold('\n=== Performance Budget Check ===\n'));

const cssFiles = collectFiles(join(ROOT, ...SCAN_DIRS), ['.css']);
const jsFiles = collectFiles(join(ROOT, ...SCAN_DIRS), ['.js']);
const htmlFiles = collectFiles(join(ROOT, ...SCAN_DIRS), ['.html']);
const imageFiles = collectFiles(join(ROOT, ...SCAN_DIRS), ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif']);

const totalCSSBytes = cssFiles.reduce((s, f) => s + f.sizeBytes, 0);
const totalJSBytes = jsFiles.reduce((s, f) => s + f.sizeBytes, 0);
const totalHTMLBytes = htmlFiles.reduce((s, f) => s + f.sizeBytes, 0);
const totalBytes = totalCSSBytes + totalJSBytes + totalHTMLBytes;

let violations = [];
let passed = true;

function check(label, actualBytes, maxKB, detail) {
  const actualKB = actualBytes / 1024;
  if (actualKB > maxKB) {
    violations.push({ label, actualKB: formatKB(actualBytes), maxKB, detail });
    passed = false;
  }
}

// CSS budget
check('CSS total', totalCSSBytes, config.css.maxSizeKB, cssFiles.map(f => `${f.path} (${formatKB(f.sizeBytes)} KB)`));

// JS budget
check('JS total', totalJSBytes, config.js.maxSizeKB, jsFiles.map(f => `${f.path} (${formatKB(f.sizeBytes)} KB)`));

// Total budget
check('Total (HTML+CSS+JS)', totalBytes, config.total.maxSizeKB,
  `HTML: ${formatKB(totalHTMLBytes)} KB + CSS: ${formatKB(totalCSSBytes)} KB + JS: ${formatKB(totalJSBytes)} KB`
);

// Per-image budget
for (const img of imageFiles) {
  if (img.sizeBytes / 1024 > config.image.maxPerImageKB) {
    violations.push({
      label: 'Image size',
      actualKB: formatKB(img.sizeBytes),
      maxKB: config.image.maxPerImageKB,
      detail: `${img.path} (${formatKB(img.sizeBytes)} KB)`
    });
    passed = false;
  }
}

// Summary
console.log(`CSS files:  ${cssFiles.length} files, ${bold(formatKB(totalCSSBytes))} KB total`);
console.log(`JS files:   ${jsFiles.length} files, ${bold(formatKB(totalJSBytes))} KB total`);
console.log(`HTML files: ${htmlFiles.length} files, ${bold(formatKB(totalHTMLBytes))} KB total`);
console.log(`Images:     ${imageFiles.length} files`);
console.log(`Total size: ${bold(formatKB(totalBytes))} KB`);

if (violations.length > 0) {
  console.log(`\n${red(bold('✖ BUDGET VIOLATIONS'))}\n`);
  for (const v of violations) {
    console.log(`  ${red('✖')} ${v.label}: ${v.actualKB} KB exceeds ${v.maxKB} KB limit`);
    if (v.detail) {
      for (const line of [].concat(v.detail)) {
        console.log(`      ${line}`);
      }
    }
  }
  console.log(`\n${red(bold(`Failed: ${violations.length} budget violation(s)`))}\n`);
} else {
  console.log(`\n${green(bold('✓ All budgets passed'))}\n`);
}

// Write report as JSON for artifact upload
const report = {
  timestamp: new Date().toISOString(),
  totals: {
    cssKB: parseFloat(formatKB(totalCSSBytes)),
    jsKB: parseFloat(formatKB(totalJSBytes)),
    htmlKB: parseFloat(formatKB(totalHTMLBytes)),
    totalKB: parseFloat(formatKB(totalBytes)),
    images: imageFiles.length,
  },
  budgets: {
    css: { limitKB: config.css.maxSizeKB, actualKB: parseFloat(formatKB(totalCSSBytes)), pass: totalCSSBytes / 1024 <= config.css.maxSizeKB },
    js: { limitKB: config.js.maxSizeKB, actualKB: parseFloat(formatKB(totalJSBytes)), pass: totalJSBytes / 1024 <= config.js.maxSizeKB },
    total: { limitKB: config.total.maxSizeKB, actualKB: parseFloat(formatKB(totalBytes)), pass: totalBytes / 1024 <= config.total.maxSizeKB },
    imagePerFile: { limitKB: config.image.maxPerImageKB, pass: imageFiles.every(f => f.sizeBytes / 1024 <= config.image.maxPerImageKB) },
  },
  violations: violations.map(v => ({ label: v.label, actualKB: v.actualKB, maxKB: v.maxKB, detail: [].concat(v.detail).join('\n') })),
  passed,
};

function generateMarkdownReport(r) {
  let md = `# Performance Budget Report\n\n`;
  md += `**Timestamp:** ${r.timestamp}\n\n`;
  md += `## Totals\n\n`;
  md += `| Category | Size |\n|----------|-----|\n`;
  md += `| CSS | ${r.totals.cssKB} KB |\n`;
  md += `| JS | ${r.totals.jsKB} KB |\n`;
  md += `| HTML | ${r.totals.htmlKB} KB |\n`;
  md += `| **Total** | **${r.totals.totalKB} KB** |\n`;
  md += `| Images | ${r.totals.images} files |\n\n`;
  md += `## Budgets\n\n`;
  md += `| Budget | Limit | Actual | Status |\n|--------|-------|--------|--------|\n`;
  for (const [key, b] of Object.entries(r.budgets)) {
    const status = b.pass ? '✅ Pass' : '❌ Fail';
    const actual = 'actualKB' in b ? `${b.actualKB} KB` : '—';
    md += `| ${key} | ${b.limitKB ? b.limitKB + ' KB' : '—'} | ${actual} | ${status} |\n`;
  }
  if (r.violations.length) {
    md += `\n## Violations\n\n`;
    for (const v of r.violations) {
      md += `- **${v.label}:** ${v.actualKB} KB exceeds ${v.maxKB} KB limit\n`;
      md += `  ${v.detail}\n`;
    }
  }
  md += `\n## Result\n\n${r.passed ? '✅ PASSED' : '❌ FAILED'}\n`;
  return md;
}

try {
  const reportDir = resolve(ROOT, 'performance-reports');
  if (!existsSync(reportDir)) mkdirSync(reportDir, { recursive: true });
  writeFileSync(join(reportDir, 'performance-report.json'), JSON.stringify(report, null, 2));
  writeFileSync(join(reportDir, 'performance-report.md'), generateMarkdownReport(report));
} catch { /* non-fatal */ }

process.exit(passed ? 0 : 1);
