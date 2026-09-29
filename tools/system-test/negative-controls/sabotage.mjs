#!/usr/bin/env node
/**
 * Sabotage — the system test suite's own negative control.
 *
 * Per-layer injections, each asserting a NAMED FAILURE CLASS (Ota rule: a
 * generic crash does not count — the failure must match the declared reason).
 * Emits NEGATIVE_CONTROL_OK only if every injection produces its declared
 * class. Runs each injection TWICE to prove the NC itself is deterministic.
 */
import { readFileSync, writeFileSync, copyFileSync, rmSync, mkdtempSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { tmpdir } from 'node:os'
import { execSync } from 'node:child_process'

const ROOT = '/home/p31'
const GOVERN = `${ROOT}/P31-local-workspace/packages/govern`
const TEST = `${ROOT}/P31-local-workspace/tools/system-test`

// Residue guard: a leftover .sabotage-bak or __nc__* fixture from a prior run
// means the last teardown did NOT complete — the system may be carrying
// forward corruption. Scans every tree the suite's NCs can mutate, including
// design-core/src where the canon-purity NC writes its NaN fixture.
// __nc__* files that are TRACKED by git are intentional committed fixtures
// (e.g. design-core's negative-control intent); only UNTRACKED ones are
// residue from an interrupted run.
function assertNoResidue() {
  const found = execSync(
    `find ${ROOT}/P31-local-workspace/packages/govern ${ROOT}/P31-local-workspace/tools/phos-forge ${ROOT}/P31-local-workspace/packages/design-core/src \\( -name '*.sabotage-bak' -o -name '__nc__*' \\) 2>/dev/null`,
    { encoding: 'utf8' },
  ).trim().split('\n').filter(Boolean)
  // Tracked set: committed fixtures are intentional, not residue. Compute once.
  const tracked = new Set(
    execSync(`git -C ${ROOT}/P31-local-workspace ls-files`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim().split('\n').filter(Boolean),
  )
  // Only flag files that are NOT tracked (i.e. leftover residue, not committed fixtures).
  const repoRoot = `${ROOT}/P31-local-workspace`
  const leftovers = found.filter((f) => {
    const rel = f.replace(repoRoot + '/', '')
    return !tracked.has(rel)
  })
  if (leftovers.length > 0) {
    console.error(`✗ sabotage pre-flight: leftover residue from a prior run: ${leftovers.join(', ')}`)
    console.error('  The previous teardown did not complete — the system may be corrupted.')
    console.error('  Remove the listed files (they are generated fixtures), then re-run.')
    process.exit(1)
  }
}

const INJECTIONS = [
  {
    layer: 'L1',
    name: 'corrupt a runbook path',
    expect: 'missing-runbook',
    setup() {
      // NEVER mutate the real constitution. Copy to /tmp, corrupt the copy,
      // and point L1 at it via --extra-constitution. Same lesson as the
      // gate-self-test recursion fix: the NC must not touch real files.
      this.tmp = mkdtempSync(join(tmpdir(), 'sabotage-l1-'))
      const real = `${GOVERN}/domains/design/constitution.json`
      const copy = join(this.tmp, 'design-sabotage.json')
      copyFileSync(real, copy)
      const con = JSON.parse(readFileSync(copy, 'utf8'))
      if (con.runbooks?.[0]) con.runbooks[0].path = 'runbooks/RUNBOOK-DOES-NOT-EXIST.md'
      // The copy's relative resolutionRoot no longer resolves from /tmp —
      // point it AT the tmp dir so runbook paths resolve there and the
      // missing file is detected (missing-runbook), not cascaded wrong-base.
      con.resolutionRoot = this.tmp
      writeFileSync(copy, JSON.stringify(con, null, 2))
      this.copy = copy
      this.extraEnv = { SYSTEM_TEST_EXTRA_CONSTITUTION: copy }
    },
    teardown() {
      rmSync(this.tmp, { recursive: true, force: true })
      this.copy = null
      this.tmp = null
    },
  },
  {
    layer: 'L4',
    name: 'inject hardcoded model literal',
    expect: 'hardcoded-model-name',
    setup() {
      this.tmp = mkdtempSync(join(tmpdir(), 'sabotage-l4-'))
      const real = `${ROOT}/P31-local-workspace/tools/phos-forge/router.mjs`
      const copy = join(this.tmp, 'router-sabotage.mjs')
      copyFileSync(real, copy)
      writeFileSync(copy, readFileSync(real, 'utf8') + '\nconst _SABOTAGE_MODEL = "@cf/moonshotai/kimi-k2.6";\n')
      this.copy = copy
      this.extraEnv = { SYSTEM_TEST_ROUTER_PATH: copy }
      // Backup the real one in case we need to verify later (never touched).
      this.real = real
    },
    teardown() {
      rmSync(this.tmp, { recursive: true, force: true })
      this.copy = null
      this.real = null
    },
  },
  {
    layer: 'L6',
    name: 'patch token guard to no-op',
    expect: 'guard-not-fail-closed',
    setup() {
      this.tmp = mkdtempSync(join(tmpdir(), 'sabotage-l6-'))
      const real = `${ROOT}/P31-local-workspace/tools/phos-forge/router.mjs`
      const copy = join(this.tmp, 'router-sabotage.mjs')
      copyFileSync(real, copy)
      let src = readFileSync(copy, 'utf8')
      src = src.replace(
        /throw new Error\('\[router\] Workers AI not configured[^)]*\);/,
        "console.warn('guard patched (sabotage)');",
      )
      writeFileSync(copy, src)
      this.copy = copy
      this.extraEnv = { SYSTEM_TEST_ROUTER_PATH: copy }
    },
    teardown() {
      rmSync(this.tmp, { recursive: true, force: true })
      this.copy = null
    },
  },
  {
    layer: 'L5',
    name: 'point replayCommand at a deleted file',
    expect: 'replay-command-failed',
    setup() {
      // Write the sabotage pack to /tmp and point L5 at it via env override —
      // NEVER write into the real content dir.
      this.tmp = mkdtempSync(join(tmpdir(), 'sabotage-l5-'))
      this.packPath = join(this.tmp, '_sabotage.json')
      writeFileSync(this.packPath, JSON.stringify({
        kind: 'memo', theme: 'scene', filename: '_sabotage.docx',
        date: '2026-09-28', subject: 'sabotage', title: 'sabotage',
        body: [{
          type: 'evidence',
          claim: 'sabotage', value: 'x', source: 'sabotage',
          verified: '2026-09-28',
          replayCommand: 'cat /nonexistent/path/evidence.md',
          verificationCostMinutes: 1,
        }],
      }, null, 2))
      this.extraEnv = { SYSTEM_TEST_EXTRA_PACK: this.packPath }
    },
    teardown() {
      rmSync(this.tmp, { recursive: true, force: true })
      this.packPath = null
      this.extraEnv = null
    },
  },
]

function runLayer(id, env = {}) {
  let out = ''
  try {
    out = execSync(`node ${TEST}/run.mjs --layer=${id}`, { encoding: 'utf8', cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, ...env } })
  } catch (e) {
    out = String(e.stdout ?? '') + String(e.stderr ?? '')
  }
  return out
}

async function runOnce() {
  const results = []
  for (const inj of INJECTIONS) {
    let outcome = 'not-caught'
    const t0 = Date.now()
    try {
      inj.setup()
      console.log(`    [${inj.layer}] setup+run ${inj.name}…`)
      // The env override routes the layer at the /tmp copy, NOT the real file.
      const env = inj.extraEnv ?? {}
      const out = runLayer(inj.layer, env)
      if (out.includes(inj.expect)) outcome = 'caught-classified'
      else if (out.includes('SYSTEM_TEST_FAILED')) outcome = 'caught-unclassified'
      else outcome = 'not-caught'
    } catch (e) {
      outcome = `setup-error: ${e.message.slice(0, 80)}`
    } finally {
      inj.teardown()
    }
    results.push({ layer: inj.layer, name: inj.name, expect: inj.expect, outcome, ms: Date.now() - t0 })
  }
  return results
}

async function main() {
  console.log('SABOTAGE — system test NC')
  console.log('═'.repeat(60))

  assertNoResidue()

  const run1 = await runOnce()
  const run2 = await runOnce()

  // Determinism: compare outcomes + classes, EXCLUDING timing (ms varies).
  const strip = (runs) => runs.map(({ layer, name, expect, outcome }) => ({ layer, name, expect, outcome }))
  const deterministic = JSON.stringify(strip(run1)) === JSON.stringify(strip(run2))
  console.log(deterministic ? '  ✓ NC deterministic (run1 == run2, ignoring ms)' : '  ✗ NC NONDETERMINISTIC')

  let allClassified = true
  for (const r of run1) {
    const mark = r.outcome === 'caught-classified' ? '✓' : '✗'
    console.log(`  ${mark} ${r.layer} ${r.name} → ${r.outcome}${r.outcome === 'caught-unclassified' ? ` (expected ${r.expect})` : ''}`)
    if (r.outcome !== 'caught-classified') allClassified = false
  }

  if (!allClassified || !deterministic) {
    console.error('sabotage NC: some injection was NOT caught with its named class, or the NC is nondeterministic.')
    process.exit(1)
  }
  console.log('NEGATIVE_CONTROL_OK')
}

main().catch((e) => { console.error('sabotage crashed:', e); process.exit(1) })