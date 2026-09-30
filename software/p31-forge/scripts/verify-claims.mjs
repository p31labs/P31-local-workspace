#!/usr/bin/env node
/**
 * verify-claims.mjs — check extracted claims against the P31 grounding
 * ledgers (VERIFIED_FACTS.md + docs/grounding/CITATION_LEDGER.md).
 *
 * The PwC finding (arXiv:2605.06635): frontier models score only 39-77%
 * factual accuracy even with high link validity. A report that cannot say
 * whether its claims are grounded is not trustworthy. This module renders a
 * verdict per claim so the report shows the truth about what it knows.
 *
 * Verdicts:
 *   verified  — the source name resolves in VERIFIED_FACTS or CITATION_LEDGER
 *   unverified — the source is named but NOT in either ledger (shown visibly,
 *                never silently dropped — the honest render)
 *   no-source — the claim has no extractable source
 *
 * Usage:
 *   node scripts/verify-claims.mjs --session <id> [--out <claims.verified.json>]
 *     reads /tmp/report/claims.json (from extract-claims)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..') // workspace root
const VERIFIED_FACTS = resolve(ROOT, 'VERIFIED_FACTS.md')
const CITATION_LEDGER = resolve(ROOT, 'docs', 'grounding', 'CITATION_LEDGER.md')

function loadLedger(path) {
  if (!existsSync(path)) return []
  return readFileSync(path, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 3)
}

// Normalize a source name to something comparable: uppercase, strip to the
// first word-group of a standard/author.
function norm(name) {
  return String(name)
    .replace(/[^\w\s.-]/g, '')
    .trim()
    .toUpperCase()
}

function sourceInLedger(source, ledgerLines) {
  const n = norm(source)
  if (!n || n.length < 2) return false
  // Standards (FIPS/WCAG/ISO) and Brief N map loosely; names map by token.
  const tokens = n.split(/[\s.-]+/).filter((t) => t.length > 1)
  return ledgerLines.some((line) => {
    const L = line.toUpperCase()
    return tokens.some((t) => L.includes(t)) || L.includes(n)
  })
}

function verifyClaim(claim, ledgerLines) {
  if (!claim.sources || claim.sources.length === 0) {
    return { ...claim, verdict: 'no-source' }
  }
  const matches = claim.sources.filter((s) => sourceInLedger(s, ledgerLines))
  const verdict = matches.length > 0 ? 'verified' : 'unverified'
  return { ...claim, verdict, verifiedSources: matches, unverifiedSources: claim.sources.filter((s) => !matches.includes(s)) }
}

async function main() {
  const si = process.argv.indexOf('--session')
  const session = si >= 0 ? process.argv[si + 1] : null
  if (!session) {
    console.error('usage: node scripts/verify-claims.mjs --session <id> [--out <path>]')
    process.exit(2)
  }
  const claimsPath = '/tmp/report/claims.json'
  if (!existsSync(claimsPath)) {
    console.error(`no ${claimsPath} — run extract-claims.mjs --session ${session} first`)
    process.exit(1)
  }

  const claims = JSON.parse(readFileSync(claimsPath, 'utf8'))
  const ledger = [...loadLedger(VERIFIED_FACTS), ...loadLedger(CITATION_LEDGER)]
  const verified = claims.claims.map((c) => verifyClaim(c, ledger))

  const counts = verified.reduce((a, c) => { a[c.verdict] = (a[c.verdict] || 0) + 1; return a }, {})
  claims.claims = verified
  claims.verifySummary = { ...counts, total: verified.length }

  const oi = process.argv.indexOf('--out')
  const out = oi >= 0 ? process.argv[oi + 1] : '/tmp/report/claims.verified.json'
  mkdirSync(resolve(out, '..'), { recursive: true })
  writeFileSync(resolve(out), JSON.stringify(claims, null, 2) + '\n', 'utf8')

  console.log(`verdicts: ${JSON.stringify(counts)} (${verified.length} total) -> ${out}`)
  for (const c of verified.slice(0, 5)) {
    console.log(`  [${c.verdict}] ${c.sentence.slice(0, 55)}... -> ${c.sources.join(', ')}`)
  }
}

if (fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? '')) {
  main().catch((e) => { console.error(e); process.exit(1) })
}