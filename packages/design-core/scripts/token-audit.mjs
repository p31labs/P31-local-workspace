#!/usr/bin/env node
/**
 * token-audit.mjs — P31 design-core Quantum Material color gate.
 *
 * Enforces the OKLCH stance: no raw hex (#…) or rgba()/rgb() color literals
 * in design sources (CSS, token sources, generated component styles, recipe
 * data, theme data, manifest). Code/defensive/doc files are allowlisted.
 *
 * Run: node scripts/token-audit.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const ROOT = resolve(process.cwd())
const HEX = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g
const RAW_RGB = /rgba?\(\s*\d/g

/** Files that legitimately contain hex/rgba: code, detectors, canvas, docs, tests. */
const ALLOW = [
  'src/converter/audit.ts',          // hex/rgba DETECTION regexes
  'src/principles.ts',               // documents the hex anti-pattern
  'src/math/colors.ts',              // computation constants (RGB math)
  'src/starfield.ts',                // canvas gradients
  'src/starfield/',                  // canvas jitterbug
  'src/generator/figma-sync.test.ts',
  'src/generator/componentGenerator.wc.test.ts',
  'NotificationDemoPanel.tsx',       // canvas particle demo (consumer portal)
  'Starfield.test.ts',
]

const inAllowed = (f) => ALLOW.some((a) => f === a || f.startsWith(a) || f.endsWith(a))

const isTest = (f) => f.includes('__tests__/') || /\.test\.(ts|tsx|mjs)$/.test(f)

function walk(dir) {
  const out = []
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '.cache') continue
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) out.push(...walk(p))
    else if (/\.(css|ts|tsx|mjs|js|json)$/.test(entry)) out.push(p)
  }
  return out
}

const targets = [...walk(join(ROOT, 'src'))]
for (const extra of [join(ROOT, 'tokens', 'tokens.json'), join(ROOT, 'manifest.json')]) {
  if (existsSync(extra)) targets.push(extra)
}

let failures = 0
for (const file of targets) {
  const rel = relative(ROOT, file)
  if (inAllowed(rel) || isTest(rel)) continue
  const content = readFileSync(file, 'utf8')
  const hex = content.match(HEX)
  const rgb = content.match(RAW_RGB)
  if (hex?.length || rgb?.length) {
    failures++
    console.log(`✗ ${rel}: ${(hex ?? []).slice(0, 4).join(' ')} ${(rgb ?? []).slice(0, 4).join(' ')}`.trim())
  }
}

if (failures) {
  console.log(`\nToken audit FAILED — ${failures} file(s) contain raw color literals.`)
  process.exit(1)
}
console.log('Token audit OK — no raw hex/rgba in design sources.')