#!/usr/bin/env node
/**
 * P31 build-time APCA contrast validator (Phase 1 — Perceptual Token System).
 *
 * Reads the generated `design-core/src/css/tokens.css`, extracts the top-level
 * `:root` block, and validates text-on-surface token pairs against the APCA
 * (Accessible Perceptual Contrast Algorithm, W3 candidate, SAPC-8 0.0.98G-4g)
 * thresholds derived from the research plan:
 *
 *   |Lc| >= 75   body text (≈ WCAG 2.x AA large… strongest)
 *   |Lc| >= 60   body text (≈ WCAG 2.x AA 4.5:1)
 *   |Lc| >= 45   large / UI text (≈ WCAG 2.x AA 3:1)
 *   |Lc| >= 30   non-text / spot / glow floor
 *
 * Self-contained: implements OKLCH→sRGB→Y→APCA inline (no runtime deps —
 * culori install is unreliable in this workspace; culori was used only at
 * authoring time to derive the neon OKLCH values).
 *
 * Usage:
 *   node validate-apca.mjs [tokens.css] [--json]
 *   node validate-apca.mjs --fail-below 60        # hard-fail below Lc 60
 * Exit code 1 if any pair falls below the minimum threshold.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// ─── APCA 0.0.98G-4g (W3) constants — verbatim from apca-w3 reference ──────
const mainTRC = 2.4;
const normBG = 0.56;
const normTXT = 0.57;
const revTXT = 0.62;
const revBG = 0.65;
const sRco = 0.2126729;
const sGco = 0.7151522;
const sBco = 0.072175;
const blkThrs = 0.022;
const blkClmp = 1.414;
const scaleBoW = 1.14;
const scaleWoB = 1.14;
const loBoWoffset = 0.027;
const loWoBoffset = 0.027;
const deltaYmin = 0.0005;
const loClip = 0.1;

// ─── sRGB → Y (APCA's simple exponent version) ──────────────────────────────
function sRGBtoY(rgb) {
  return (
    sRco * Math.pow(rgb[0] / 255.0, mainTRC) +
    sGco * Math.pow(rgb[1] / 255.0, mainTRC) +
    sBco * Math.pow(rgb[2] / 255.0, mainTRC)
  );
}

// ─── APCAcontrast(txtY, bgY) — verbatim from apca-w3 reference ──────────────
function APCAcontrast(txtY, bgY) {
  if (isNaN(txtY) || isNaN(bgY) || Math.min(txtY, bgY) < 0.0 || Math.max(txtY, bgY) > 1.1) {
    return 0.0;
  }
  txtY = txtY > blkThrs ? txtY : txtY + Math.pow(blkThrs - txtY, blkClmp);
  bgY = bgY > blkThrs ? bgY : bgY + Math.pow(blkThrs - bgY, blkClmp);
  if (Math.abs(bgY - txtY) < deltaYmin) return 0.0;

  let SAPC;
  let outputContrast;
  if (bgY > txtY) {
    // BoW: dark text on light bg → positive
    SAPC = (Math.pow(bgY, normBG) - Math.pow(txtY, normTXT)) * scaleBoW;
    outputContrast = SAPC < loClip ? 0.0 : SAPC - loBoWoffset;
  } else {
    // WoB: light text on dark bg → negative
    SAPC = (Math.pow(bgY, revBG) - Math.pow(txtY, revTXT)) * scaleWoB;
    outputContrast = SAPC > -loClip ? 0.0 : SAPC + loWoBoffset;
  }
  return outputContrast * 100.0;
}

// ─── OKLCH → OKLab → LMS → linear sRGB → sRGB 0..255 (Björn Ottosson) ───────
function oklchToRgb255({ l, c, h, a }) {
  const hr = (h * Math.PI) / 180;
  const L = l;
  const aa = c * Math.cos(hr);
  const bb = c * Math.sin(hr);
  const l_ = L + 0.3963377774 * aa + 0.2158037573 * bb;
  const m_ = L - 0.1055613458 * aa - 0.0638541728 * bb;
  const s_ = L - 0.0894841775 * aa - 1.291485548 * bb;
  const l3 = l_ ** 3;
  const m3 = m_ ** 3;
  const s3 = s_ ** 3;
  const r = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const b = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;
  // linear sRGB → gamma-encoded sRGB (IEC 61966-2-1 OETF)
  const encode = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const rgb = [r, g, b].map((v) => Math.round(encode(clamp(v)) * 255));
  if (a !== undefined && a < 1) rgb.push(a);
  return rgb;
}

// ─── OKLCH string parser: `oklch(90.5% 0.155 194.8 / 0.35)` ────────────────
function parseOklch(str) {
  const m = str.match(
    /oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/i
  );
  if (!m) return null;
  let l = parseFloat(m[1]) / 100;
  let c = parseFloat(m[2]);
  const h = parseFloat(m[3]);
  let a;
  if (m[4] !== undefined) {
    a = m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
  }
  // Handle l values given without % (rare) — assume percent when > 1
  if (m[1].endsWith('%') === false && l > 1) l = l / 100;
  return { l, c, h, a };
}

// ─── Parse the top-level `:root { … }` block of tokens.css ─────────────────
function parseRootDeclarations(css) {
  const declarations = {};
  // Strip comments
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  // Split into selector → body blocks with a brace-depth scanner (top-level
  // blocks only; the root block itself contains nested @media/[data-theme]
  // blocks, so a flat regex cannot capture it).
  let i = 0;
  while (i < css.length) {
    const openIdx = css.indexOf('{', i);
    if (openIdx === -1) break;
    const selector = css.slice(i, openIdx).trim();
    // Scan to the matching close brace
    let depth = 0;
    let j = openIdx;
    for (; j < css.length; j++) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') {
        depth--;
        if (depth === 0) break;
      }
    }
    const body = css.slice(openIdx + 1, j);
    if (/^\s*:root\s*$/.test(selector)) {
      // Extract only declarations at the root block's own depth — nested
      // blocks (@media, [data-theme="light"]) are theme overrides and must
      // not clobber the dark baseline tokens.
      let depth = 0;
      let k = 0;
      let pending = '';
      for (; k < body.length; k++) {
        const ch = body[k];
        if (ch === '{') {
          depth++;
          pending = '';
        } else if (ch === '}') {
          depth--;
          pending = '';
        } else if (depth === 0) {
          pending += ch;
          const dm = pending.match(/^\s*--([A-Za-z0-9-]+)\s*:\s*([^;]+);\s*$/);
          if (dm) {
            declarations[`--${dm[1]}`] = dm[2].trim();
            pending = '';
          }
        }
      }
    }
    i = j + 1;
  }
  return declarations;
}

function resolveAlphaOverBg(foreground, bg) {
  // alpha-blend foreground (0..255, optional alpha) over bg in gamma space
  const alpha = foreground.length === 4 ? foreground[3] : 1;
  if (alpha >= 1) return foreground.slice(0, 3);
  const out = [];
  for (let i = 0; i < 3; i++) {
    out.push(Math.min(Math.round(bg[i] * (1 - alpha) + foreground[i] * alpha), 255));
  }
  return out;
}

// ─── Validation matrix (text token → tier + surfaces to check against) ─────
const ROOT = dirname(fileURLToPath(import.meta.url));
const DEFAULT_CSS = resolve(ROOT, '../src/css/tokens.css');

const MATRIX = [
  // { text, backgrounds, tier }
  // Tier: 'body' | 'large' | 'nontext'
  { text: '--p31-text', backgrounds: ['--p31-bg', '--p31-surface', '--p31-surface-s1', '--p31-surface-s2', '--p31-surface-s3', '--p31-surface-s4'], tier: 'body' },
  { text: '--p31-text-secondary', backgrounds: ['--p31-bg', '--p31-surface', '--p31-surface-s1', '--p31-surface-s2', '--p31-surface-s3', '--p31-surface-s4'], tier: 'body' },
  { text: '--p31-text-tertiary', backgrounds: ['--p31-bg', '--p31-surface', '--p31-surface-s1', '--p31-surface-s2', '--p31-surface-s3', '--p31-surface-s4'], tier: 'body' },
  { text: '--p31-status-online', backgrounds: ['--p31-bg', '--p31-surface-s1'], tier: 'nontext' },
  { text: '--p31-status-offline', backgrounds: ['--p31-bg', '--p31-surface-s1'], tier: 'nontext' },
  { text: '--p31-status-warning', backgrounds: ['--p31-bg', '--p31-surface-s1'], tier: 'nontext' },
  { text: '--p31-status-error', backgrounds: ['--p31-bg', '--p31-surface-s1'], tier: 'nontext' },
  { text: '--p31-status-info', backgrounds: ['--p31-bg', '--p31-surface-s1'], tier: 'nontext' },
  { text: '--p31-neon-cyan', backgrounds: ['--p31-surface-s1', '--p31-surface-s2', '--p31-surface-s3', '--p31-surface-s4'], tier: 'nontext' },
  { text: '--p31-neon-magenta', backgrounds: ['--p31-surface-s1', '--p31-surface-s2', '--p31-surface-s3', '--p31-surface-s4'], tier: 'nontext' },
  { text: '--p31-neon-violet', backgrounds: ['--p31-surface-s1', '--p31-surface-s2', '--p31-surface-s3', '--p31-surface-s4'], tier: 'nontext' },
  { text: '--p31-neon-amber', backgrounds: ['--p31-surface-s1', '--p31-surface-s2', '--p31-surface-s3', '--p31-surface-s4'], tier: 'nontext' },
  { text: '--p31-neon-mint', backgrounds: ['--p31-surface-s1', '--p31-surface-s2', '--p31-surface-s3', '--p31-surface-s4'], tier: 'nontext' },
  { text: '--p31-neon-coral', backgrounds: ['--p31-surface-s1', '--p31-surface-s2', '--p31-surface-s3', '--p31-surface-s4'], tier: 'nontext' },
  { text: '--p31-neon-orange', backgrounds: ['--p31-surface-s1', '--p31-surface-s2', '--p31-surface-s3', '--p31-surface-s4'], tier: 'nontext' },
  { text: '--p31-neon-blue', backgrounds: ['--p31-surface-s1', '--p31-surface-s2', '--p31-surface-s3', '--p31-surface-s4'], tier: 'nontext' },
  { text: '--p31-neon-lavender', backgrounds: ['--p31-surface-s1', '--p31-surface-s2', '--p31-surface-s3', '--p31-surface-s4'], tier: 'nontext' },
  { text: '--p31-neon-pink', backgrounds: ['--p31-surface-s1', '--p31-surface-s2', '--p31-surface-s3', '--p31-surface-s4'], tier: 'nontext' },
  { text: '--p31-neon', backgrounds: ['--p31-surface-s1', '--p31-surface-s2', '--p31-surface-s3', '--p31-surface-s4'], tier: 'nontext' },
];

const TIER_MIN = {
  body: 60,   // ≈ WCAG AA 4.5:1
  large: 45,  // ≈ WCAG AA 3:1
  nontext: 30, // spot / glow floor
};

function main() {
  const args = process.argv.slice(2);
  const jsonOut = args.includes('--json');
  const failBelowArg = args.find((a) => a.startsWith('--fail-below='));
  const failBelow = failBelowArg ? parseFloat(failBelowArg.split('=')[1]) : undefined;
  const cssPath = args.find((a) => !a.startsWith('--')) || DEFAULT_CSS;

  let css;
  try {
    css = readFileSync(cssPath, 'utf8');
  } catch (err) {
    console.error(`Cannot read tokens.css at ${cssPath}: ${err.message}`);
    process.exit(2);
  }

  const tokens = parseRootDeclarations(css);
  const results = [];

  for (const row of MATRIX) {
    const txtRaw = tokens[row.text];
    if (!txtRaw) {
      results.push({ pair: `${row.text} on (missing)`, missing: row.text, ok: true, note: 'token not found — skipped' });
      continue;
    }
    const txtOklch = parseOklch(txtRaw);
    if (!txtOklch) {
      results.push({ pair: `${row.text} (${txtRaw})`, unparsable: true, ok: true, note: 'not an oklch() value — skipped' });
      continue;
    }
    const txtRgb = oklchToRgb255(txtOklch);

    for (const bgName of row.backgrounds) {
      const bgRaw = tokens[bgName];
      if (!bgRaw) continue;
      const bgOklch = parseOklch(bgRaw);
      if (!bgOklch) continue;
      const bgRgb = oklchToRgb255(bgOklch);

      // Alpha-blend text over bg when the text token carries alpha
      const fgRgb = resolveAlphaOverBg(txtRgb, bgRgb);
      const Lc = Math.abs(APCAcontrast(sRGBtoY(fgRgb), sRGBtoY(bgRgb)));
      const min = failBelow ?? TIER_MIN[row.tier];
      const pass = Lc >= min;
      results.push({
        text: row.text,
        bg: bgName,
        tier: row.tier,
        lc: Math.round(Lc * 100) / 100,
        min,
        pass,
      });
    }
  }

  if (jsonOut) {
    console.log(JSON.stringify({ tokens: Object.keys(tokens).length, checks: results }, null, 2));
    const failures = results.filter((r) => r.pass === false);
    process.exit(failures.length ? 1 : 0);
  }

  const failures = results.filter((r) => r.pass === false);
  console.log(`APCA validator — ${results.length} pairs from ${Object.keys(tokens).length} :root tokens`);
  for (const r of results) {
    if (r.note) {
      console.log(`  - ${r.pair ?? `${r.text}`}: ${r.note}`);
    } else {
      console.log(
        `  ${r.pass ? 'PASS' : 'FAIL'}  |Lc|=${String(r.lc).padStart(6)}  min=${r.min}  ${r.text} on ${r.bg}  (${r.tier})`
      );
    }
  }
  if (failures.length) {
    console.error(`\n✖ ${failures.length} contrast violation(s) below |Lc| ${Math.min(...failures.map((f) => f.min))}.`);
    process.exit(1);
  }
  console.log('\n✓ All token pairs meet APCA thresholds.');
  process.exit(0);
}

main();
