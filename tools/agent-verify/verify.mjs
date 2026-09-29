#!/usr/bin/env node
/**
 * verify.mjs — the agent's claim verifier.
 *
 * The antidote to hallucinated builds. Before any message that claims
 * "built", "done", "committed", "passes", or "created", the agent runs
 * this against a claims manifest. Every claim is checked against git diff
 * truth and real command execution. Any false claim → exit non-zero.
 *
 * claims.json shape:
 * {
 *   "claims": [
 *     { "type": "file-exists",      "path": "packages/design-core/src/agentic/approve.ts" },
 *     { "type": "file-missing",     "path": "some/should-not-exist.ts" },
 *     { "type": "commit-exists",    "sha": "abc1234", "messageContains": "human anchor" },
 *     { "type": "command-passes",   "command": "pnpm typecheck", "cwd": "packages/design-core" },
 *     { "type": "file-contains",    "path": "constitution.json", "pattern": "pickle-names" },
 *     { "type": "file-absent-on-disk", "path": "NARRATED_BUT_ABSENT.ts" }  // explicitly absent
 *   ]
 * }
 *
 * Output: PASS/FAIL per claim + `VERIFY_RESULT: PASS|FAIL` (greppable).
 * Exit non-zero on any failure.
 */
import { existsSync, readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { resolve } from 'node:path'

const REPO = '/home/p31/P31-local-workspace'

const manifestArg = process.argv.indexOf('--claims')
const manifestPath = manifestArg !== -1
  ? process.argv[manifestArg + 1]
  : resolve(REPO, 'tools/agent-verify/self-claims.json')

let manifest
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
} catch (e) {
  console.error(`✗ cannot read claims manifest: ${manifestPath}`)
  console.error(`  ${e.message}`)
  process.exit(2)
}

const checks = []
const failures = []

function checkFileExists(rel) {
  const abs = resolve(REPO, rel)
  return existsSync(abs)
}

function checkFileContains(rel, pattern) {
  const abs = resolve(REPO, rel)
  if (!existsSync(abs)) return false
  return readFileSync(abs, 'utf8').includes(pattern)
}

function checkCommitExists(sha, messageContains) {
  try {
    const out = execSync(`git -C ${REPO} log --oneline --all -1 --format=%s ${sha}`, { encoding: 'utf8' }).trim()
    if (!out) return false
    if (messageContains && !out.includes(messageContains)) return false
    return true
  } catch {
    return false
  }
}

function checkCommandPasses(command, cwd) {
  try {
    const dir = cwd ? resolve(REPO, cwd) : REPO
    execSync(command, { cwd: dir, stdio: ['ignore', 'pipe', 'ignore'], timeout: 60000, shell: '/bin/bash' })
    return true
  } catch {
    return false
  }
}

for (const claim of manifest.claims) {
  let ok = false
  let detail = ''
  switch (claim.type) {
    case 'file-exists':
      ok = checkFileExists(claim.path)
      detail = ok ? `exists: ${claim.path}` : `MISSING: ${claim.path}`
      break
    case 'file-missing':
      ok = !checkFileExists(claim.path)
      detail = ok ? `absent as expected: ${claim.path}` : `PRESENT (expected absent): ${claim.path}`
      break
    case 'file-contains':
      ok = checkFileContains(claim.path, claim.pattern)
      detail = ok ? `contains pattern: ${claim.path}` : `does NOT contain "${claim.pattern}": ${claim.path}`
      break
    case 'commit-exists':
      ok = checkCommitExists(claim.sha, claim.messageContains)
      detail = ok ? `commit ${claim.sha} exists` : `commit ${claim.sha} MISSING or message mismatch`
      break
    case 'command-passes':
      ok = checkCommandPasses(claim.command, claim.cwd)
      detail = ok ? `command passed: ${claim.command}` : `command FAILED: ${claim.command}`
      break
    default:
      ok = false
      detail = `unknown claim type: ${claim.type}`
  }
  checks.push({ name: claim.name ?? claim.type, ok, detail })
  if (!ok) failures.push(`${claim.name ?? claim.type}: ${detail}`)
}

for (const c of checks) {
  console.log(`  ${c.ok ? '✅' : '✗'} ${c.name}: ${c.detail}`)
}

if (failures.length > 0) {
  console.error('VERIFY_RESULT: FAIL')
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}
console.log('VERIFY_RESULT: PASS')
process.exit(0)