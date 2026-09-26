#!/usr/bin/env node
/**
 * migrate-oklch.mjs — P31 design-core Quantum Material color migration.
 *
 * Converts every raw hex (#RRGGBB / #RRGGBBAA) and rgba(...) color literal in
 * design-core sources to OKLCH, applying the canonical hue-270 neutral family
 * where the value is a neutral surface/void/text token. Idempotent.
 *
 * Pure JS — implements the CSS Color 4 OKLab transform inline (Björn Ottosson),
 * so it runs without culori installed.
 */
import { readFileSync, writeFileSync } from 'node:fs'

function linearize(c) {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function rgbToOklab(r, g, b) {
  const [rl, gl, bl] = [r, g, b].map(linearize)
  // sRGB → LMS
  const l = 0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl
  const m = 0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl
  const s = 0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl
  // LMS → Oklab (cube root)
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s)
  return {
    L: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  }
}

function oklchFromRgb(r, g, b, a = null) {
  const { L, a: A, b: B } = rgbToOklab(r, g, b)
  const C = Math.hypot(A, B)
  const H = (Math.atan2(B, A) * 180) / Math.PI
  const h = H < 0 ? H + 360 : H
  let out = `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${Math.round(h)})`
  if (a !== null && a < 1) out = `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${Math.round(h)} / ${Number(a).toFixed(2)})`
  return out
}

function hexToOklch(hex, alpha = null) {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  if (h.length === 6 && alpha === null) {
    // #RRGGBB
  } else if (h.length === 8) {
    alpha = parseInt(h.slice(6, 8), 16) / 255
    h = h.slice(0, 6)
  }
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  return oklchFromRgb(r, g, b, alpha)
}

function rgbaToOklch(m) {
  const r = Number(m[1]) / 255
  const g = Number(m[2]) / 255
  const b = Number(m[3]) / 255
  const a = m[4] !== undefined ? Number(m[4]) : 1
  return oklchFromRgb(r, g, b, a)
}

const HEX = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g
const RGBA = /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+)\s*)?\)/g

/**
 * Neutral family hue shift — the canonical hue-270 quantum-material neutrals.
 * key: substring match on the custom property name.
 */
const NEUTRAL_HUE_SHIFT = {
  // tokens.css / base.css neutral family
  '--p31-void': 270,
  '--p31-surface': 270,
  '--p31-surface2': 270,
  '--p31-bg': 270,
  '--p31-text': 270,
  '--p31-text-secondary': 270,
  '--p31-text-tertiary': 270,
  '--p31-cloud': 270,
  // all.css (style-dictionary) surface + neutral ramps
  '--surface-bg': 270,
  '--surface-surface': 270,
  '--surface-surface2': 270,
  '--surface-text-primary': 270,
  '--surface-text-secondary': 270,
  '--surface-text-tertiary': 270,
  '--color-neutral-': 270,
  '--surface-status-offline': 270,
}

function shiftNeutralHue(content) {
  for (const [name, hue] of Object.entries(NEUTRAL_HUE_SHIFT)) {
    const re = new RegExp(`(${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:\\s*oklch\\([^)]*\\))`, 'g')
    content = content.replace(re, (_m, block) => {
      const hre = /oklch\(([\d.]+%?)\s+([\d.]+)\s+[\d.]+(\s*\/[^)]*)?\)/
      return block.replace(hre, (_b, l, c, alpha) => `oklch(${l} ${c} ${hue}${alpha ?? ''})`)
    })
  }
  return content
}

function migrateFile(file, { shiftNeutrals = false } = {}) {
  let content = readFileSync(file, 'utf8')
  const before = content
  content = content.replace(RGBA, rgbaToOklch)
  content = content.replace(HEX, (m) => hexToOklch(m))
  if (shiftNeutrals) content = shiftNeutralHue(content)
  if (content !== before) {
    writeFileSync(file, content)
    console.log(`  ✎ ${file}`)
  } else {
    console.log(`  · ${file} (no change)`)
  }
}

const args = process.argv.slice(2)
const files = args.filter((a) => !a.startsWith('--'))
const shift = args.includes('--shift-neutrals')
for (const f of files) migrateFile(f, { shiftNeutrals: shift })
console.log(`\nOKLCH migration complete (${files.length} files).`)