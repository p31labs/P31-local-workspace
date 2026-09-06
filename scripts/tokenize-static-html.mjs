#!/usr/bin/env node
/**
 * Tokenize static HTML component previews.
 *
 * Replaces hardcoded CSS color values with --p31-* design token references.
 *
 * Usage:
 *   node scripts/tokenize-static-html.mjs
 *
 * Input:
 *   packages/design-core/src/generated-html-snapshots/*.html
 * Output:
 *   packages/design-core/src/generated-html-tokenized/*.html
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SOURCE_DIR = path.join(ROOT, 'packages', 'design-core', 'src', 'generated-html-snapshots');
const DEST_DIR = path.join(ROOT, 'packages', 'design-core', 'src', 'generated-html-tokenized');
const TOKENS_CSS = path.join(ROOT, 'packages', 'design-core', 'src', 'css', 'tokens.css');

function extractRootBlock(css) {
  const match = css.match(/:root\s*\{([^}]+)\}/s);
  if (!match) return '';
  return `:root {\n${match[1].trim()}\n}\n`;
}

// Color mapping derived from design-system.json and tokens.css
// Maps exact color values to their CSS custom property references
const COLOR_MAP = new Map([
  // Primitive colors (dark theme)
  ['oklch(10% 0.01 240)', 'var(--p31-bg)'],
  ['oklch(15% 0.015 240)', 'var(--p31-surface)'],
  ['oklch(22% 0.02 240)', 'var(--p31-surface2)'],
  ['oklch(65% 0.18 195)', 'var(--p31-accent)'],
  ['oklch(65% 0.18 285)', 'var(--p31-accent-violet)'],
  ['oklch(65% 0.18 15)', 'var(--p31-accent-gold)'],
  ['oklch(65% 0.18 105)', 'var(--p31-accent-green)'],
  ['oklch(65% 0.18 20)', 'var(--p31-accent-red)'],
  ['oklch(65% 0.18 270)', 'var(--p31-accent-iris)'],
  ['oklch(96% 0.005 240)', 'var(--p31-text)'],
  ['oklch(75% 0.01 240)', 'var(--p31-text-secondary)'],
  ['oklch(55% 0.01 240)', 'var(--p31-text-tertiary)'],
  ['oklch(100% 0.01 240 / 0.04)', 'var(--p31-glass-bg)'],
  ['oklch(100% 0.01 240 / 0.08)', 'var(--p31-glass-border)'],
  ['oklch(100% 0.01 240 / 0.15)', 'var(--p31-glass-border-hover)'],
  ['oklch(100% 0.01 240 / 0.03)', 'var(--p31-glass-bg)'],

  // Hex equivalents (used in generated HTML previews)
  ['#0a0a0f', 'var(--p31-bg)'],
  ['#12121a', 'var(--p31-surface)'],
  ['#1c1c2a', 'var(--p31-surface2)'],
  ['#00f0ff', 'var(--p31-accent)'],
  ['#a78bfa', 'var(--p31-accent-violet)'],
  ['#fbbf24', 'var(--p31-accent-gold)'],
  ['#34d399', 'var(--p31-accent-green)'],
  ['#fb7185', 'var(--p31-accent-red)'],
  ['#818cf8', 'var(--p31-accent-iris)'],
  ['#f5f5f7', 'var(--p31-text)'],
  ['#a1a1aa', 'var(--p31-text-secondary)'],
  ['#050508', 'var(--p31-void-deep)'],

  // RGBA equivalents (used in generated HTML previews)
  ['rgba(245,245,247,0.8)', 'var(--p31-text)'],
  ['rgba(245,245,247,0.6)', 'var(--p31-text-secondary)'],
  ['rgba(245,245,247,0.5)', 'var(--p31-text-secondary)'],
  ['rgba(245,245,247,0.4)', 'var(--p31-text-tertiary)'],
  ['rgba(245,245,247,0.3)', 'var(--p31-text-tertiary)'],
  ['rgba(255,255,255,0.1)', 'var(--p31-glass-border)'],
  ['rgba(255,255,255,0.08)', 'var(--p31-glass-border)'],
  ['rgba(255,255,255,0.06)', 'var(--p31-glass-border)'],
  ['rgba(255,255,255,0.05)', 'var(--p31-glass-border)'],
  ['rgba(255,255,255,0.04)', 'var(--p31-glass-bg)'],
  ['rgba(255,255,255,0.03)', 'var(--p31-glass-bg)'],
  ['rgba(255,255,255,0.02)', 'var(--p31-glass-bg)'],
  ['rgba(255,255,255,0.15)', 'var(--p31-glass-border-hover)'],
  ['rgba(255,255,255,0.12)', 'var(--p31-glass-border-hover)'],
  ['rgba(255,255,255,0.2)', 'var(--p31-glass-border-hover)'],
  ['rgba(0,0,0,0.15)', 'var(--p31-glass-shadow)'],
  ['rgba(0,0,0,0.25)', 'var(--p31-glass-shadow-hover)'],
  ['rgba(0,0,0,0.1)', 'var(--p31-glass-shadow)'],
  ['rgba(10,10,15,0.95)', 'var(--p31-bg)'],

  // Accent colors with opacity (glows, status badges)
  ['rgba(0,240,255,0.5)', 'var(--p31-accent)'],
  ['rgba(0,240,255,0.25)', 'var(--p31-accent)'],
  ['rgba(0,240,255,0.05)', 'var(--p31-accent)'],
  ['rgba(52,211,153,0.2)', 'var(--p31-accent-green)'],
  ['rgba(52,211,153,0.3)', 'var(--p31-accent-green)'],
  ['rgba(251,191,36,0.2)', 'var(--p31-accent-gold)'],
  ['rgba(251,191,36,0.3)', 'var(--p31-accent-gold)'],
  ['rgba(167,139,250,0.2)', 'var(--p31-accent-violet)'],
  ['rgba(167,139,250,0.3)', 'var(--p31-accent-violet)'],
  ['rgba(167,139,150,0.2)', 'var(--p31-accent-violet)'],
  ['rgba(167,139,150,0.3)', 'var(--p31-accent-violet)'],
]);

function tokenizeHtml(html) {
  let result = html;

  // Sort by length descending to replace longer values first
  const sortedEntries = Array.from(COLOR_MAP.entries()).sort((a, b) => b[0].length - a[0].length);

  for (const [value, tokenRef] of sortedEntries) {
    // Skip if already a var() reference
    if (value.startsWith('var(')) continue;

    // Escape for regex
    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Match the value in CSS/HTML, but not inside existing var() or url()
    const regex = new RegExp(`(?<!var\\()${escaped}(?!\\))`, 'gi');
    result = result.replace(regex, tokenRef);
  }

  return result;
}

function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Source directory not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  fs.mkdirSync(DEST_DIR, { recursive: true });

  const files = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.html'));
  console.error(`Tokenizing ${files.length} component previews...`);

  const tokensCss = fs.readFileSync(TOKENS_CSS, 'utf8');
  const rootBlock = extractRootBlock(tokensCss);

  for (const file of files) {
    const srcPath = path.join(SOURCE_DIR, file);
    const destPath = path.join(DEST_DIR, file);

    let html = fs.readFileSync(srcPath, 'utf8');
    html = tokenizeHtml(html);

    if (rootBlock) {
      html = html.replace('<style>', `<style>\n${rootBlock}`);
    }

    fs.writeFileSync(destPath, html);
    console.error(`  Tokenized ${file}`);
  }

  console.error(`\nDone: ${files.length} tokenized files written to ${DEST_DIR}`);
}

main();
