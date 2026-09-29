#!/usr/bin/env node
/**
 * @p31ca/canon — gen-tokens.mjs
 *
 * THE ONLY token writer. There is exactly one source of truth —
 * ../../src/theming/theme-store.ts (THEMES + BASE) — and this script
 * derives every artifact from it:
 *
 *   1. dist/tokens.css  — :root carries BASE + DEFAULT_THEME palette,
 *                         and one [data-theme="<id>"] block per theme,
 *                         ALL variable names are the runtime
 *                         --p31-* names. Constant names, per-theme
 *                         values. No second namespace can ever exist.
 *   2. tokens/tokens.dtc.json — W3C DTCG-shaped portable export
 *                         (primitives + per-theme semantic groups).
 *   3. Style Dictionary then VALIDATES the emitted DTCG file. SD does
 *                         not generate CSS; it only proves the export
 *                         is spec-conformant. Any parse failure exits 1.
 *
 * Everything in this file reads THEMES/BASE — nothing here owns a
 * value. A value you cannot find in theme-store.ts does not exist.
 *
 * Run: node scripts/gen-tokens.mjs  (from packages/canon)
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import StyleDictionary from 'style-dictionary'
import { THEMES, THEME_IDS, DEFAULT_THEME, BASE, SEMANTIC_MAP, GLOBAL_COMPAT, COMPAT_ROOT, CONDITIONAL_CSS } from '../src/theming/theme-store.ts'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const distDir = join(root, 'dist')
const tokensDir = join(root, 'tokens')
const dtcgPath = join(tokensDir, 'tokens.dtc.json')

mkdirSync(distDir, { recursive: true })
mkdirSync(join(tokensDir, 'dist'), { recursive: true })

/** Map a --p31-* name to its DTCG $type. */
function typeFor(name) {
  if (name === 'glass-shadow' || name.startsWith('glow-')) return 'shadow'
  if (name.startsWith('font-')) return 'fontFamily'
  if (name.startsWith('duration-')) return 'duration'
  if (name.endsWith('-ms')) return 'duration'
  if (name.startsWith('easing-') || name.startsWith('spring-')) return 'cubicBezier'
  if (name.startsWith('z-') || name === 'speed-factor' || name.includes('tint')) return 'number'
  if (
    name.startsWith('scale-') || name.startsWith('radius-') ||
    name.startsWith('space-') || name.startsWith('spacing-') ||
    name.startsWith('type-') || name.startsWith('blur-') ||
    name.startsWith('touch-') || name === 'base' ||
    name === 'topbar-height' || name === 'glass-blur' ||
    name === 'glass-radius' || name === 'card-padding' ||
    ['h1', 'h2', 'h3', 'h4', 'body', 'body-sm', 'label', 'caption'].includes(name)
  ) return 'dimension'
  return 'color'
}

// ---------------------------------------------------------------------
// CSS-string -> DTCG structured value converters.
// theme-store.ts holds CSS-native values (oklch(...), 16px, calc(...)).
// The strict DTCG 2025.10 schema requires structured $value objects, not
// CSS strings — SD's validation is lenient, dtokens check is strict. These
// converters emit the structured form so the file conforms to the schema it
// declares. CSS-function values (calc/var/blur) have NO portable DTCG form;
// they are excluded from the DTCG export (they belong to the CSS-emit layer).
// ---------------------------------------------------------------------

const CSS_FUNCTION_RE = /^(calc|var|clamp|min|max|blur|drop-shadow)\(/

function oklchToObject(value) {
  const m = String(value).match(/^oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+)\s*(?:\/\s*([\d.]+%?))?\s*\)$/i)
  if (!m) return null
  const num = (s) => (typeof s === 'string' && s.endsWith('%') ? parseFloat(s) / 100 : parseFloat(s))
  const components = [num(m[1]), num(m[2]), num(m[3])]
  return m[4] !== undefined ? { colorSpace: 'oklch', components, alpha: num(m[4]) } : { colorSpace: 'oklch', components }
}

function dimToObject(value) {
  const m = String(value).match(/^([\d.]+)([a-z%]*)$/i)
  if (!m) return null
  // A bare `0` dimension is semantically 0px — DTCG rejects empty unit.
  const unit = m[2] || (parseFloat(m[1]) === 0 ? 'px' : '')
  return { value: parseFloat(m[1]), unit }
}

function cubicToArray(value) {
  // Accept both '0.4 0 0.2 1' and 'cubic-bezier(0.4, 0, 0.2, 1)' forms.
  const m = String(value).match(/cubic-bezier\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/i)
  const parts = m
    ? [m[1], m[2], m[3], m[4]].map(Number)
    : String(value).trim().split(/\s+/).map(Number)
  return parts.length === 4 && parts.every((n) => !Number.isNaN(n)) ? parts : null
}

function fontFamilyToArray(value) {
  return String(value).split(',').map((s) => s.replace(/['"]/g, '').trim()).filter(Boolean)
}

// Emit a strict-DTCG $value for a given $type + raw CSS string.
// Returns null for css-function values (not portable) and unparseable values.
function dtcgValue(type, raw) {
  if (typeof raw !== 'string') return raw
  if (raw.startsWith('{') && raw.endsWith('}')) return raw // alias ref
  if (CSS_FUNCTION_RE.test(raw)) return null // calc/var/blur — not portable
  switch (type) {
    case 'color': return oklchToObject(raw)
    case 'dimension': return dimToObject(raw)
    case 'duration': return dimToObject(raw)
    case 'fontFamily': return fontFamilyToArray(raw)
    case 'cubicBezier': return cubicToArray(raw)
    case 'number': {
      const n = parseFloat(raw)
      return Number.isNaN(n) ? null : n
    }
    case 'boxShadow': return raw // shadow strings stay as CSS — flagged below
    case 'shadow': return null // composite shadow parsing is a separate concern; not portable as a string
    default: return raw
  }
}

/** Build a DTCG token node, converting CSS-string values to structured form. */
function dt(value, type, desc) {
  const structured = dtcgValue(type, value)
  const node = { $value: structured ?? value, $type: type }
  if (structured === null) {
    // css-function value: mark non-portable so the export step can drop it.
    node.$description = `${desc ?? ''} [css-dependent: '${value}']`.trim()
  } else if (desc) {
    node.$description = desc
  }
  return node
}

/** '--p31-scale-xs' -> 'scale-xs' */
function bare(name) {
  return name.replace(/^--p31-/, '')
}

// ---------------------------------------------------------------------
// 1. DTCG export — both semantic AND per-theme palette
// ---------------------------------------------------------------------
// The DTCG tree serves TWO consumers with different questions:
//
//   - `p31.*` = semantic slots (contract-resolvable)
//       Contracts resolve against this tree; a token not in SEMANTIC_MAP
//       cannot be referenced by any contract (validate-contracts hard-fails).
//       Default-theme value in $value, per-theme overrides in $extensions.p31.themes.
//
//   - `themes.<id>.p31.*` = full per-theme palette (informational, not contract-resolvable)
//       A designer who opens tokens.dtc.json to see "what colors exist in cipher"
//       needs the raw palette, not just semantic slots. This section carries every
//       token from THEMES[id].tokens per theme.
//
// Two questions, two answers, one file. That's what DTCG is for.
// Contracts resolve against p31.* only (namespace gate in validate-contracts).
// External consumers (Figma, Tokens Studio) inspect themes.<id>.* for palettes.

/** Reduce an OKLCH color's chroma component, preserving hue + lightness. */
function reduceChroma(value, chroma) {
  const m = value.match(/^oklch\(([^\s]+)\s+([^\s]+)\s+([^\s/]+)(\s*\/\s*[^)]+)?\)$/)
  if (!m) return value
  return `oklch(${m[1]} ${chroma} ${m[3]}${m[4] ?? ''})`
}

/** Resolve a semantic slot for a specific theme. */
function resolveSlot(slot, themeId) {
  if (slot.literal !== undefined) return slot.literal
  const paletteKey = `--p31-${slot.palette}`
  const palette = THEMES[themeId]?.tokens?.[paletteKey]
  if (!palette) return undefined
  let value = palette
  if (slot.chroma !== undefined) value = reduceChroma(value, slot.chroma)
  if (slot.opacity === undefined) return value
  // OKLCH opacity: inject `/ alpha` before the closing paren.
  return value.replace(/\)$/, ` / ${slot.opacity})`)
}

const p31 = {}

// Primitives (theme-agnostic)
for (const [full, value] of Object.entries(BASE)) {
  const name = bare(full)
  const node = dt(value, typeFor(name))
  // css-dependent (calc/var/blur) — no portable DTCG form; skip.
  if ((node.$description ?? '').includes('css-dependent')) continue
  p31[name] = node
}

// design-core compatibility tokens (Phase 1 absorption) — same namespace,
// verbatim values, no reconciliation yet.
for (const [full, value] of Object.entries(GLOBAL_COMPAT)) {
  const name = bare(full)
  const node = dt(value, typeFor(name))
  if ((node.$description ?? '').includes('css-dependent')) continue
  p31[name] = node
}

// Semantic slots — default-theme value in $value, per-theme map in $extensions
for (const [path, slot] of Object.entries(SEMANTIC_MAP)) {
  const defaultValue = resolveSlot(slot, DEFAULT_THEME)
  // Convert the default value to structured DTCG; css-dependent slots are
  // dropped from the contract-resolvable tree (they are not portable).
  const defaultStructured = dtcgValue(slot.type, defaultValue)
  if (defaultStructured === null) continue // css-dependent — not portable
  const node = { $value: defaultStructured, $type: slot.type }

  // Per-theme overrides ride along; Style Dictionary ignores unknown $extensions.
  const themesExt = {}
  for (const id of THEME_IDS) {
    const v = resolveSlot(slot, id)
    const sv = dtcgValue(slot.type, v)
    if (v !== undefined && sv !== null && JSON.stringify(sv) !== JSON.stringify(defaultStructured)) themesExt[id] = sv
  }
  if (Object.keys(themesExt).length) {
    node.$extensions = { p31: { themes: themesExt } }
  }

  // Nest under `p31` using dotted path — e.g. 'color.action.primary' → p31.color.action.primary
  const parts = path.split('.')
  let cursor = p31
  for (let i = 0; i < parts.length - 1; i++) {
    cursor = cursor[parts[i]] ??= {}
  }
  cursor[parts[parts.length - 1]] = node
}

// ---------------------------------------------------------------------
// 1b. Per-theme palette blocks — for external consumers (Figma, Tokens Studio)
// ---------------------------------------------------------------------
// The p31.* semantic tree is contract-resolvable. But a designer who opens
// the DTCG to see "what colors exist in the cipher theme" needs the FULL
// palette, not just semantic slots. This section emits themes.<id>.p31.*
// with every token from THEMES[id].tokens, so both needs are met:
//   - p31.* = contract-resolvable semantic namespace
//   - themes.<id>.p31.* = per-theme palette (informational, not contract-resolvable)
//
// Two questions, two answers, one file. That's what DTCG is for.
const themes = {}
for (const id of THEME_IDS) {
  const themeP31 = {}
  for (const [full, value] of Object.entries(THEMES[id].tokens)) {
    const name = bare(full)
    const node = dt(value, typeFor(name))
    if ((node.$description ?? '').includes('css-dependent')) continue
    themeP31[name] = node
  }
  themes[id] = { p31: themeP31 }
}

// DTCG top-level metadata. `$schema` declares the Format Module version this
// export conforms to; `$extensions.p31` carries the vendor namespace (P31)
// with version + provenance. This matches the version @p31ca/design-core already
// declares in its manifest.json so the two token systems agree on one spec
// revision. NOTE: "2025.10" is the best-known current snapshot available
// offline; bump it here AND in design-core/manifest.json once a newer snapshot
// is verified against design-tokens.org.
const dtcg = {
  $schema: 'https://design-tokens.org/schemas/format/2025.10',
  $extensions: {
    p31: {
      version: '2025.10',
      name: 'P31 Labs Design System',
      description: 'Design canon DTCG export — primitives, semantic slots, per-theme palettes.',
    },
  },
  p31,
  themes,
  component: {},
}
writeFileSync(dtcgPath, JSON.stringify(dtcg, null, 2) + '\n')

// ---------------------------------------------------------------------
// 2. CSS output — runtime names, [data-theme] selectors
// ---------------------------------------------------------------------
/**
 * Resolve every SEMANTIC_MAP slot to a --p31-<dashed-path> CSS var for one
 * theme. This is what makes the semantic tier a RUNTIME contract, not just a
 * DTCG naming layer: components read `var(--p31-color-action-primary)`, which
 * must resolve in CSS exactly as `p31.color.action.primary` resolves in DTCG.
 */
function semanticCssVars(themeId) {
  const vars = {}
  for (const [path, slot] of Object.entries(SEMANTIC_MAP)) {
    const value = resolveSlot(slot, themeId)
    if (value === undefined) continue
    vars[`--p31-${path.split('.').join('-')}`] = value
  }
  return vars
}

/** Emit `selector { --p31-*: value; }` from a theme's palette + semantic vars. */
function cssBlock(selector, themeId, { globals = false, compatRoot = false } = {}) {
  const tokens = {
    ...(globals ? GLOBAL_COMPAT : {}),
    ...THEMES[themeId].tokens,
    ...semanticCssVars(themeId),
  }
  // Compat root values win over the theme palette AND the semantic slots at
  // :root (e.g. canon's semantic radius.md literal vs design-core's palette
  // --p31-radius-md). Themes keep canon's semantic values.
  if (compatRoot) Object.assign(tokens, COMPAT_ROOT)
  const lines = Object.entries(tokens)
    .map(([prop, value]) => `  ${prop}: ${value};`)
    .join('\n')
  return `${selector} {\n${lines}\n}\n`
}

// Layer order is declared once. Later layers win. The declaration must appear
// before any layered rule. Consumers override from unlayered CSS regardless;
// layered rules inside p31.components can be beaten by p31.utilities.
const LAYER_ORDER = '@layer p31.tokens, p31.reset, p31.base, p31.layout, p31.components, p31.utilities;\n'

let css = '/**\n * @p31ca/canon — tokens.css. Do not edit directly; run `pnpm gen:tokens`.\n * Derived from src/theming/theme-store.ts (single source of truth).\n * Names are the runtime --p31-* contract; values change per theme.\n * Palette vars (--p31-bg, --p31-accent, …) AND semantic slots\n * (color.action.*, space.inline.*, font.size.*, motion.*) are emitted here.\n */\n\n'
css += LAYER_ORDER + '\n'
css += '@layer p31.tokens {\n'
css += cssBlock(':root', DEFAULT_THEME, { globals: true, compatRoot: true })
for (const id of THEME_IDS) {
  css += '\n' + cssBlock(`[data-theme="${id}"]`, id)
}
css += '}\n'
css += '\n/* ── design-core compatibility (unlayered) — Phase 1 absorption ── */\n'
css += CONDITIONAL_CSS
writeFileSync(join(distDir, 'tokens.css'), css)

// ---------------------------------------------------------------------
// 2b. Typed name contract — src/tokens.ts
// ---------------------------------------------------------------------
// The `:root` block defines the full --p31-* name set (BASE + compat +
// default-theme palette + semantic slots + compat-root overrides). Emit that
// exact set as a TypeScript union so consumers (Canvas resolvers, fallback
// maps, manifest schemas) type their keys against real canon names — a
// typo'd token name becomes a compile error, not a silent fallback. Additive:
// nothing here changes tokens.css or the DTCG export.
const nameSet = new Set()
for (const full of Object.keys(BASE)) nameSet.add(full)
for (const full of Object.keys(GLOBAL_COMPAT)) nameSet.add(full)
for (const full of Object.keys(THEMES[DEFAULT_THEME].tokens)) nameSet.add(full)
for (const full of Object.keys(COMPAT_ROOT)) nameSet.add(full)
for (const full of Object.keys(semanticCssVars(DEFAULT_THEME))) nameSet.add(full)
const sortedNames = [...nameSet].sort()
const tokensTs = `/**
 * @p31ca/canon — tokens.ts (GENERATED by scripts/gen-tokens.mjs — do not edit).
 * Derived from src/theming/theme-store.ts (single source of truth).
 *
 * The typed name contract for --p31-*. Consumers (Canvas resolvers, fallback
 * maps, manifest schemas) type their keys against P31_TOKEN_NAMES so a
 * typo'd token name is a compile error, not a silent fallback. Values are
 * resolved at runtime from the emitted tokens.css; this file carries names
 * only.
 */

export type P31TokenName = ${sortedNames.map((n) => `'${n}'`).join(' | ')}

export const P31_TOKEN_NAMES: readonly P31TokenName[] = ${JSON.stringify(sortedNames)} as const
`
writeFileSync(join(root, 'src', 'tokens.ts'), tokensTs)

// ---------------------------------------------------------------------
// 3. SD validates the DTCG export (SD never emits CSS here)
// ---------------------------------------------------------------------
try {
  const sd = new StyleDictionary({
    usesDtcg: true,
    source: ['tokens/tokens.dtc.json'],
    platforms: {
      json: {
        transformGroup: 'js',
        buildPath: 'tokens/dist/',
        files: [{ destination: 'tokens.resolved.json', format: 'json/nested' }],
      },
    },
  })
  await sd.hasInitialized
  await sd.buildAllPlatforms()
} catch (err) {
  console.error('\nDTCG VALIDATION FAILED — emitted tokens.dtc.json is not spec-conformant.\n')
  console.error(String(err.message ?? err))
  process.exit(1)
}

const themeCount = THEME_IDS.length
const semanticCount = Object.keys(SEMANTIC_MAP).length
console.log(`gen:tokens — ${themeCount} themes + ${semanticCount} semantic slots from theme-store.ts`)
console.log(`  dist/tokens.css           (${css.length} bytes, ${Object.keys(THEMES[DEFAULT_THEME].tokens).length} vars in :root + ${themeCount} [data-theme] blocks)`)
console.log(`  tokens/tokens.dtc.json    (${(await import('node:fs')).statSync(dtcgPath).size} bytes, DTCG — SD validated)`)