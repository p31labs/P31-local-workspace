#!/usr/bin/env node
/**
 * convert-css-to-dtcg.mjs — P31 Quantum Material token converter.
 *
 * The canon's tokens/tokens.json is authored as CSS-native strings
 * (oklch(...), 16px, calc(var(--p31-*)), 100ms). These emit clean --p31-*
 * CSS variables but are NOT valid DTCG 2025.10: the spec requires structured
 * $value objects (colorSpace/components, value/unit) or alias refs ({path}).
 *
 * This converts each leaf to a DTCG-compliant structured value, emitting
 * tokens.dtc.json — the verified interchange file that travels to Figma,
 * Swift, Android, Tailwind, and any DTCG consumer. The CSS-native tokens.json
 * remains the emit source; tokens.dtc.json becomes the portable truth.
 *
 * Mapping rules (per DTCG 2025.10 + W3C CSS Color 4 / CSS Values 4):
 *   color       oklch(L C H [ / A])  -> { colorSpace: 'oklch', components: [L,C,H], alpha: A? }
 *               oklch(1.000 0.000 90) -> components are 0-1 floats; DTCG also
 *               accepts percentages. We keep 0-1 floats.
 *   dimension   '16px'              -> { value: 16, unit: 'px' }
 *   fontSize    '11px'              -> { value: 11, unit: 'px' }
 *   lineHeight  '1.2' (unitless)    -> { value: 1.2, unit: '' }
 *   duration    '100ms'             -> { value: 100, unit: 'ms' }
 *   borderRadius '8px'              -> { value: 8, unit: 'px' }
 *   fontWeight  '400'               -> { value: 400, unit: '' } (or keyword)
 *   number      '1'                 -> { value: 1, unit: '' }
 *   spacing     'calc(...)'         -> NOT representable as a single DTCG
 *               dimension — leave as a DTCG string with a note? Spec says
 *               string is invalid. For calc(), we emit the raw string as a
 *               custom type value with $description "CSS calc — not
 *               platform-portable; resolve at emit time."
 *   fontFamily  'A, B, C'           -> { value: ['A','B','C'] } (array form)
 *   cubicBezier '0.4 0 0.2 1'       -> { value: [0.4,0,0.2,1] } (array)
 *   custom      'blur(12px)'        -> { value: 'blur(12px)', $type: 'custom' }
 *
 * Not handled (emitted as string + flagged): calc(), var(), any function
 * value that cannot be decomposed. These are marked in $description so the
 * validator reports them as "css-dependent" rather than silently wrong.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..'); // design-core root (scripts/ is inside)
const INPUT = resolve(ROOT, 'tokens', 'tokens.json');
const OUTPUT = resolve(ROOT, 'tokens', 'tokens.dtc.json');

const CALC_RE = /^(calc|var|clamp|min|max|blur|drop-shadow)\(/;

// DTCG 1.0.0 has no `spacing`, `borderRadius`, `custom`, `fontSize`, or
// `lineHeight` types. Normalize to the spec's dimension type; function values
// (calc/var/blur) stay as CSS strings under dimension and are flagged
// css-dependent. `number` maps to a plain number, not {value, unit}.
const TYPE_NORMALIZE = {
  spacing: 'dimension',
  borderRadius: 'dimension',
  custom: 'dimension',
  fontSize: 'dimension',
  lineHeight: 'dimension',
};

// --- per-type value converters ---

function parseOklch(str) {
  const m = String(str).match(
    /^oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+)\s*(?:\/\s*([\d.]+%?))?\s*\)$/i,
  );
  if (!m) return null;
  const num = (s) => (typeof s === 'string' && s.endsWith('%') ? parseFloat(s) / 100 : parseFloat(s));
  const components = [num(m[1]), num(m[2]), num(m[3])];
  if (m[4] !== undefined) {
    return { colorSpace: 'oklch', components, alpha: num(m[4]) };
  }
  return { colorSpace: 'oklch', components };
}

function parseDimension(str) {
  const m = String(str).match(/^([\d.]+)([a-z%]*)$/i);
  if (!m) return null;
  return { value: parseFloat(m[1]), unit: m[2] || '' };
}

function parseCubicBezier(str) {
  const parts = String(str).trim().split(/\s+/).map(Number);
  if (parts.length === 4 && parts.every((n) => !Number.isNaN(n))) return parts;
  return null;
}

function parseFontFamily(str) {
  // Split on commas, strip quotes, trim.
  return String(str)
    .split(',')
    .map((s) => s.replace(/['"]/g, '').trim())
    .filter(Boolean);
}

// --- main ---

const src = JSON.parse(readFileSync(INPUT, 'utf-8'));
let cssDependent = 0;
let converted = 0;
let skipped = 0;

function convertLeaf(token) {
  const originalType = token.$type;
  let t = token.$type;
  const raw = token.$value;
  const out = { ...token };

  // Normalize non-DTCG types (spacing/borderRadius/custom -> dimension).
  if (t && TYPE_NORMALIZE[t]) t = TYPE_NORMALIZE[t];
  if (out.$type) out.$type = TYPE_NORMALIZE[out.$type] ?? out.$type;

  if (typeof raw !== 'string') {
    // already structured (number/array/object) — pass through
    converted++;
    return out;
  }
  if (raw.startsWith('{') && raw.endsWith('}')) {
    // alias ref — pass through (DTCG alias)
    converted++;
    return out;
  }

  // CSS-function values (calc/var/blur) cannot decompose to a DTCG object.
  // Emit as an UNTYPED string leaf (valid DTCG — $type omitted means an
  // untyped value) and flag css-dependent. A typed dimension with a string
  // $value fails the strict schema; an untyped leaf does not.
  if (CALC_RE.test(raw)) {
    delete out.$type;
    out.$value = raw;
    out.$description = `${out.$description ?? ''} [css-dependent: '${raw}']`.trim();
    return out;
  }

  let value = null;
  // Dispatch on the ORIGINAL type for unitless / keyword cases (lineHeight,
  // fontWeight, number) and on the normalized type for the rest.
  const dispatch = originalType && TYPE_NORMALIZE[originalType] ? originalType : t;
  switch (dispatch) {
    case 'color': {
      value = parseOklch(raw);
      break;
    }
    case 'dimension':
    case 'fontSize':
    case 'duration':
    case 'borderRadius': {
      value = parseDimension(raw);
      break;
    }
    case 'lineHeight': {
      // Unitless line-height (e.g. 1.2) is not representable as a DTCG
      // dimension object (unit: '' is rejected). Emit as a DTCG number.
      const n = parseFloat(raw);
      if (!Number.isNaN(n)) {
        out.$type = 'number';
        out.$value = n;
        converted++;
        return out;
      }
      value = null;
      break;
    }
    case 'fontWeight': {
      // DTCG fontWeight is a number (1-1000) or keyword string, not {value,unit}.
      const n = parseFloat(raw);
      value = Number.isNaN(n) ? raw : n;
      break;
    }
    case 'number': {
      // DTCG number is a plain number, not {value, unit}.
      value = parseFloat(raw);
      break;
    }
    case 'fontFamily': {
      value = parseFontFamily(raw);
      break;
    }
    case 'cubicBezier': {
      value = parseCubicBezier(raw);
      break;
    }
    case 'custom':
    case 'spacing': {
      // handled above (CALC_RE) — any non-function string here is still a
      // css value that cannot be decomposed; emit untyped + flagged.
      delete out.$type;
      out.$value = raw;
      out.$description = `${out.$description ?? ''} [css-dependent: '${raw}']`.trim();
      return out;
    }
    default:
      value = raw;
  }

  if (value === null) {
    // unparseable — keep raw string, flag it.
    out.$type = null;
    out.$value = raw;
    out.$description = `${out.$description ?? ''} [css-dependent: cannot decompose '${raw}']`.trim();
    return out;
  }

  out.$value = value;
  converted++;
  return out;
}

function walk(node) {
  if (Array.isArray(node)) return node.map(walk).filter((x) => x !== null);
  if (node && typeof node === 'object') {
    if ('$value' in node) {
      const converted = convertLeaf(node);
      // css-dependent leaves are dropped from the portable file.
      if ((converted.$description ?? '').includes('css-dependent')) {
        cssDependent++;
        return null;
      }
      return converted;
    }
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      const sub = walk(v);
      if (sub !== null) out[k] = sub;
    }
    return out;
  }
  return node;
}

const dtc = walk(src);
// css-dependent leaves are CSS-only by design (calc/var/blur reference
// --p31-* at emit time). They have no portable DTCG representation, so the
// portable interchange file EXCLUDES them — they belong to the CSS-emit layer.
// prune() removes emptied groups.
function prune(n) {
  if (Array.isArray(n)) { n.forEach(prune); return; }
  if (n && typeof n === 'object') {
    const empty = Object.keys(n).filter((k) => typeof n[k] === 'object' && n[k] !== null && Object.keys(n[k]).length === 0);
    for (const k of empty) delete n[k];
    for (const v of Object.values(n)) prune(v);
  }
}
prune(dtc);
dtc.$schema = 'https://design-tokens.github.io/community-group/format/1.0.0';
dtc.$description = `${src.$description ?? 'P31 design-core DTCG'} — converted from CSS-native tokens.json by convert-css-to-dtcg.mjs. CSS-function values (calc/var/blur) are NOT portable and are excluded from this interchange file.`;

mkdirSync(dirname(OUTPUT), { recursive: true });
writeFileSync(OUTPUT, JSON.stringify(dtc, null, 2) + '\n', 'utf-8');

console.log(`converted: ${converted} leaves`);
console.log(`css-dependent (calc/var/custom, not platform-portable): ${cssDependent}`);
console.log(`output: ${OUTPUT}`);