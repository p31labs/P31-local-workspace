#!/usr/bin/env tsx
/**
 * @file storybook-to-catalog.mts
 * Generates `src/genui/catalog.ts` (Zod-validated component catalog) and a
 * `catalog.json` sidecar for the design-mcp Worker (no zod at runtime).
 *
 * Sources:
 *   - cli/tokens/components.yml → canonical `src/componentDefs.ts`
 *   - storybook-static/manifests/components.json (Storybook componentsManifest)
 *
 * Run: pnpm storybook:manifest   (builds Storybook, then runs this script)
 */

import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { COMPONENT_DEFS, COMPONENT_CATEGORIES, type ComponentDef } from '../src/componentDefs'

const CATEGORY_VALUES = [...COMPONENT_CATEGORIES]

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const MANIFEST_PATH = resolve(ROOT, 'storybook-static', 'manifests', 'components.json')
const OUT_DIR = resolve(ROOT, 'src', 'genui')
const OUT_TS = resolve(OUT_DIR, 'catalog.ts')
const OUT_JSON = resolve(OUT_DIR, 'catalog.json')

let manifest: { components?: Record<string, any> } = {}
try {
  manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'))
} catch (err) {
  console.warn('[storybook-to-catalog] manifest missing — running with canonical defs only:', (err as Error).message)
}

const manifestComponents = manifest.components || {}

interface PropInfo {
  type: string
  required: boolean
  default: string | null
  description: string
}

interface CatalogEntry {
  name: string
  description: string
  cssClass: string
  category: (typeof COMPONENT_CATEGORIES)[number]
  source: 'canonical' | 'generated'
  importPath: string
  version: string
  status: 'stable' | 'beta' | 'deprecated'
  tokens: string[]
  variants: string[]
  slots: string[]
  accessibility: string[]
  props: Record<string, PropInfo>
  aiGuidance: { useWhen: string[]; avoidWhen: string[]; examples: string[] }
  stories: { id: string; name: string; snippet: string }[]
  storySource: string | null
}

function defProps(def: ComponentDef): Record<string, PropInfo> {
  const out: Record<string, PropInfo> = {}
  for (const [name, p] of Object.entries(def.props || {})) {
    const info: PropInfo = {
      type: p.type,
      required: !!p.required,
      default: p.default !== undefined ? JSON.stringify(p.default) : null,
      description: p.description || '',
    }
    out[name] = info
  }
  return out
}

function kebab(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

function manifestStories(name: string): { id: string; name: string; snippet: string }[] {
  const entry = Object.values(manifestComponents).find((c: any) => c.name === name)
  if (!entry || !Array.isArray(entry.stories)) return []
  return entry.stories.map((s: any) => ({
    id: s.id ?? '',
    name: s.name ?? '',
    snippet: s.snippet ?? '',
  }))
}

function manifestSource(name: string): string | null {
  const entry = Object.values(manifestComponents).find((c: any) => c.name === name)
  return entry?.path ?? null
}

function docgenProps(name: string): Record<string, PropInfo> {
  const entry = Object.values(manifestComponents).find((c: any) => c.name === name)
  const docgen = entry?.reactDocgen
  if (!docgen || !docgen.props) return {}
  const out: Record<string, PropInfo> = {}
  for (const [propName, raw] of Object.entries<any>(docgen.props)) {
    const tsType = raw?.tsType
    const typeText = tsType?.raw || tsType?.name || 'unknown'
    const def = raw?.defaultValue
    out[propName] = {
      type: typeText,
      required: !!raw?.required,
      default: def?.value != null ? String(def.value) : null,
      description: raw?.description || '',
    }
  }
  return out
}

const entries: CatalogEntry[] = []

for (const [name, def] of Object.entries(COMPONENT_DEFS)) {
  entries.push({
    name,
    description: def.description,
    cssClass: def.css_class,
    category: def.category,
    source: 'canonical',
    importPath: def.importPath || '@p31ca/design-core/compositions',
    version: def.version || '2.2.0',
    status: def.status || 'stable',
    tokens: def.tokens || [],
    variants: def.variants || [],
    slots: def.slots || [],
    accessibility: def.accessibility || [],
    props: defProps(def),
    aiGuidance: {
      useWhen: def.aiGuidance?.useWhen || [],
      avoidWhen: def.aiGuidance?.avoidWhen || [],
      examples: def.aiGuidance?.examples || [],
    },
    stories: manifestStories(name),
    storySource: manifestSource(name),
  })
}

for (const key of Object.keys(manifestComponents)) {
  const c = manifestComponents[key]
  if (c.error || !c.name) continue
  if (entries.some((e) => e.name === c.name)) continue
  entries.push({
    name: c.name,
    description: c.description || `Auto-generated component surfaced from the Storybook manifest (${c.path || key}).`,
    cssClass: kebab(c.name),
    category: 'surface',
    source: 'generated',
    importPath: '@p31ca/design-core/generated',
    version: '2.2.0',
    status: 'stable',
    tokens: [],
    variants: [],
    slots: [],
    accessibility: [],
    props: docgenProps(c.name),
    aiGuidance: { useWhen: [], avoidWhen: [], examples: [] },
    stories: manifestStories(c.name),
    storySource: c.path ?? null,
  })
}

entries.sort((a, b) => a.name.localeCompare(b.name))

const catalogPayload = {
  v: 2,
  generatedAt: new Date().toISOString(),
  components: entries,
}

const entriesTs = '[\n' + entries
  .map((e) => '  ' + JSON.stringify(e, null, 2).replace(/\n/g, '\n  '))
  .join(',\n') + '\n]'

const output = `/**
 * @file genui/catalog.ts — Agent-facing component catalog.
 * GENERATED by scripts/storybook-to-catalog.mts. DO NOT EDIT.
 *
 * Merges canonical COMPONENT_DEFS with the Storybook components manifest
 * (stories + snippets). Validated by Zod for every consumer.
 *
 * Regenerate: pnpm storybook:manifest
 */

import { z } from 'zod'

const ComponentPropSchema = z.object({
  type: z.string(),
  required: z.boolean(),
  default: z.string().nullable(),
  description: z.string(),
})

const AiGuidanceSchema = z.object({
  useWhen: z.array(z.string()),
  avoidWhen: z.array(z.string()),
  examples: z.array(z.string()),
})

const StoryInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  snippet: z.string(),
})

export const ComponentEntrySchema = z.object({
  name: z.string(),
  description: z.string(),
  cssClass: z.string(),
  category: z.enum(${JSON.stringify(CATEGORY_VALUES).replace(/"/g, "'")} as any),
  source: z.enum(['canonical', 'generated']),
  importPath: z.string(),
  version: z.string(),
  status: z.enum(['stable', 'beta', 'deprecated']),
  tokens: z.array(z.string()),
  variants: z.array(z.string()),
  slots: z.array(z.string()),
  accessibility: z.array(z.string()),
  props: z.record(z.string(), ComponentPropSchema),
  aiGuidance: AiGuidanceSchema,
  stories: z.array(StoryInfoSchema),
  storySource: z.string().nullable(),
})

export const CatalogSchema = z.object({
  v: z.number(),
  generatedAt: z.string(),
  components: z.array(ComponentEntrySchema),
})

export const COMPONENT_CATALOG = ${entriesTs} as const

export const catalog: z.infer<typeof CatalogSchema> = CatalogSchema.parse(COMPONENT_CATALOG)

export type Catalog = z.infer<typeof CatalogSchema>
export type CatalogComponent = z.infer<typeof ComponentEntrySchema>
export type { ComponentPropSchema, AiGuidanceSchema, StoryInfoSchema }
`

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(OUT_TS, output)
writeFileSync(OUT_JSON, JSON.stringify(catalogPayload, null, 2) + '\n')

console.log(`Generated ${OUT_TS} (${entries.length} components, ${(output.length / 1024).toFixed(1)} KB)`)
console.log(`Generated ${OUT_JSON} (${(catalogPayload.components.length / 1).toFixed(0)} entries)`)