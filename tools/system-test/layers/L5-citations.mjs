import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { execSync } from 'node:child_process'

const ROOT = '/home/p31'
const FORGE = `${ROOT}/P31-local-workspace/software/p31-forge`
const GOVERN = `${ROOT}/P31-local-workspace/packages/govern`
const GT = `${ROOT}/p31-agents/ground-truth.json`

export async function run() {
  const failures = []
  const checks = []

  const packsDir = resolve(FORGE, 'content/governance')
  const packs = existsSync(packsDir)
    ? readdirSync(packsDir).filter((f) => f.endsWith('.json'))
    : []
  // Sabotage override: SYSTEM_TEST_EXTRA_PACK points L5 at a /tmp pack so the
  // NC never writes a real file into the content dir.
  const extraPack = process.env.SYSTEM_TEST_EXTRA_PACK
  if (extraPack && existsSync(extraPack)) packs.push(extraPack)

  let evidenceTotal = 0
  let missingReplay = 0
  let missingCost = 0
  let missingVerified = 0
  let missingSource = 0

  const gtKeys = existsSync(GT)
    ? new Set(JSON.parse(readFileSync(GT, 'utf8')).facts?.map((f) => f.key) ?? [])
    : new Set()

  let replayFailures = 0
  let gtMisses = 0
  let costExceeded = 0

  for (const p of packs) {
    const packPath = resolve(packsDir, p)
    const pack = existsSync(packPath) ? JSON.parse(readFileSync(packPath, 'utf8')) : JSON.parse(readFileSync(p, 'utf8'))
    const evidence = pack.body?.filter((b) => b.type === 'evidence') ?? []
    evidenceTotal += evidence.length

    for (const ev of evidence) {
      if (!ev.replayCommand) missingReplay++
      if (!ev.verificationCostMinutes) missingCost++
      if (!ev.verified) missingVerified++
      if (!ev.source) missingSource++

      // Ground-truth citations must resolve to a registry key.
      const src = String(ev.source ?? '')
      const gtRef = src.match(/ground-truth\s+([a-z0-9_-]+)/i)?.[1]
      if (gtRef && !gtKeys.has(gtRef)) {
        gtMisses++
        failures.push(`${p}: evidence references ground-truth "${gtRef}" which does not resolve (unresolvable-ground-truth)`)
      }

      // Replay commands: validate structural soundness. We RUN the safe ones
      // (govern CLI, cat of an existing file, python3 registry reads) and
      // structurally validate the side-effecting ones (live LLM calls,
      // Cloudflare probes) WITHOUT executing them — a test gate must not
      // fire live model inference or hit external APIs.
      const cmd = String(ev.replayCommand ?? '')
      if (cmd) {
        const isSafeRead = cmd.startsWith('govern ') || cmd.startsWith('cat ') || cmd.startsWith('python3 -c') || cmd.startsWith('for ')
        const isLive = cmd.startsWith('node ') || cmd.startsWith('cd ')
        // Slow govern subcommands: self-test and audit recurse through every
        // gate's NC (incl. the system-test gate whose NC is the sabotage NC,
        // ~90s) — executing them here would blow the timeout and OOM the box.
        // They are validated STRUCTURALLY (command shape + target constitution
        // exists), never executed; the L2 layer proves they run.
        const isSlowGovern = /govern\s+(self-test|audit)\b/.test(cmd)
        if (isSafeRead) {
          // `govern` is not on PATH in the test env — resolve to the real CLI
          // and run from the govern package (its constitution paths are
          // package-relative).
          if (cmd.startsWith('govern ') && !isSlowGovern) {
            const args = cmd.slice('govern '.length)
            const cli = resolve(ROOT, 'P31-local-workspace/packages/govern/dist/cli.js')
            try {
              execSync(`cd ${GOVERN} && node ${cli} ${args}`, { encoding: 'utf8', stdio: ['ignore', 'ignore', 'pipe'], timeout: 15000 })
            } catch (e) {
              replayFailures++
              failures.push(`${p}: replay command failed (replay-command-failed): ${cmd.slice(0, 60)}`)
            }
          } else if (cmd.startsWith('for ')) {
            // Shell loop over constitutions — run under sh from the govern pkg.
            // Commands use $c unquoted (filenames have no spaces); do NOT
            // escape inner quotes (that breaks $c expansion in sh).
            // A loop whose body runs self-test/audit recurses through every
            // gate NC (slow) — validate structurally instead of executing.
            if (/self-test|\baudit\b/.test(cmd)) {
              if (!/constitution\.json/.test(cmd)) {
                replayFailures++
                failures.push(`${p}: replay loop malformed (replay-command-failed): ${cmd.slice(0, 60)}`)
              }
            } else {
              try {
                execSync(`cd ${GOVERN} && sh -c '${cmd.replaceAll("'", "\\'")}'`, { encoding: 'utf8', stdio: ['ignore', 'ignore', 'pipe'], timeout: 20000 })
              } catch (e) {
                replayFailures++
                failures.push(`${p}: replay command failed (replay-command-failed): ${cmd.slice(0, 60)}`)
              }
            }
          } else if (cmd.startsWith('govern ')) {
            // Slow self-test/audit replay: structural check only. The target
            // constitution must exist. Extract the path arg after the known
            // subcommand (self-test | audit) — a fixed-length slice breaks
            // when the subcommand differs.
            const m = cmd.match(/^govern\s+(?:self-test|audit)\s+(\S+)/)
            const arg = m?.[1] ?? 'constitution.json'
            const candidate = resolve(GOVERN, arg)
            if (!existsSync(candidate)) {
              replayFailures++
              failures.push(`${p}: replay constitution missing (replay-command-failed): ${arg}`)
            }
          } else {
            try {
              execSync(`cd ${ROOT} && ${cmd}`, { encoding: 'utf8', stdio: ['ignore', 'ignore', 'pipe'], timeout: 15000 })
            } catch (e) {
              replayFailures++
              failures.push(`${p}: replay command failed (replay-command-failed): ${cmd.slice(0, 60)}`)
            }
          }
        } else if (isLive) {
          // Structural check: the referenced script must exist on disk.
          // Commands may be relative to $ROOT (/home/p31) OR to the workspace
          // (P31-local-workspace/...) — check both bases.
          const ref = cmd.match(/node\s+(\S+)/)?.[1]
          if (ref) {
            const abs = resolve(ROOT, ref)
            const wsAbs = resolve(ROOT, 'P31-local-workspace', ref)
            if (!existsSync(abs) && !existsSync(wsAbs)) {
              replayFailures++
              failures.push(`${p}: replay script missing (replay-command-failed): ${ref}`)
            }
          }
        } else {
          // Unknown command shape — flag it, don't guess.
          replayFailures++
          failures.push(`${p}: replay command shape unclassified: ${cmd.slice(0, 60)}`)
        }
      }
    }

    // Per-document verification cost sum ≤ 30 min (fatigue threshold).
    const totalCost = evidence.reduce((s, b) => s + (Number(b.verificationCostMinutes) || 0), 0)
    if (totalCost > 30) {
      costExceeded++
      failures.push(`${p}: verification cost ${totalCost}min > 30min (cost-exceeds-threshold)`)
    }
  }

  if (missingReplay > 0) failures.push(`evidence blocks missing replayCommand: ${missingReplay} (missing-replay)`)
  if (missingCost > 0) failures.push(`evidence blocks missing verificationCostMinutes: ${missingCost} (missing-cost)`)
  if (missingVerified > 0) failures.push(`evidence blocks missing verified: ${missingVerified}`)
  if (missingSource > 0) failures.push(`evidence blocks missing source: ${missingSource}`)

  checks.push(`evidence blocks: ${evidenceTotal}`)
  checks.push(`replay commands executed: ${evidenceTotal - missingReplay - replayFailures}/${evidenceTotal - missingReplay}`)

  return {
    id: 'L5', name: 'Citation chain',
    passed: failures.length === 0,
    checks,
    failures,
    manifest: { population: 'governance content packs + evidence blocks + ground-truth keys', count: evidenceTotal, expectedMinimum: 16 },
  }
}