#!/usr/bin/env node
/**
 * P31 system test — eight layers, cross-repo.
 *
 * Each layer returns:
 *   { id, name, passed, checks[], failures[], manifest: { population, count, expectedMinimum } }
 *
 * L8 asserts every layer's manifest: count >= expectedMinimum, and count===0 fails.
 *
 * Usage:
 *   node tools/system-test/run.mjs                 # all layers
 *   node tools/system-test/run.mjs --fast          # L1, L3, L6
 *   node tools/system-test/run.mjs --layer L5      # one layer
 *
 * Exit: 0 pass, 1 fail, 2 crash.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const LAYERS = [
  { id: 'L1', name: 'Constitutional integrity', fast: true, mod: './layers/L1-constitutional.mjs' },
  { id: 'L2', name: 'Negative controls proven', fast: false, mod: './layers/L2-negative-controls.mjs' },
  { id: 'L3', name: 'Cross-domain contracts', fast: true, mod: './layers/L3-contracts.mjs' },
  { id: 'L4', name: 'Pipeline', fast: false, mod: './layers/L4-pipeline.mjs' },
  { id: 'L5', name: 'Citation chain', fast: false, mod: './layers/L5-citations.mjs' },
  { id: 'L6', name: 'Discipline invariants', fast: true, mod: './layers/L6-discipline.mjs' },
  { id: 'L7', name: 'Meta', fast: false, mod: './layers/L7-meta.mjs' },
  { id: 'L8', name: 'Population honesty', fast: false, mod: './layers/L8-population.mjs' },
]

const args = process.argv.slice(2)
const fastOnly = args.includes('--fast')
const layerArg = args.find((a) => a.startsWith('--layer='))?.split('=')[1]
  ?? (args.indexOf('--layer') !== -1 ? args[args.indexOf('--layer') + 1] : null)

const report = { startedAt: new Date().toISOString(), layers: [], ok: false }

function log(msg) { console.log(msg) }

async function main() {
  const toRun = layerArg
    ? LAYERS.filter((l) => l.id === layerArg)
    : fastOnly
      ? LAYERS.filter((l) => l.fast)
      : LAYERS

  log('P31 SYSTEM TEST')
  log('═'.repeat(60))

  for (const def of toRun) {
    const t0 = Date.now()
    let result
    try {
      const mod = await import(new URL(def.mod, import.meta.url))
      result = await mod.run()
    } catch (e) {
      result = {
        id: def.id, name: def.name, passed: false,
        checks: [], failures: [`layer crashed: ${e.message}`],
        manifest: { population: null, count: 0, expectedMinimum: 1 },
      }
    }
    result.id = def.id
    result.name = result.name ?? def.name
    result.ms = Date.now() - t0
    report.layers.push(result)

    // Write the report incrementally so L8 (which reads it) sees every layer
    // that has completed, not just a stale file from a previous run.
    mkdirSync(resolve(here, 'out'), { recursive: true })
    writeFileSync(resolve(here, 'out', 'report.json'), JSON.stringify(report, null, 2) + '\n')

    const mark = result.passed ? '✓' : '✗'
    const summary = result.passed
      ? (result.checks.length ? `${result.checks.length} checks, pop=${result.manifest?.count ?? '?'}` : 'pass')
      : `${result.failures.length} failure(s)`
    log(`${mark} ${def.id} ${def.name.padEnd(28)} ${summary} (${result.ms}ms)`)
    if (!result.passed) for (const f of result.failures.slice(0, 3)) log(`     - ${f}`)
  }

  report.ok = report.layers.length > 0 && report.layers.every((l) => l.passed)
  report.finishedAt = new Date().toISOString()

  mkdirSync(resolve(here, 'out'), { recursive: true })
  writeFileSync(resolve(here, 'out', 'report.json'), JSON.stringify(report, null, 2) + '\n')

  log('═'.repeat(60))
  log(report.ok ? '✅ SYSTEM_TEST_OK' : '✗ SYSTEM_TEST_FAILED')
  log('   report → tools/system-test/out/report.json')
  process.exit(report.ok ? 0 : 1)
}

main().catch((e) => {
  console.error('system-test crashed:', e)
  process.exit(2)
})