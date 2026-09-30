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

const HERE = dirname(fileURLToPath(import.meta.url))
const SESSION_DIR = '/tmp/phos-jitterbug'
const REPORT_DIR = '/tmp/report'

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

// The report design vocabulary lives in booklet/report.css (the reusable
// template). Loaded here so the report stays self-contained at render time
// while the CSS is editable as a file, not a template literal.
const REPORT_CSS = existsSync(resolve(HERE, '..', 'booklet', 'report.css'))
  ? readFileSync(resolve(HERE, '..', 'booklet', 'report.css'), 'utf8')
  : ''

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
  const allText = String(consensus) + '\n' + String(syn)
  // Flesch-Kincaid (syllable-based) — used to lift a PLAIN takeaway, not the
  // densest synthesis line (the readability gate hard-fails above grade 14).
  const countSyllables = (w) => (w.toLowerCase().match(/[aeiouy]{1,2}/g) ?? []).length || 1
  const fk = (text) => {
    const words = String(text).split(/\s+/).filter(Boolean)
    if (words.length < 8) return 99
    const sentences = (String(text).match(/[.!?](?=\s|$)/g) ?? []).length || 1
    const syllables = words.reduce((n, w) => n + countSyllables(w), 0)
    return 0.39 * (words.length / sentences) + 11.8 * (syllables / words.length) - 15.59
  }
  // Candidate takeaways: every consensus/synthesis sentence > 25 chars,
  // ranked by ascending FK (plainest first).
  const candidates = allText
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.replace(/^\s*[-*#\d.]+\s*/, '').replace(/\*\*/g, '').trim())
    .filter((s) => s.length > 25 && s.length < 240)
    .map((s) => ({ s, fk: fk(s) }))
    .sort((a, b) => a.fk - b.fk)
  const plainest = candidates.find((c) => c.fk <= 14) ?? candidates[0]
  const takeaway = plainest ? plainest.s.slice(0, 200) : 'Synthesis of the researched material across facets.'
  return {
    question: 'Synthesis of the researched material across facets.',
    keyFindings: String(consensus)
      .split('\n')
      .filter((l) => l.trim().startsWith('-') && l.trim().length > 30)
      .slice(0, 4)
      .map((l) => l.replace(/^\s*-\s*\*\*([^*]+)\*\*\s*:\s*/, '**$1:** ').replace(/^\s*-\s*\*\*([^*]+)\*\*/, '**$1:**').trim()),
    takeaway,
    takeawayFk: plainest ? plainest.fk : null,
  }
}

function evidenceBlocks(claims, sections) {
  // Internal-label-only claims (Brief N / Facet N) are the synthesis's own
  // attribution, NOT external citations — they become prose, not evidence.
  const INTERNAL_LABEL_RE = /^briefs?\s+\d+$/i
  const external = claims.filter(
    (c) => (c.sources ?? []).length > 0 && !(c.sources ?? []).every((s) => INTERNAL_LABEL_RE.test(s)),
  )
  return external.map((c, i) => {
    const sources = (c.sources ?? []).filter((s) => !INTERNAL_LABEL_RE.test(s))
    const verdict = c.verdict ?? 'no-source'
    const srcName = sources[0] || '(no source named)'
    // Strip existing bold/emphasis markers so the wrapper does not double-wrap.
    const clean = c.sentence.replace(/\*\*/g, '').replace(/\*/g, '').trim()
    return [
      '> ✓ EVIDENCE',
      `> **${clean.slice(0, 140)}${clean.length > 140 ? '…' : ''}**`,
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

// A Markdown-ish body section to HTML paragraphs + bold labels.
function mdToHtmlFrag(body) {
  const lines = String(body).split('\n')
  const out = []
  for (const line of lines) {
    const t = line.trim()
    if (!t) continue
    if (t.startsWith('- ')) {
      // bullet, preserving **Label** emphasis
      const inner = t.replace(/^- /, '').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      out.push(`<li>${inner}</li>`)
    } else if (t.startsWith('> ')) {
      out.push(`<blockquote>${t.replace(/^> /, '').replace(/\*\*/g, '')}</blockquote>`)
    } else {
      out.push(`<p>${t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')}</p>`)
    }
  }
  return out.join('\n')
}

function renderHtml({ session, sections, summary, claims, verifySummary }) {
  const verifiedCount = claims.filter((c) => c.verdict === 'verified').length
  const total = claims.length
  const thesis = summary.takeaway.replace(/<[^>]*>/g, '').slice(0, 120)

  // Evidence appendix as a TABLE, not a wall of blocks. Each row cites its
  // evidence-ledger ID [E#] (researchloop pattern) for traceability.
  const evidenceRows = claims
    .map((c) => {
      const clean = c.sentence.replace(/\*\*/g, '').replace(/\*/g, '').slice(0, 90)
      const src = (c.sources ?? []).join(', ') || '—'
      const verdict = (c.verdict ?? 'no-source').toUpperCase()
      const lid = c.ledgerId ?? `E${(claims.indexOf(c)) + 1}`
      return `<tr><td class="mono">${lid}</td><td>${clean}</td><td class="mono">${src}</td><td class="mono ${verdict === 'VERIFIED' ? 'ok' : 'warn'}">${verdict}</td></tr>`
    })
    .join('\n')

  const chapters = Object.entries(sections)
    .map(
      ([name, sec]) => `
      <section class="chapter">
        <h2>${name}</h2>
        <div class="body">${mdToHtmlFrag(sec.body)}</div>
      </section>`,
    )
    .join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>P31 Research Report — ${session}</title>
<style>
${REPORT_CSS}
</style>
</head>
<body>
  <section class="cover">
    <div class="kicker">P31 Labs · Sovereign Research</div>
    <h1>P31 Research Report</h1>
    <p class="thesis">${thesis || 'Synthesis of the researched material.'}</p>
    <div class="meta">
      <div>Session ${session}</div>
      <div>${new Date().toISOString().slice(0, 10)}</div>
      <div>scene palette · sovereign pipeline</div>
    </div>
    <div class="striking">${verifiedCount}/${total}</div>
    <div class="meta" style="font-size:8pt;color:#8FA3B5">externally-verified claims</div>
  </section>

  <main class="page">
    <section class="chapter">
      <h2>Executive Summary</h2>
      <div class="summary-cards">
        <div class="card"><div class="lbl">Question</div><div class="val">${summary.question}</div></div>
        <div class="card"><div class="lbl">Takeaway</div><div class="val">${summary.takeaway}</div></div>
      </div>
      ${summary.keyFindings.length ? `<h3>Key findings</h3><ul>${summary.keyFindings.map((k) => `<li>${k.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')}</li>`).join('')}</ul>` : ''}
    </section>

    ${chapters}

    <section class="chapter">
      <h2>Evidence Appendix</h2>
      <table>
        <thead><tr><th>ID</th><th>Claim</th><th>Source</th><th>Verdict</th></tr></thead>
        <tbody>${evidenceRows}</tbody>
      </table>
    </section>

    <div class="methodology">
      METHODOLOGY — jitterbug research (${verifySummary?.total ?? total} claims extracted by deterministic AST parser). Attribution: internal facet labels are synthesis prose; only external standards/works become evidence rows. Verification: claims checked against VERIFIED_FACTS.md + CITATION_LEDGER.md. Unverified = named source not in P31 grounding ledgers.
    </div>

    <div class="footer">P31 Labs · CC BY-SA 4.0 · p31ca.org · github.com/p31labs</div>
  </main>
</body>
</html>`
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

  // Direct styled HTML — the report design vocabulary (cover / methodology /
  // chapters / evidence table / running footer). Self-contained, browser-print.
  const html = renderHtml({
    session,
    sections: sectionBodies,
    summary,
    claims: verified.claims,
    verifySummary: verified.verifySummary,
  })
  const htmlPath = resolve(REPORT_DIR, `${session}.report.html`)
  writeFileSync(htmlPath, html, 'utf8')

  console.log(`report md  -> ${mdPath}`)
  console.log(`report html -> ${htmlPath}`)
  console.log(`verified: ${verified.verifySummary?.verified}/${verified.verifySummary?.total}`)
}

if (fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? '')) {
  main().catch((e) => { console.error(e); process.exit(1) })
}