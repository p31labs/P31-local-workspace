#!/usr/bin/env node
/**
 * embed-fonts.mjs — inline local font files as base64 data URIs.
 *
 * Research basis: Chromium headless blocks file:// font loads from
 * setContent() pages (the page origin stays about:blank). Fonts silently
 * fall back to system fonts with exit code 0 — a silent failure (career-ops
 * #951, Cloudflare Browser Run docs). The verified fix is to inline each
 * font file as a base64 data: URI in the @font-face rule. No origin, no
 * security policy, works with setContent unchanged.
 *
 * Usage:
 *   node scripts/embed-fonts.mjs --dir ./fonts        # list found fonts
 *   node scripts/embed-fonts.mjs --dir ./fonts --out fonts.css
 * The renderer calls embedFontsAsCss() directly.
 *
 * Fonts are looked up in: <repo>/software/p31-forge/fonts/
 * Supported formats: .woff2, .woff, .ttf, .otf
 * If a font file is absent, that family is skipped and the CSS falls back
 * to the system stack (DejaVu Serif/Sans/Mono on this machine).
 */
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs'
import { resolve, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const DEFAULT_FONT_DIR = resolve(HERE, '..', 'fonts')

const MIME = {
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
}

// The intended type faces. Convention: <family>-<weight>.<ext>.
// If a single file is present it is used for weight 400, style normal.
const FAMILIES = [
  { family: 'Lora', weight: 400, files: ['lora-400.woff2', 'lora-400.ttf'] },
  { family: 'Lora', weight: 700, files: ['lora-700.woff2', 'lora-700.ttf'] },
  { family: 'JetBrains Mono', weight: 400, files: ['jetbrains-mono-400.woff2', 'jetbrains-mono-400.ttf'] },
  { family: 'Plus Jakarta Sans', weight: 400, files: ['plus-jakarta-sans-400.woff2', 'plus-jakarta-sans-400.ttf'] },
  { family: 'Plus Jakarta Sans', weight: 600, files: ['plus-jakarta-sans-600.woff2'] },
]

function readAsBase64(path) {
  return readFileSync(path).toString('base64')
}

/**
 * Build the @font-face CSS with base64 data URIs. Returns the CSS string
 * (possibly empty if no font files are present — the caller uses the
 * system fallback stack in that case).
 */
export function embedFontsAsCss(fontDir = DEFAULT_FONT_DIR) {
  if (!existsSync(fontDir)) return ''
  const present = new Set(readdirSync(fontDir))
  const rules = []
  for (const f of FAMILIES) {
    const file = f.files.find((name) => present.has(name))
    if (!file) continue
    const ext = extname(file).toLowerCase()
    const mime = MIME[ext]
    if (!mime) continue
    const b64 = readAsBase64(resolve(fontDir, file))
    rules.push(
      `@font-face { font-family: '${f.family}'; ` +
        `src: url('data:${mime};base64,${b64}') format('${ext.replace('.', '')}'); ` +
        `font-weight: ${f.weight}; font-style: normal; font-display: swap; }`,
    )
  }
  return rules.join('\n')
}

/** Report which fonts will be embedded vs which fall back. */
export function fontReport(fontDir = DEFAULT_FONT_DIR) {
  const present = existsSync(fontDir) ? new Set(readdirSync(fontDir)) : new Set()
  return FAMILIES.map((f) => {
    const file = f.files.find((name) => present.has(name))
    return { family: f.family, weight: f.weight, file: file ?? null, embedded: Boolean(file) }
  })
}

function main() {
  const di = process.argv.indexOf('--dir')
  const dir = di >= 0 ? process.argv[di + 1] : DEFAULT_FONT_DIR
  const oi = process.argv.indexOf('--out')
  const out = oi >= 0 ? process.argv[oi + 1] : null
  const css = embedFontsAsCss(dir)
  if (out) {
    writeFileSync(out, css, 'utf8')
    console.log(`wrote ${out} (${css.length} chars)`)
  } else {
    console.log(fontReport(dir).map((r) => `${r.embedded ? '✓' : '·'} ${r.family} ${r.weight} ${r.file ?? '(fallback)'}`).join('\n'))
    console.log(`\nembedded css: ${css.length} chars`)
  }
}

if (fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? '')) {
  main()
}