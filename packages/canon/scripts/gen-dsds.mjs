#!/usr/bin/env node
/**
 * @p31/canon — gen-dsds.mjs
 *
 * Emits the machine-readable Design System Documentation Spec (DSDS) index:
 *   dsds.json — a graph of seven entity types (components, tokens, themes,
 *   foundations, patterns, guides, chunks), all derived from ground truth:
 *
 *   - components  ← src/contracts/*.contract.ts (same walk as validate-contracts)
 *   - tokens      ← tokens/tokens.dtc.json leaf count + semantic slots from
 *                   theme-store.ts SEMANTIC_MAP
 *   - themes      ← theme-store.ts THEMES (id, label, emoji, description)
 *   - foundations ← the role groups (color/space/radius/font/motion)
 *   - patterns    ← cross-cutting conventions (glass, spoon-motion, portal,
 *                   brand overrides, reduced-motion) — authored, grounded in
 *                   theme-store.ts CONDITIONAL_CSS
 *   - guides      ← the canonical usage rules (token-only values, no hardcoded
 *                   hex, min touch target, etc.)
 *   - chunks      ← reusable doc blocks (OKLCH policy, a11y floor)
 *
 * Nothing here is hand-maintained drift: re-run `node scripts/gen-dsds.mjs`
 * after any contract or token change so the doc index never lies.
 *
 * Run: node scripts/gen-dsds.mjs  (from packages/canon)
 */
import { writeFileSync, readFileSync, readdirSync } from 'node:fs'
import { join, dirname, resolve, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { THEMES, THEME_IDS, DEFAULT_THEME, SEMANTIC_MAP, BASE } from '../src/theming/theme-store.ts'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const contractsDir = join(root, 'src', 'contracts')
const dtcgPath = join(root, 'tokens', 'tokens.dtc.json')
const outPath = join(root, 'dsds.json')

/** Count DTCG leaves that carry a $value. */
function countLeaves(node) {
  if (!node || typeof node !== 'object') return 0
  let n = 0
  for (const [key, value] of Object.entries(node)) {
    if (value && typeof value === 'object' && '$value' in value) n++
    else if (value && typeof value === 'object') n += countLeaves(value)
  }
  return n
}

async function loadComponents() {
  const out = []
  const dropped = []
  for (const entry of readdirSync(contractsDir)) {
    if (!entry.endsWith('.contract.ts')) continue
    try {
      const mod = await import(join(contractsDir, entry).replace(/\\/g, '/'))
      const contract = Object.values(mod).find(
        (v) => typeof v === 'object' && v !== null && 'layer' in v && 'intent' in v,
      )
      if (!contract) throw new Error('no contract export found')
      out.push({
        id: contract.name,
        type: 'component',
        name: contract.name,
        layer: contract.layer,
        status: contract.status,
        description: contract.intent,
        propCount: contract.props.length,
      })
    } catch (err) {
      dropped.push(`${entry}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
  return { out, dropped }
}

async function main() {
  const dtcg = JSON.parse(readFileSync(dtcgPath, 'utf8'))
  const tokenCount = countLeaves(dtcg)

  const { out: components, dropped } = await loadComponents()
  if (dropped.length) {
    console.error('⚠ gen-dsds: dropped contracts:')
    for (const d of dropped) console.error(`   - ${d}`)
  }

  const themes = THEME_IDS.map((id) => ({
    id,
    type: 'theme',
    name: THEMES[id].label,
    emoji: THEMES[id].emoji,
    description: THEMES[id].description,
    default: id === DEFAULT_THEME,
  }))

  const semantic = Object.keys(SEMANTIC_MAP).map((path) => ({
    id: `p31.${path}`,
    type: 'token',
    path: `p31.${path}`,
    tokenType: SEMANTIC_MAP[path].type,
  }))

  const foundations = [
    { id: 'color', type: 'foundation', name: 'Color', description: 'OKLCH primitives + semantic action slots (p31.color.*).' },
    { id: 'space', type: 'foundation', name: 'Space', description: 'Fixed inline scale (p31.space.inline.*) + fluid --p31-space-* steps.' },
    { id: 'radius', type: 'foundation', name: 'Radius', description: 'p31.radius.* slots, from --p31-radius-sm to --p31-radius-full.' },
    { id: 'typography', type: 'foundation', name: 'Typography', description: 'Fluid type scale (--p31-type-*, --p31-scale-*) + font families.' },
    { id: 'motion', type: 'foundation', name: 'Motion', description: 'p31.motion.duration.* / p31.motion.easing.* slots + spoon-mapped speed factor.' },
  ]

  const patterns = [
    { id: 'glass', type: 'pattern', name: 'Glass surface', description: 'Blur + translucent fill via --p31-glass-* tokens; borders scale with elevation.' },
    { id: 'spoon-motion', type: 'pattern', name: 'Spoon-mapped motion', description: '[data-spoons=N] scales --p31-speed-factor and glass blur; 0–1 freezes motion.' },
    { id: 'portal-theming', type: 'pattern', name: 'Portal theming', description: '[data-portal=…] maps --p31-portal-accent/glow per surface.' },
    { id: 'brand-overrides', type: 'pattern', name: 'Brand overrides', description: '[data-brand=…] scopes glass/typography/radius overrides per brand (p31ca, phosphorus31, willow).' },
    { id: 'reduced-motion', type: 'pattern', name: 'Reduced motion', description: 'prefers-reduced-motion: reduce forces --p31-speed-factor: 0.' },
  ]

  const guides = [
    { id: 'token-only-values', type: 'guide', name: 'Token-only values', description: 'Every color/size resolves from a --p31-* token; no hardcoded hex/rgb in component code.' },
    { id: 'no-pure-white', type: 'guide', name: 'No pure white text', description: 'Headings/body use --p31-text-primary (never #fff).' },
    { id: 'min-touch-target', type: 'guide', name: 'Min touch target', description: 'Touch targets ≥ 44px (recommended 48px+).' },
    { id: 'single-accent', type: 'guide', name: 'Single accent', description: 'One primary accent per screen; secondary actions use secondary/ghost slots.' },
  ]

  const chunks = [
    { id: 'oklch-policy', type: 'chunk', name: 'OKLCH policy', description: 'All palette values are OKLCH; no hex pipelines. Legacy hex exists only as compatibility literals.' },
    { id: 'a11y-floor', type: 'chunk', name: 'Accessibility floor', description: 'WCAG 2.2 AA minimum; prefers-reduced-motion respected; focus rings 2px.' },
  ]

  const dsds = {
    spec: 'design-system-documentation-spec',
    version: '1.0',
    name: 'P31 Labs Design System',
    source: 'packages/canon — generated by scripts/gen-dsds.mjs (do not edit)',
    components,
    tokens: {
      count: tokenCount,
      entries: semantic,
      note: 'Semantic slots (p31.*) are contract-resolvable. The full 406-leaf tree (primitives + per-theme palettes) lives in tokens/tokens.dtc.json. Frame tokens (--p31-frame-*) are render metadata, not artifacts — omitted from the field zone graph (see registry.json frames).',
    },
    themes,
    foundations,
    patterns,
    guides,
    chunks,
  }

  writeFileSync(outPath, JSON.stringify(dsds, null, 2) + '\n')
  console.log(`gen-dsds — ${components.length} components, ${tokenCount} tokens, ${themes.length} themes`)
  console.log(`  dsds.json (${Buffer.byteLength(JSON.stringify(dsds))} bytes)`)
}

main()
