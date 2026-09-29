import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = '/home/p31'
const GOVERN = `${ROOT}/P31-local-workspace/packages/govern`
// Sabotage override: SYSTEM_TEST_ROUTER_PATH points L6 at a /tmp copy so the
// NC never mutates the real router. Defaults to the real path.
const ROUTER = process.env.SYSTEM_TEST_ROUTER_PATH ?? `${ROOT}/P31-local-workspace/tools/phos-forge/router.mjs`
const FORGE_ST = `${ROOT}/production/portals/forge/scripts/system-test.mjs`

export async function run() {
  const failures = []
  const checks = []

  // Fail-closed guards must THROW when a dependency is missing (presence scan —
  // the sabotage NC proves the throw actually fires by patching it to no-op).
  const stSrc = existsSync(FORGE_ST) ? readFileSync(FORGE_ST, 'utf8') : ''
  if (!/throw new Error\('esbuild unavailable/.test(stSrc)) {
    failures.push('forge system-test: missing fail-closed esbuild guard (guard-not-fail-closed)')
  } else checks.push('forge system-test: esbuild guard present')

  const routerSrc = existsSync(ROUTER) ? readFileSync(ROUTER, 'utf8') : ''
  if (!/throw new Error\('\[router\] Workers AI not configured/.test(routerSrc)) {
    failures.push('router: missing Workers AI token guard (guard-not-fail-closed)')
  } else checks.push('router: token guard present')

  if (!/throw new Error\('\[router\] no model catalog/.test(routerSrc)) {
    failures.push('router: missing catalog guard (guard-not-fail-closed)')
  } else checks.push('router: catalog guard present')

  // No hardcoded @cf/... model literals in router CODE (comments allowed).
  const codeOnly = routerSrc.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
  const hardcoded = codeOnly.match(/@cf\/[a-z-]+\/[a-z0-9.-]+/g) ?? []
  if (hardcoded.length > 0) {
    failures.push(`router: hardcoded model literal(s) ${hardcoded.join(', ')} (hardcoded-model-name)`)
  } else checks.push('router: zero hardcoded model literals')

  // No secrets in source.
  const secret = /cfut_[A-Za-z0-9]{20,}/
  let leaked = []
  const scan = (file) => {
    if (!existsSync(file)) return
    const src = readFileSync(file, 'utf8')
    if (secret.test(src)) leaked.push(file)
  }
  scan(ROUTER)
  scan(FORGE_ST)
  scan(`${ROOT}/P31-local-workspace/tools/phos-forge/jitterbug.mjs`)
  scan(`${ROOT}/production/portals/forge/src/lib/api.ts`)
  if (leaked.length > 0) {
    failures.push(`secrets in source: ${leaked.join(', ')} (secret-in-source)`)
  } else checks.push('no cfut_ secrets in scanned source')

  return {
    id: 'L6', name: 'Discipline invariants',
    passed: failures.length === 0,
    checks,
    failures,
    manifest: { population: 'guards + router source + secret scan', count: checks.length, expectedMinimum: 4 },
  }
}