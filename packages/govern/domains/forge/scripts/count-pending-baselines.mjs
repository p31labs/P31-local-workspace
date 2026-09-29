#!/usr/bin/env node
// count-pending-baselines — count source for the forge domain's
// pending-baselines ratchet. MEASURES, does not constant-emit.
//
// Counts the number of Playwright baseline screenshots the acceptance spec
// expects (toHaveScreenshot calls) that have NOT yet been committed to
// tests/acceptance/__screenshots__/. The spec currently expects 3 (home-volt,
// catalog-omnibus) but no baselines are committed → the honest count.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { resolve, join } from 'node:path'

const portalRoot = resolve('/home/p31/production/portals/forge')
const specPath = resolve(portalRoot, 'tests', 'acceptance', 'forge.spec.ts')
const snapshotsDir = resolve(portalRoot, 'tests', 'acceptance', '__screenshots__', 'forge.spec.ts')

// 1. Expected baselines: count toHaveScreenshot('name.png', …) in the spec.
const spec = existsSync(specPath) ? readFileSync(specPath, 'utf8') : ''
const expected = [...spec.matchAll(/toHaveScreenshot\(['"]([^'"]+)\.png['"]/g)].map((m) => m[1] + '.png')

// 2. Committed baselines: files on disk under the snapshots dir.
const committed = new Set()
if (existsSync(snapshotsDir)) {
  ;(function walk(dir) {
    for (const e of readdirSync(dir)) {
      const p = join(dir, e)
      const s = statSync(p)
      if (s.isDirectory()) walk(p)
      else if (e.endsWith('.png')) committed.add(e)
    }
  })(snapshotsDir)
}

const pending = expected.filter((name) => !committed.has(name))
console.log(`{"count": ${pending.length}}`)
if (pending.length > 0) console.error(`pending baselines: ${pending.join(', ')}`)