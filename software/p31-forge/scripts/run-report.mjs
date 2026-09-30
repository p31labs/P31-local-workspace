#!/usr/bin/env node
/**
 * run-report.mjs — the research-report pipeline (one command).
 *
 *   jitterbug session  →  extract claims  →  verify vs grounding ledgers
 *   →  styled report (md + html)
 *
 * The bridge between the jitterbug research engine and the forge document
 * renderer. Three stages (synthesis / attribution / verification) stay
 * separate per the Anthropic citations-agent pattern — the report is only as
 * trustworthy as its attribution, which is only as trustworthy as its ledger.
 *
 * Usage:
 *   node scripts/run-report.mjs --session 04311260
 */
import { execFileSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const S = (f) => resolve(HERE, f)

function run(file, args) {
  execFileSync(process.execPath, [S(file), ...args], { stdio: 'inherit', cwd: resolve(HERE, '..') })
}

async function main() {
  const si = process.argv.indexOf('--session')
  const session = si >= 0 ? process.argv[si + 1] : null
  if (!session) {
    console.error('usage: node scripts/run-report.mjs --session <id>')
    process.exit(2)
  }
  console.log(`\n▶ P31 research report — session ${session}\n`)
  run('extract-claims.mjs', ['--session', session, '--out', '/tmp/report/claims.json'])
  run('verify-claims.mjs', ['--session', session])
  run('render-report.mjs', ['--session', session])
  console.log(`\n▶ report ready: /tmp/report/${session}.report.md + booklet/out/${session}.html\n`)
}

if (fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? '')) {
  main().catch((e) => { console.error(e); process.exit(1) })
}