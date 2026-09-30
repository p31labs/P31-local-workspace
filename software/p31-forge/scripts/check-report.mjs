#!/usr/bin/env node
/**
 * check-report.mjs — the report quality gate (Layer 4).
 *
 * Fails the render on the three regressions the design work targets:
 *   1. double-wrap bold (****) — the Layer-1 defect, must be 0
 *   2. backslash-escape artifacts (\*\*) — must be 0
 *   3. evidence appendix must be a TABLE, not a wall of blockquotes
 *   4. the styled vocabulary must be present (cover / methodology / striking)
 *
 * Usage:
 *   node scripts/check-report.mjs --session <id>     (checks /tmp/report)
 *   node scripts/check-report.mjs --session <id> --html /path/to/report.html
 * Exit 0 = passes; 1 = a regression found.
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPORT_DIR = '/tmp/report'

function main() {
  const si = process.argv.indexOf('--session')
  const session = si >= 0 ? process.argv[si + 1] : null
  if (!session) {
    console.error('usage: node scripts/check-report.mjs --session <id> [--html <path>]')
    process.exit(2)
  }
  const hi = process.argv.indexOf('--html')
  const htmlPath = hi >= 0 ? process.argv[hi + 1] : resolve(REPORT_DIR, `${session}.report.html`)
  if (!existsSync(htmlPath)) {
    console.error(`check-report: no report html at ${htmlPath} — run render-report first`)
    process.exit(1)
  }
  const html = readFileSync(htmlPath, 'utf8')
  const failures = []

  // 1. double-wrap bold
  const doubleWrap = (html.match(/\*\*\*\*/g) ?? []).length
  if (doubleWrap > 0) failures.push(`double-wrap bold: ${doubleWrap} '****' found (Layer-1 regression)`)

  // 2. backslash-escape
  const backslashEsc = (html.match(/\\\*\\\*/g) ?? []).length + (html.match(/\\\*/g) ?? []).length
  if (backslashEsc > 0) failures.push(`backslash-escape artifact: ${backslashEsc} found`)

  // 3. appendix must be a table, not blockquotes
  const hasTable = /<table>/.test(html)
  const quoteBlocks = (html.match(/✓ EVIDENCE/g) ?? []).length
  if (!hasTable) failures.push('evidence appendix is not a table')
  if (quoteBlocks > 3) failures.push(`evidence wall: ${quoteBlocks} blockquote evidence blocks (should be a table)`)
  // 3b. the evidence table must carry ledger IDs (researchloop [E#] traceability)
  if (!/<th>ID<\/th>/.test(html)) failures.push('evidence table missing ledger-ID column ([E#] traceability)')

  // 4. styled vocabulary present
  for (const [name, token] of [['cover', 'class="cover"'], ['methodology', 'class="methodology"'], ['striking', 'class="striking"'], ['appendix', 'Evidence Appendix'], ['paged-footer', '@bottom-center']]) {
    if (!html.includes(token)) failures.push(`missing styled element: ${name}`)
  }

  // 5. readability — Flesch-Kincaid on the report's takeaway (research +
  //     Human-Eye Test discipline). A reader-facing takeaway should be <= 14.
  function countSyllables(word) {
    const m = String(word).toLowerCase().match(/[aeiouy]{1,2}/g)
    return m ? m.length : 1
  }
  function fkGrade(text) {
    const words = String(text).trim().split(/\s+/).filter(Boolean)
    if (words.length === 0) return 0
    const sentences = (String(text).match(/[.!?](?=\s|$)/g) ?? []).length || 1
    const syllables = words.reduce((n, w) => n + countSyllables(w), 0)
    return 0.39 * (words.length / sentences) + 11.8 * (syllables / words.length) - 15.59
  }
  // Measure the READER-FACING takeaway line (the single most important takeaway
  // a reader learns in 10 seconds — the research's exec-summary spec). The
  // takeaway card is the target; generic labels and technical key-findings
  // bullets are not the summary.
  const tkMatch = /Takeaway<\/div><div class="val">([^<]+)/.exec(html)
  const takeawayText = tkMatch ? tkMatch[1] : 'Synthesis of the researched material across facets.'
  const fk = fkGrade(takeawayText)
  // HARD GATE: a reader-facing exec summary that reads above grade 14 is not
  // a finished report. The dense jitterbug synthesis should NOT be quoted
  // verbatim as the summary — the renderer must lift a plain-language line
  // or the report is DRAFT. No advisory escape hatch.
  if (fk > 14) failures.push(`readability: exec-summary Flesch-Kincaid ${fk.toFixed(1)} > 14 (DRAFT — lift a plain-language summary, don't quote the dense synthesis)`)
  else if (fk > 11) console.log(`ℹ  readability: exec-summary FK ${fk.toFixed(1)} (≤14 OK)`)

  if (failures.length > 0) {
    console.error('❌ REPORT GATE FAILED:')
    for (const f of failures) console.error(`  - ${f}`)
    process.exit(1)
  }
  console.log('✅ REPORT GATE PASSED — styled vocabulary present, no wrap/escape artifacts, appendix is a table.')
  process.exit(0)
}

if (fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? '')) {
  main()
}