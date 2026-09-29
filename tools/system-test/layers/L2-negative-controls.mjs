import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { execSync } from 'node:child_process'

const GOVERN = '/home/p31/P31-local-workspace/packages/govern'

export async function run() {
  const failures = []
  const checks = []

  // Every govern NC emits the marker + exit 0, run TWICE, no residue.
  const ncDir = resolve(GOVERN, 'test/negative-controls')
  const ncs = existsSync(ncDir) ? readdirSync(ncDir).filter((f) => f.endsWith('.mjs')) : []

  for (const nc of ncs) {
    const file = resolve(ncDir, nc)
    for (let run = 1; run <= 2; run++) {
      let out = ''
      let exit = 0
      try {
        out = execSync(`node ${file}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000 })
      } catch (e) {
        exit = e.status ?? 1
        out = String(e.stdout ?? '')
      }
      if (exit !== 0 || !out.includes('NEGATIVE_CONTROL_OK')) {
        failures.push(`${nc} run${run}: exit=${exit}, marker=${out.includes('NEGATIVE_CONTROL_OK')} (nc-missing-marker)`)
      }
    }
    checks.push(`${nc} ×2`)
  }

  // Govern self-test proves every gate can fail
  const domains = ['', 'design', 'monetization', 'justice', 'audit', 'forge']
  let gateTotal = 0
  for (const d of domains) {
    const conPath = d ? resolve(GOVERN, 'domains', d, 'constitution.json') : resolve(GOVERN, 'constitution.json')
    if (!existsSync(conPath)) { failures.push(`missing constitution ${conPath}`); continue }
    const con = JSON.parse(readFileSync(conPath, 'utf8'))
    gateTotal += con.gates?.length ?? 0
    try {
      const out = execSync(`node ${GOVERN}/dist/cli.js self-test ${conPath} 2>&1`, { encoding: 'utf8', cwd: GOVERN })
      if (!out.includes('proven able to fail')) failures.push(`${d || 'govern'}: self-test did not confirm (nc-missing-marker)`)
    } catch {
      failures.push(`${d || 'govern'}: self-test crashed`)
    }
  }
  checks.push(`self-test across ${gateTotal} gates`)

  // Portal meta-gates
  for (const [name, dir] of [['design', `${'/home/p31/production/portals/design'}/tests/acceptance`], ['forge', `${'/home/p31/production/portals/forge'}/tests/acceptance`]]) {
    const meta = resolve(dir, 'gate-self-test.mjs')
    if (!existsSync(meta)) { failures.push(`${name}: meta-gate missing`); continue }
    try {
      const out = execSync(`node ${meta} 2>&1`, { encoding: 'utf8', cwd: dir })
      if (!out.includes('proven able to fail')) failures.push(`${name}: meta-gate did not confirm`)
    } catch {
      failures.push(`${name}: meta-gate crashed`)
    }
  }

  return {
    id: 'L2', name: 'Negative controls proven',
    passed: failures.length === 0,
    checks,
    failures,
    manifest: { population: 'govern NCs + domain gates + portal meta-gates', count: ncs.length + gateTotal, expectedMinimum: 12 },
  }
}