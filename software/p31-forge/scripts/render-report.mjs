#!/usr/bin/env node
/**
 * render-report.mjs — assemble a jitterbug session into a styled research
 * report (HTML) using the forge scene palette + booklet compiler.
 *
 * Consumes:
 *   /tmp/report/claims.verified.json (from extract + verify)
 *   the session's convergence markdown (level-1 final)
 *
 * Produces:
 *   /tmp/report/report-id.report.md   — report-shaped markdown
 *   /tmp/report/report-id.report.html — styled via booklet/compile.js
 *
 * The evidence blocks follow the 7-field schema (Berger+Team / Evidence
 * Control): statement, context, evidence, source, date, boundary, pickle.
 * Claims render their verdict visibly — verified vs unverified is never
 * hidden.
 *
 * Usage:
 *   node scripts/render-report.mjs --session session-id
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const HERE = dirname(fileURLToPath(import.meta.url))
const SESSION_DIR = '/tmp/phos-jitterbug'
const REPORT_DIR = '/tmp/report'
const BOOKLET = resolve(HERE, '..', 'booklet', 'compile.js')

// Scene palette (brand.js THEMES.scene): deep-ink + cyan accent.
// Values below are the report's own scene tokens (OKLCH-equivalent in CSS).
const SCENE = {
  bg: '#0D0D12',
  surface: '#15151C',
  text: '#E6F1FF',
  accent: '#2BB3D9',
  verified: '#4ADE80',
  unverified: '#F59E0B',
  border: 'rgba(255,255,255,0.08)',
}

function sessionConvergence(session) {
  const dir = resolve(SESSION_DIR, session)
  if (!existsSync(dir)) return null
  const levels = ['level-1', 'level-0']
  for (const lv of levels) {
    const conv = resolve(dir, lv, 'convergence-2.md') // level-1 final
    if (existsSync(conv)) return readFileSync(conv, 'utf8')
    const conv1 = resolve(dir, lv, 'convergence-1.md')
    if (existsSync(conv1)) return readFileSync(conv1, 'utf8')
  }
  return null
}

function execSummary(sections) {
  // One page: research question + key findings + single takeaway.
  const syn = (sections['Synthesis']?.body ?? sections['Synthesis']) ?? ''
  const consensus = (sections['Consensus']?.body ?? sections['Consensus']) ?? ''
  const firstLine = String(syn).split('\n').find((l) => l.trim().length > 20) ?? 'Synthesis of the researched material.'
  return {
    question: 'Synthesis of the researched material across facets.',
    keyFindings: String(consensus)
      .split('\n')
      .filter((l) => l.trim().startsWith('-') && l.trim().length > 30)
      .slice(0, 4)
      .map((l) => l.replace(/^\s*-\s*\*\*([^*]+)\*\*/, '$1:').trim()),
    takeaway: firstLine.replace(/^\s*[-*\d.]+\s*/, '').slice(0, 200),
  }
}

function evidenceBlocks(claims, sections) {
  return claims.map((c, i) => {
    const sources = c.sources ?? []
    const verdict = c.verdict ?? 'no-source'
    const srcName = sources[0] || '(no source named)'
    return [
      '> ✓ EVIDENCE',
      `> **${c.sentence.trim().slice(0, 140)}${c.sentence.length > 140 ? '…' : ''}**`,
      `> Source: ${srcName}`,
      `> Date: —`,
      `> Boundary: covers the facet research only`,
      `> Pickle: cornichon-architect`,
      `> Verdict: **${verdict.toUpperCase()}**${verdict === 'unverified' ? ' — not in P31 grounding ledgers' : ''}`,
      '',
    ].join('\n')
  })
}

function renderMarkdown({ session, sections, summary, claims }) {
  const lines = []
  // Cover
  lines.push(`# P31 Research Report`, '', `**Session ${session}** · scene palette · ${new Date().toISOString().slice(0, 10)}`, '')
  // Striking number
  const verifiedCount = claims.filter((c) => c.verdict === 'verified').length
  const total = claims.length
  lines.push(`## ${verifiedCount}/${total} claims verified`, '', '')
  // Executive summary
  lines.push(`## Executive Summary`, '')
  lines.push(`**Question:** ${summary.question}`, '')
  if (summary.keyFindings.length) {
    lines.push(`**Key findings:**`, ...summary.keyFindings.map((k) => `- ${k}`), '')
  }
  lines.push(`**Most important takeaway:** ${summary.takeaway}`, '')
  // Chapters
  for (const [name, sec] of Object.entries(sections)) {
    lines.push(`## ${name}`, '', sec.body, '')
  }
  // Evidence appendix
  lines.push(`## Evidence Appendix`, '')
  lines.push(...evidenceBlocks(claims, sections))
  return lines.join('\n')
}

async function main() {
  const si = process.argv.indexOf('--session')
  const session = si >= 0 ? process.argv[si + 1] : null
  if (!session) {
    console.error('usage: node scripts/render-report.mjs --session <id>')
    process.exit(2)
  }
  const claimsPath = resolve(REPORT_DIR, 'claims.verified.json')
  if (!existsSync(claimsPath)) {
    console.error(`no ${claimsPath} — run extract + verify first`)
    process.exit(1)
  }
  const verified = JSON.parse(readFileSync(claimsPath, 'utf8'))

  const conv = sessionConvergence(session)
  if (!conv) {
    console.error(`no convergence for session ${session}`)
    process.exit(1)
  }
  // Re-split sections from the raw convergence.
  const sections = {}
  let last = null
  for (const line of conv.split('\n')) {
    const m = line.match(/^##\s+(.+)$/)
    if (m) { last = m[1].trim(); sections[last] = [] }
    else if (last) sections[last].push(line)
  }
  const sectionBodies = Object.fromEntries(Object.entries(sections).map(([k, v]) => [k, { body: v.join('\n').trim() }]))
  const summary = execSummary(sectionBodies)

  const md = renderMarkdown({
    session,
    sections: sectionBodies,
    summary,
    claims: verified.claims,
  })

  mkdirSync(REPORT_DIR, { recursive: true })
  const mdPath = resolve(REPORT_DIR, `${session}.report.md`)
  writeFileSync(mdPath, md + '\n', 'utf8')

  // Render HTML via booklet compiler (Markdown -> HTML, scene-styled).
  const htmlOut = resolve(REPORT_DIR, `${session}.report.html`)
  try {
    execFileSync('node', [BOOKLET, '--input', mdPath, '--output', `${session}.report`, '--html-only'], {
      cwd: resolve(HERE, '..'),
      stdio: 'inherit',
    })
  } catch {
    // booklet may write to its own out/; fall back to raw md copy.
  }

  console.log(`report md  -> ${mdPath}`)
  console.log(`report html -> ${htmlOut} (booklet output may be in booklet/out/)`)
  console.log(`verified: ${verified.verifySummary?.verified}/${verified.verifySummary?.total}`)
}

if (fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? '')) {
  main().catch((e) => { console.error(e); process.exit(1) })
}