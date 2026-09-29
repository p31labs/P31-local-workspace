import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'

const GOVERN = '/home/p31/P31-local-workspace/packages/govern'

export async function run() {
  const checks = []
  const failures = []

  // Sabotage override: SYSTEM_TEST_EXTRA_CONSTITUTION points L1 at a /tmp
  // copy so the NC never mutates real files. Merge it into the population.
  const extra = process.env.SYSTEM_TEST_EXTRA_CONSTITUTION

  // Population: enumerate all constitutions
  const cons = [resolve(GOVERN, 'constitution.json')]
  for (const d of readdirSync(resolve(GOVERN, 'domains'))) {
    const p = resolve(GOVERN, 'domains', d, 'constitution.json')
    if (existsSync(p)) cons.push(p)
  }
  if (extra && existsSync(extra)) cons.push(resolve(extra))
  const population = cons.length
  const expectedMinimum = 6 // govern + 5 domains

  if (population < expectedMinimum) {
    failures.push(`population=${population} < expectedMinimum=${expectedMinimum} (a constitution was removed or the glob missed it)`)
  }

  for (const conPath of cons) {
    const con = JSON.parse(readFileSync(conPath, 'utf8'))
    const rel = conPath.replace(GOVERN + '/', '')
    const domainRoot = dirname(conPath)
    const resolutionRoot = con.resolutionRoot
      ? resolve(domainRoot, con.resolutionRoot)
      : domainRoot

    // Every runbook resolves
    for (const rb of con.runbooks ?? []) {
      const p = resolve(resolutionRoot, rb.path)
      if (!existsSync(p)) failures.push(`${rel}: ${rb.id} → ${p} (missing-runbook)`)
    }
    // Every gate has owner/NC/OQE and remediation resolves
    for (const g of con.gates ?? []) {
      if (!g.owner) failures.push(`${rel}: gate ${g.id} missing owner`)
      if (!g.negativeControl) failures.push(`${rel}: gate ${g.id} missing negativeControl`)
      if (!g.oqe) failures.push(`${rel}: gate ${g.id} missing oqe`)
      if (g.remediation && !g.remediation.startsWith('docs/')) {
        const p = resolve(resolutionRoot, g.remediation)
        if (!existsSync(p)) failures.push(`${rel}: gate ${g.id} remediation → ${p} (missing-runbook)`)
      }
    }
    // K₄ at BLOCKING
    if (con.gates?.some((g) => g.state === 'BLOCKING')) {
      const who = con.review?.who
      if (!who || !who.user || !who.issuer || !who.ledger || !who.court) {
        failures.push(`${rel}: BLOCKING domain missing four-party review (k4-violation)`)
      }
    }
    // Mirror parity gate names a real gate
    for (const m of con.mirrors ?? []) {
      if (m.parityGate && !con.gates?.some((g) => g.id === m.parityGate)) {
        failures.push(`${rel}: mirror parityGate "${m.parityGate}" names a nonexistent gate`)
      }
    }
    checks.push(rel)
  }

  return {
    id: 'L1', name: 'Constitutional integrity',
    passed: failures.length === 0,
    checks,
    failures,
    manifest: {
      population: 'domains/*/constitution.json + govern/constitution.json',
      count: population,
      expectedMinimum,
    },
  }
}