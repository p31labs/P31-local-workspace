import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const GOVERN = '/home/p31/P31-local-workspace/packages/govern'

export async function run() {
  const failures = []
  const checks = []

  // The suite is registered as a BLOCKING gate in the runtime's constitution.
  const conPath = resolve(GOVERN, 'constitution.json')
  const con = JSON.parse(readFileSync(conPath, 'utf8'))
  const gate = con.gates?.find((g) => g.id === 'system-test')
  if (!gate) {
    failures.push('system-test gate not registered in constitution.json')
  } else {
    if (gate.state !== 'BLOCKING') failures.push(`system-test gate state=${gate.state}, expected BLOCKING`)
    if (!gate.negativeControl) failures.push('system-test gate missing negativeControl')
    if (!gate.oqe) failures.push('system-test gate missing oqe')
    checks.push('system-test gate registered as BLOCKING')
  }

  // The sabotage NC exists and can be run (its own ability to fail is the
  // subject of the L7 run via the NC runner).
  const nc = '/home/p31/P31-local-workspace/tools/system-test/negative-controls/sabotage.mjs'
  if (!existsSync(nc)) {
    failures.push('sabotage NC missing (suite cannot fail — furniture)')
  } else {
    checks.push('sabotage NC present')
  }

  return {
    id: 'L7', name: 'Meta',
    passed: failures.length === 0,
    checks,
    failures,
    manifest: { population: 'runtime constitution + sabotage NC', count: checks.length, expectedMinimum: 1 },
  }
}