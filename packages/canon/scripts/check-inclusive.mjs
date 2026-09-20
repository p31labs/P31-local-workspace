#!/usr/bin/env node
/**
 * @p31/canon — check-inclusive.mjs
 *
 * This grades mechanics (font size, touch targets, hardcoded color), not
 * cognition. Plain-language quality is human review.
 *
 * A static design-gate lint over apps/loom/src. Zero dependencies, plain Node
 * ESM. Exits 0 when clean, 1 when any finding is present.
 *
 *   (a) Font size — flags any `.css` `font-size` below 12px
 *       (`px` < 12, or `rem` < 0.75 at a 16px root).
 *   (b) Hardcoded color — flags `#rrggbb` hex in `.tsx`/`.css`. Allowlist:
 *       the `var(--token, #rrggbb)` fallback argument is fine (it is the
 *       token's own fallback, not a hardcoded color). A hex is a violation
 *       only when it is a real CSS color value (a `.css` declaration value)
 *       or a color string in `.tsx`; fragment ids such as `href="#foo"` are
 *       ignored. Mirrors AGENTS.md's "zero hardcoded hex" gate.
 *       NOTE: JavaScript `0xRRGGBB` literals are ALSO a color format (that is
 *       how three.js/WebGL expresses RGB hex), not "not colors". They are
 *       EXEMPT here by AGENTS.md's "Canvas/Three.js internals may use literals
 *       for performance" carve-out, so this gate scans only `#rrggbb`. That is
 *       a deliberate, documented exclusion — `0x` shader uniforms, PRNG seeds,
 *       and fog/clear colors are not flagged.
 *   (c) Touch targets — for the known interactive selectors, estimates each
 *       rule's hit area and flags anything that suggests a hit below 24px
 *       (WCAG 2.2 SC 2.5.8 AA minimum).
 *
 * Touch-target heuristic (honest, documented): estimated hit height =
 *   vertical padding (top + bottom) + font-size. font-size is read from the
 *   same rule (rem converted at 16px/rem); if absent, a 16px default is
 *   assumed. An explicit `height`/`min-height` (px) overrides the estimate.
 *   This is a static lower-bound estimate of the rendered hit box, not a live
 *   measurement — it cannot see inherited font sizes or line-height.
 *
 * Run: node packages/canon/scripts/check-inclusive.mjs [src-dir]
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..', '..', '..');
const srcDir = resolve(process.argv[2] ?? join(repo, 'apps', 'loom', 'src'));

const ROOT_PX = 16;
const MIN_FONT_PX = 12;
const MIN_FONT_REM = 0.75;
const MIN_TARGET_PX = 24;

const HEX = /#[0-9a-fA-F]{6}/g;
const FONT_SIZE = /font-size:\s*([0-9.]+)(px|rem)/g;

const COPY_TS = join(repo, 'apps', 'loom', 'src', 'lib', 'copy.ts');
const COPY_SCAN_DIRS = [join(repo, 'apps', 'loom', 'src'), join(repo, 'packages', 'field', 'src')];
const MIN_COPY_COVERAGE = 1;

/** Extract the PLAIN map keys from copy.ts (bare identifiers or single-quoted
 *  strings). Comments are skipped. */
function readPlainKeys(copyTsPath) {
  const text = readFileSync(copyTsPath, 'utf8');
  const start = text.indexOf('const PLAIN');
  if (start === -1) return { keys: [], error: 'PLAIN map not found in copy.ts' };
  const open = text.indexOf('{', start);
  const close = text.indexOf('\n};', open);
  if (close === -1) return { keys: [], error: 'PLAIN map is not closed' };
  const body = text.slice(open + 1, close);
  const keys = [];
  for (const line of body.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('//') || t.startsWith('*')) continue;
    const idx = t.indexOf(':');
    if (idx === -1) continue;
    let k = t.slice(0, idx).trim();
    if (k.startsWith("'") && k.endsWith("'")) k = k.slice(1, -1);
    if (k) keys.push(k);
  }
  return { keys };
}

/** Interactive selectors whose hit area is gated. `sel` is the base selector
 *  (pseudo-class / modifier / attribute variants are excluded by requiring a
 *  `{` immediately after the selector, so each shared rule is measured once). */
const TOUCH_SELECTORS = [
  { name: '.loom-btn', sel: String.raw`\.loom-btn` },
  { name: '.jb-btns button', sel: String.raw`\.jb-btns\s+button` },
  { name: '.loom-mode', sel: String.raw`\.loom-mode` },
  { name: '.loom-more', sel: String.raw`\.loom-more` },
  { name: '.ev-follow', sel: String.raw`\.ev-follow` },
  { name: '.ts-back', sel: String.raw`\.ts-back` },
  { name: '.digest-item', sel: String.raw`\.digest-item` },
];

const findings = { font: [], color: [], touch: [] };

function walk(dir) {
  let out = [];
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.git') continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(full));
    else out.push(full);
  }
  return out;
}

const rel = (file) => file.replace(repo + '/', '');

function lineNo(text, index) {
  let n = 1;
  for (let i = 0; i < index; i++) if (text.charCodeAt(i) === 10) n++;
  return n;
}

/** The nearest selector line at or above `idx` (a 0-based line index), so a
 *  finding can report WHICH rule it belongs to. `@media`/`@supports` lines are
 *  skipped in favour of the inner rule. */
function selectorContext(lines, idx) {
  for (let i = idx; i >= 0; i--) {
    const open = lines[i].indexOf('{');
    if (open === -1) continue;
    const sel = lines[i].slice(0, open).trim();
    if (sel && !sel.startsWith('@')) return sel;
  }
  return '';
}

/** Parse a value like `12px`, `0.68rem` into px. Returns null if unparseable. */
function pxValue(value) {
  const m = /^([0-9.]+)\s*(px|rem)?/.exec(value.trim());
  if (!m) return null;
  const n = parseFloat(m[1]);
  const unit = m[2] ?? 'px';
  return unit === 'rem' ? n * ROOT_PX : n;
}

/** Total vertical padding (top + bottom) declared in a rule's declarations. */
function verticalPaddingTotal(decls) {
  const shorthand = decls['padding'];
  if (shorthand !== undefined) {
    const parts = shorthand.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 0;
    const top = pxValue(parts[0]) ?? 0;
    if (parts.length <= 2) return top * 2;
    const bottom = parts.length >= 3 ? (pxValue(parts[2]) ?? 0) : top;
    return top + bottom;
  }
  const top = decls['padding-top'] !== undefined ? (pxValue(decls['padding-top']) ?? 0) : 0;
  const bottom = decls['padding-bottom'] !== undefined ? (pxValue(decls['padding-bottom']) ?? 0) : 0;
  return top + bottom;
}

function fontSizePx(decls) {
  const fs = decls['font-size'];
  if (fs === undefined) return ROOT_PX;
  return pxValue(fs) ?? ROOT_PX;
}

function explicitHeightPx(decls) {
  for (const prop of ['height', 'min-height']) {
    if (decls[prop] === undefined) continue;
    const v = pxValue(decls[prop]);
    if (v !== null) return v;
  }
  return null;
}

/** Split a rule body into a property → value map. Values here never contain
 *  `;` (no data-URLs or strings), so splitting on `;` is safe. */
function parseDecls(block) {
  const decls = {};
  for (const chunk of block.split(';')) {
    const idx = chunk.indexOf(':');
    if (idx === -1) continue;
    const prop = chunk.slice(0, idx).trim().toLowerCase();
    const value = chunk.slice(idx + 1).trim();
    if (prop) decls[prop] = value;
  }
  return decls;
}

/** Is a `#hex` a `var(--token, #hex)` fallback? Checks that it sits after a
 *  comma inside a still-open `var(...)`. All hex inside a var() is a fallback:
 *  CSS custom properties only ever carry a hex as their fallback value. */
function isVarFallback(text, index) {
  const tail = text.slice(0, index);
  let depth = 0;
  let lastComma = -1;
  for (let i = tail.length - 1; i >= 0; i--) {
    const c = tail[i];
    if (c === ')') depth++;
    else if (c === '(') {
      if (depth === 0) {
        if (i >= 3 && tail.slice(i - 3, i) === 'var') return lastComma > i;
        return false;
      }
      depth--;
    } else if (c === ',' && depth === 0) lastComma = i;
  }
  return false;
}

/** A fragment id (`href="#…"`, `id="#…"`, `url(#…)`) is not a color string. */
function isFragmentId(text, index) {
  const tail = text.slice(0, index);
  return /(?:href|id|name|key|target|for)\s*=\s*["']?\s*$/.test(tail) || /url\(\s*$/.test(tail);
}

// ── (a) font size ────────────────────────────────────────────────────────
for (const file of walk(srcDir)) {
  if (!/\.css$/.test(file)) continue;
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');
  let m;
  while ((m = FONT_SIZE.exec(text))) {
    const value = parseFloat(m[1]);
    const unit = m[2];
    const below = unit === 'px' ? value < MIN_FONT_PX : value < MIN_FONT_REM;
    if (!below) continue;
    const n = lineNo(text, m.index);
    const ctx = selectorContext(lines, n - 1);
    const px = unit === 'rem' ? (value * ROOT_PX).toFixed(1) : value;
    findings.font.push({
      where: `${rel(file)}:${n}`,
      detail: `font-size: ${m[0].slice('font-size:'.length).trim()} (≈${px}px)`,
      ctx,
    });
  }
}

// ── (b) hardcoded hex ────────────────────────────────────────────────────
for (const file of walk(srcDir)) {
  const isCss = /\.css$/.test(file);
  if (!isCss && !/\.tsx$/.test(file)) continue;
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');
  let m;
  while ((m = HEX.exec(text))) {
    if (isVarFallback(text, m.index)) continue;
    if (!isCss && isFragmentId(text, m.index)) continue;
    const n = lineNo(text, m.index);
    const ctx = isCss ? selectorContext(lines, n - 1) : '';
    findings.color.push({
      where: `${rel(file)}:${n}`,
      detail: m[0],
      ctx,
    });
  }
}

// ── (c) touch targets ────────────────────────────────────────────────────
for (const file of walk(srcDir)) {
  if (!/\.css$/.test(file)) continue;
  const text = readFileSync(file, 'utf8');
  for (const { name, sel } of TOUCH_SELECTORS) {
    const re = new RegExp(sel + String.raw`\s*\{([^}]*)\}`, 'g');
    let m;
    while ((m = re.exec(text))) {
      const block = m[1];
      const decls = parseDecls(block);
      const explicit = explicitHeightPx(decls);
      const estimated = explicit !== null ? explicit : verticalPaddingTotal(decls) + fontSizePx(decls);
      if (estimated >= MIN_TARGET_PX) continue;
      const n = lineNo(text, m.index);
      const fontSize = fontSizePx(decls);
      const vpad = verticalPaddingTotal(decls);
      const how = explicit !== null ? `height:${explicit}px` : `padding(${vpad}px)+font(${fontSize}px)`;
      findings.touch.push({
        where: `${rel(file)}:${n}`,
        detail: `${name} ≈ ${estimated.toFixed(0)}px hit (${how})`,
        ctx: name,
      });
    }
  }
}

// ── (d) plain-language copy coverage ─────────────────────────────────────
// The PLAIN map in copy.ts is the curated set of technical terms that must
// have a plain-language equivalent. Coverage = share of those terms that are
// still referenced somewhere in the source surface (so the map doesn't rot).
// This measures map → source grounding, NOT source → map completeness: a brand
// new technical term added without a map entry is NOT detected by this check.
const copyReport = { total: 0, dead: [], error: null };
{
  const { keys, error } = readPlainKeys(COPY_TS);
  if (error) {
    copyReport.error = error;
  } else {
    copyReport.total = keys.length;
    for (const key of keys) {
      let found = false;
      outer: for (const dir of COPY_SCAN_DIRS) {
        for (const file of walk(dir)) {
          if (!/\.(ts|tsx|css|mjs)$/.test(file) || file.endsWith('copy.ts')) continue;
          if (readFileSync(file, 'utf8').includes(key)) { found = true; break outer; }
        }
      }
      if (!found) copyReport.dead.push(key);
    }
  }
}

// ── report ───────────────────────────────────────────────────────────────
const total = findings.font.length + findings.color.length + findings.touch.length;
const copyCoverage = copyReport.total === 0 ? 1 : (copyReport.total - copyReport.dead.length) / copyReport.total;
const copyFail = copyReport.error !== null || copyCoverage < MIN_COPY_COVERAGE;

console.log(`\nInclusive design gate — ${rel(srcDir)}\n`);

console.log(`Font size below 12px (${findings.font.length})`);
if (findings.font.length === 0) console.log('  (none)');
for (const f of findings.font) {
  console.log(`  ${f.where}  ${f.detail}${f.ctx ? `  [${f.ctx}]` : ''}`);
}

console.log(`\nHardcoded #rrggbb colors (${findings.color.length}) — 0x three.js literals exempt per AGENTS.md`);
if (findings.color.length === 0) console.log('  (none)');
for (const f of findings.color) {
  console.log(`  ${f.where}  ${f.detail}${f.ctx ? `  [${f.ctx}]` : ''}`);
}

console.log(`\nTouch targets below 24px (${findings.touch.length})`);
if (findings.touch.length === 0) console.log('  (none)');
for (const f of findings.touch) {
  console.log(`  ${f.where}  ${f.detail}`);
}

console.log(`\nPlain-language copy coverage (${copyReport.total - copyReport.dead.length}/${copyReport.total} — ${(copyCoverage * 100).toFixed(0)}%)`);
if (copyReport.error) {
  console.log(`  ${copyReport.error}`);
} else if (copyReport.dead.length === 0) {
  console.log('  all PLAIN terms grounded in source');
} else {
  for (const k of copyReport.dead) console.log(`  uncovered: ${k}`);
}

console.log(`\nSummary: ${total} finding(s) — font ${findings.font.length}, color ${findings.color.length}, touch ${findings.touch.length}${copyFail ? ', copy FAIL' : ''}.`);
console.log('Grades mechanics, not cognition. Plain-language quality is human review.');

process.exit(total === 0 && !copyFail ? 0 : 1);
