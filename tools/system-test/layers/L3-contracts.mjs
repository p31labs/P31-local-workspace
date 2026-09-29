import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { execSync } from 'node:child_process'

const GOVERN = '/home/p31/P31-local-workspace/packages/govern'
const SPEC = resolve(GOVERN, 'specs/enterprise.govern.yaml')

export async function run() {
  const failures = []
  const checks = []

  // Population: contracts in the enterprise spec + domain chains
  let spec = ''
  try {
    spec = execSync(`node ${GOVERN}/dist/cli.js compose ${SPEC} 2>&1`, { encoding: 'utf8', cwd: GOVERN })
  } catch (e) {
    failures.push(`compose crashed (contract-unenforceable): ${String(e.stdout ?? '').slice(-200)}`)
  }

  if (!spec.includes('composed')) {
    failures.push(`compose did not confirm (contract-unenforceable): ${spec.split('\n').slice(-3).join(' | ')}`)
  }

  const contractMatch = spec.match(/contracts:\s+(\d+)/)
  const contractCount = contractMatch ? Number(contractMatch[1]) : 0
  if (contractCount < 5) failures.push(`contracts=${contractCount} < expectedMinimum=5`)

  // ── STEP 1: Reconcile FIRST — the audit domain appends a block per audit
  // run (L2's NC runs do this), so chains are always slightly ahead of the
  // enterprise timeline. Reconcile brings everything current, then the mirror
  // check verifies the result, then idempotency verifies reconcile is stable.
  const enterprisePath = resolve(GOVERN, 'specs/enterprise-audit.jsonl')
  if (!existsSync(enterprisePath)) {
    failures.push('enterprise chain missing — run reconcile')
  }

  // ── STEP 2: Idempotency — reconcile, record, reconcile again, assert 0 new.
  execSync(`node ${GOVERN}/dist/cli.js reconcile ${SPEC} >/dev/null 2>&1`, { cwd: GOVERN })
  const countLines = () => readFileSync(enterprisePath, 'utf8').trim().split('\n').filter(Boolean).length
  const mid = countLines()
  execSync(`node ${GOVERN}/dist/cli.js reconcile ${SPEC} >/dev/null 2>&1`, { cwd: GOVERN })
  const after = countLines()

  if (after !== mid) {
    failures.push(`reconcile not idempotent: second run appended ${after - mid} block(s) (reconcile-not-idempotent)`)
  }
  checks.push(`reconcile idempotent (mid=${mid}, after=${after})`)

  // ── STEP 3: Mirror check — after reconcile, every domain's latest block
  // must be present in the enterprise timeline.
  if (existsSync(enterprisePath)) {
    const enterprise = readFileSync(enterprisePath, 'utf8')
      .trim().split('\n').filter(Boolean).map((l) => JSON.parse(l))
    const enterpriseHashes = new Set(enterprise.flatMap((b) => {
      const h = [b.currentHash]
      if (b.payload && typeof b.payload === 'object' && b.payload.blockHash) h.push(b.payload.blockHash)
      return h
    }))

    const domains = ['design', 'monetization', 'justice', 'audit', 'forge']
    let mirrored = 0
    for (const d of domains) {
      const p = resolve(GOVERN, 'domains', d, '.govern-audit.jsonl')
      if (!existsSync(p)) { failures.push(`${d}: chain missing`); continue }
      const blocks = readFileSync(p, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l))
      const latest = blocks[blocks.length - 1]
      if (!enterpriseHashes.has(latest.currentHash)) {
        failures.push(`${d}: latest block #${latest.blockNumber} not mirrored (chain-not-mirrored)`)
      } else {
        mirrored++
      }
    }
    checks.push(`chains mirrored after reconcile: ${mirrored}/${domains.length}`)
  }

  return {
    id: 'L3', name: 'Cross-domain contracts',
    passed: failures.length === 0,
    checks,
    failures,
    manifest: { population: 'enterprise contracts + domain chains', count: contractCount + 5, expectedMinimum: 5 + 5 },
  }
}