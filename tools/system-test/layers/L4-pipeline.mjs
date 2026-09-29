import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = '/home/p31'
const FORGE = `${ROOT}/P31-local-workspace/software/p31-forge`
// Sabotage override: SYSTEM_TEST_ROUTER_PATH points L4 at a /tmp copy so the
// NC never mutates the real router.
const ROUTER = process.env.SYSTEM_TEST_ROUTER_PATH ?? `${ROOT}/P31-local-workspace/tools/phos-forge/router.mjs`

export async function run() {
  const failures = []
  const checks = []

  // Catalog freshness + count
  const catalogPath = `${ROOT}/P31-local-workspace/tools/phos-forge/models-catalog.json`
  if (!existsSync(catalogPath)) {
    failures.push('model catalog missing (catalog-stale) — run probe-models.mjs')
  } else {
    const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'))
    const count = catalog.models?.length ?? 0
    if (count < 10) failures.push(`catalog count=${count} < 10 (catalog-stale)`)
    else checks.push(`catalog fresh: ${count} models`)
  }

  // No hardcoded @cf/... model literals in router CODE
  if (existsSync(ROUTER)) {
    const src = readFileSync(ROUTER, 'utf8')
    const codeOnly = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
    const hardcoded = codeOnly.match(/@cf\/[a-z-]+\/[a-z0-9.-]+/g) ?? []
    if (hardcoded.length > 0) {
      failures.push(`router: hardcoded model literal(s) ${hardcoded.join(', ')} (hardcoded-model-name)`)
    } else checks.push('router: zero hardcoded model literals')
  } else {
    failures.push('router.mjs missing (pipeline-broken)')
  }

  // Every governance pack compiles through the forge
  const { execSync } = await import('node:child_process')
  const { globSync } = await import('node:fs').then((fs) => fs)
  const { readdirSync } = await import('node:fs')
  const packsDir = resolve(FORGE, 'content/governance')
  const packs = existsSync(packsDir)
    ? readdirSync(packsDir).filter((f) => f.endsWith('.json') && !f.startsWith('_sabotage'))
    : []
  let compiled = 0
  for (const p of packs) {
    try {
      execSync(`node ${FORGE}/forge.js compile ${FORGE}/content/governance/${p} >/dev/null 2>&1`, { cwd: FORGE })
      compiled++
    } catch {
      failures.push(`pack ${p} did not compile (pack-not-compiled)`)
    }
  }
  checks.push(`governance packs compiled: ${compiled}/${packs.length}`)

  // Manifest index == content pack count
  const manifestPath = `${ROOT}/production/portals/forge/src/data/manifest.json`
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    if (manifest.count < packs.length) {
      failures.push(`manifest count=${manifest.count} < content packs=${packs.length} (manifest-stale)`)
    } else checks.push(`manifest indexes ${manifest.count} packs`)
  }

  return {
    id: 'L4', name: 'Pipeline',
    passed: failures.length === 0,
    checks,
    failures,
    manifest: { population: 'catalog + router + governance packs + manifest', count: checks.length, expectedMinimum: 4 },
  }
}