#!/usr/bin/env node
/**
 * validate-core.mjs
 *
 * Cycle 1 gate. Four checks against docs/00-CANONICAL-CORE.yaml:
 *
 *   1. COMPLETENESS    — every artifact in inventory.json has exactly one row
 *   2. SINGLE-LAYER    — every row declares one layer in {L0,L1,L2,L3,retire}
 *   3. NO RETIRE REFS  — nothing marked `retire` is depended on by an active row
 *   4. LAYER DISCIPLINE— no L3 imports an L2 contract's internals; no L2 imports an L3 surface
 *
 * Exits 0 if all pass, 1 if any fail. Prints a precise failure list.
 *
 * Usage: node scripts/validate-core.mjs
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'

const ROOT = process.cwd()
const INVENTORY = join(ROOT, 'inventory.json')
const CORE = join(ROOT, 'docs', '00-CANONICAL-CORE.yaml')

const VALID_LAYERS = new Set(['L0', 'L1', 'L2', 'L3', 'retire'])
const VALID_STATUS = new Set(['active', 'retire', 'consolidate', 'migrate-later'])

function fail(list, msg) {
  list.push(msg)
}
function layerOf(row) {
  return row.layer ?? row.status === 'retire' ? 'retire' : null
}

function main() {
  const problems = []

  // --- inputs ---
  if (!existsSync(INVENTORY)) {
    console.error('✖ missing inventory.json — run scripts/generate-core-inventory.mjs first')
    process.exit(1)
  }
  if (!existsSync(CORE)) {
    console.error('✖ missing docs/00-CANONICAL-CORE.yaml')
    process.exit(1)
  }
  const inventory = JSON.parse(readFileSync(INVENTORY, 'utf-8'))
  const core = parseYaml(readFileSync(CORE, 'utf-8'))

  const artifactPath = new Set(inventory.artifacts.map((a) => a.path))
  const rows = (core.entries ?? []).map((r) => ({ ...r }))
  const byPath = new Map(rows.map((r) => [r.path, r]))

  if (!core.version) fail(problems, 'missing version')
  if (!Array.isArray(rows)) fail(problems, 'entries must be an array')
  if (rows.length === 0) { fail(problems, 'no entries — core is empty'); return print(problems) }

  // --- 1. COMPLETENESS ---
  const rowPaths = new Set(rows.map((r) => r.path))
  for (const a of inventory.artifacts) {
    if (!rowPaths.has(a.path)) fail(problems, `UNCLASSIFIED: ${a.path} (${a.name}) has no row`)
  }
  for (const r of rows) {
    if (!artifactPath.has(r.path)) fail(problems, `GHOST ROW: "${r.path}" is not an artifact in inventory.json`)
  }

  // --- 2. SINGLE-LAYER ---
  for (const r of rows) {
    const layers = [r.layer, r.status === 'retire' ? 'retire' : null].filter(Boolean)
    if (r.status === 'retire') {
      if (r.layer !== undefined) fail(problems, `DOUBLE STATE: "${r.path}" is retire but also declares layer=${r.layer}`)
    } else {
      if (!r.layer) fail(problems, `NO LAYER: "${r.path}" needs layer (L0..L3)`)
      else if (!VALID_LAYERS.has(r.layer) || r.layer === 'retire') fail(problems, `BAD LAYER: "${r.path}" layer="${r.layer}"`)
    }
    if (r.status && !VALID_STATUS.has(r.status)) fail(problems, `BAD STATUS: "${r.path}" status="${r.status}"`)
    if (r.owns !== undefined && !Array.isArray(r.owns)) fail(problems, `BAD OWNS: "${r.path}" owns must be a list`)
    if (r.must_not !== undefined && !Array.isArray(r.must_not)) fail(problems, `BAD MUST_NOT: "${r.path}" must_not must be a list`)
  }

  // --- 3. NO RETIRE REFS ---
  // weighted by package.json dependency names across active rows
  const retireRows = rows.filter((r) => r.status === 'retire')
  if (retireRows.length) {
    const depsIndex = buildDepIndex(inventory)
    for (const r of retireRows) {
      const consumers = depsIndex[r.path] ?? []
      if (consumers.length) {
        fail(problems, `RETIRED BUT USED: "${r.path}" is depended on by ${consumers.join(', ')}`)
      }
    }
  }

  // --- 4. LAYER DISCIPLINE (import scan) ---
  const l3 = rows.filter((r) => r.layer === 'L3')
  const l2 = rows.filter((r) => r.layer === 'L2')
  for (const surface of l3) {
    const hits = scanImports(surface, l2.map((r) => r.path))
    for (const h of hits) fail(problems, `L3→L2 INTERNAL: "${surface.path}" imports ${h}`)
  }
  for (const contract of l2) {
    const hits = scanImports(contract, l3.map((r) => r.path))
    for (const h of hits) fail(problems, `L2→L3 IMPORT: "${contract.path}" imports ${h}`)
  }

  print(problems)
}

function buildDepIndex(inventory) {
  const index = {}
  for (const a of inventory.artifacts) {
    const pkgPath = join(a.path, 'package.json')
    if (!existsSync(pkgPath)) continue
    let pkg
    try { pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) } catch { continue }
    const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}), ...(pkg.peerDependencies ?? {}) }
    for (const [name] of Object.entries(deps)) {
      // map dep name back to an artifact path by package name
      const target = inventory.artifacts.find((x) => x.name === name)
      if (target) {
        index[target.path] = index[target.path] ?? []
        index[target.path].push(a.path)
      }
    }
  }
  return index
}

function scanImports(row, peerPaths) {
  const hits = []
  for (const peer of peerPaths) {
    if (!peer || row.path.startsWith(peer)) continue
    // look for import of peer's package root or internals within row's src
    const basename = peer.split('/').pop()
    const pkgName = basename.replace(/-/g, '-')
    const probe = `${pkgName}/`
    // cheap scan: read row's package.json + first-order src refs
    const srcs = candidateSources(row)
    for (const s of srcs) {
      if (!existsSync(s)) continue
      let body = ''
      try { body = readFileSync(s, 'utf-8') } catch { continue }
      if (body.includes(`@p31/${basename.replace('@p31/', '')}`) || body.includes(`from '${basename.replace(/^@p31\//, '')}'`) || body.includes(`from '${pkgName}'`)) {
        hits.push(`from @p31/${basename}`)
        break
      }
    }
  }
  return dedupe(hits)
}

function candidateSources(row) {
  const base = row.path
  const out = []
  for (const extra of ['src/index.ts', 'src/index.tsx', 'index.ts', 'src/lib/index.ts', 'src/main.ts', 'src/worker.ts', 'src/index.mjs', 'index.mjs']) {
    const p = join(base, extra)
    if (existsSync(p)) out.push(p)
  }
  // include all .ts/.tsx/.js/.mjs under src up to depth 2
  walkSrc(base, 0, 2, out)
  return out
}

function walkSrc(dir, depth, max, out) {
  if (depth > max) return
  let entries
  try { entries = readdirSync(dir) } catch { return }
  for (const e of entries) {
    if (['node_modules', 'dist', 'build', '.git'].includes(e)) continue
    const full = join(dir, e)
    let st
    try { st = statSync(full) } catch { continue }
    if (st.isDirectory()) walkSrc(full, depth + 1, max, out)
    else if (/\.(ts|tsx|js|mjs|x)$/.test(e)) out.push(full)
  }
}

function dedupe(arr) { return [...new Set(arr)] }

function print(problems) {
  if (problems.length === 0) {
    console.log('✓ canonical core valid — all gates pass')
    process.exit(0)
  }
  console.error(`✖ canonical core INVALID — ${problems.length} problem(s):`)
  for (const p of problems) console.error(`  - ${p}`)
  process.exit(1)
}

main()