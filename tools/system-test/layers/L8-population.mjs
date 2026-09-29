import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(here, '..', 'out', 'report.json')

export async function run() {
  const failures = []
  const checks = []

  // Read the just-written report and assert every layer emitted a non-empty
  // population manifest (the "empty input set is a green lie" guard).
  if (!existsSync(OUT)) {
    return {
      id: 'L8', name: 'Population honesty',
      passed: false,
      checks: [],
      failures: ['report.json missing — L8 must run after the full suite'],
      manifest: { population: 'layer manifests', count: 0, expectedMinimum: 8 },
    }
  }

  const report = JSON.parse(readFileSync(OUT, 'utf8'))
  const layers = report.layers ?? []

  // L8 reads the report mid-run: the 7 layers before it have written their
  // manifests; L8's own is computed at the end. So expect ≥7 at read time.
  if (layers.length < 7) {
    failures.push(`only ${layers.length} prior layers in report — expected ≥7 (population-blind)`)
  }

  let manifestCount = 0
  for (const l of layers) {
    const manifest = l.manifest
    if (!manifest || typeof manifest.count !== 'number') {
      failures.push(`${l.id}: no population manifest (population-blind)`)
      continue
    }
    if (manifest.count === 0) {
      failures.push(`${l.id}: population=0 — scanned nothing, returned green (population-blind)`)
      continue
    }
    if (typeof manifest.expectedMinimum === 'number' && manifest.count < manifest.expectedMinimum) {
      failures.push(`${l.id}: population=${manifest.count} < expectedMinimum=${manifest.expectedMinimum}`)
    }
    checks.push(`${l.id}: pop=${manifest.count} ≥ min=${manifest.expectedMinimum}`)
    manifestCount++
  }

  return {
    id: 'L8', name: 'Population honesty',
    passed: failures.length === 0,
    checks,
    failures,
    manifest: { population: 'layer manifests in report.json', count: manifestCount, expectedMinimum: 8 },
  }
}