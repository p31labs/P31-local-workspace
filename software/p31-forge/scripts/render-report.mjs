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
  :root {
    --ink: #0D0D12; --surface: #15151C; --paper: #FAF7F2;
    --text: #1A1A1A; --text-dim: #5A5A5A; --accent: #2BB3D9;
    --verified: #1F9D55; --warn: #B7791F; --rule: #E6E4DC;
    --mono: 'DejaVu Sans Mono', 'JetBrains Mono', ui-monospace, monospace;
    --serif: 'DejaVu Serif', 'Lora', Georgia, serif;
    --sans: 'DejaVu Sans', 'Plus Jakarta Sans', system-ui, sans-serif;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: var(--sans); color: var(--text); background: var(--paper); font-size: 11pt; line-height: 1.6; }
  /* Baseline grid + typographic controls (kami + effective-print-design) */
  body { orphans: 3; widows: 3; }
  h1, h2, h3 { break-after: avoid; }
  table, .card, blockquote { break-inside: avoid; }

  /* ── COVER (dark, ATS bar: dark #0D0D12 only on the cover) ── */
  .cover { background: var(--ink); color: #E6F1FF; padding: 3.5cm 2.5cm 2.5cm; min-height: 100vh; page-break-after: always; }
  .cover .kicker { font-family: var(--mono); font-size: 10pt; color: var(--accent); letter-spacing: 0.12em; text-transform: uppercase; }
  .cover h1 { font-family: var(--serif); font-size: 34pt; line-height: 1.15; margin: 0.6cm 0; font-weight: 400; }
  .cover .thesis { font-size: 14pt; color: #C4D7E6; max-width: 13cm; margin: 0 0 1.2cm; }
  .cover .meta { font-family: var(--mono); font-size: 9pt; color: #8FA3B5; line-height: 1.8; }
  .cover .striking { font-size: 48pt; font-weight: 700; color: var(--accent); margin-top: 1.5cm; }

  /* ── CONTENT (warm cream — NOT white, per kami) ── */
  .page { max-width: 17cm; margin: 0 auto; padding: 1.5cm 1.2cm; }
  .methodology { font-family: var(--mono); font-size: 8.5pt; color: var(--text-dim); border-top: 1px solid var(--rule); padding-top: 0.6cm; margin: 1.2cm 0; }
  h2 { font-family: var(--serif); font-size: 18pt; color: var(--ink); border-bottom: 2px solid var(--accent); padding-bottom: 4px; margin-top: 1.2cm; page-break-before: always; }
  h2:first-of-type { page-break-before: auto; }
  .body p { margin: 0.3cm 0; }
  .body li { margin: 0.15cm 0; }
  .body strong { color: var(--ink); }
  .body blockquote { border-left: 3px solid var(--accent); margin: 0.4cm 0; padding-left: 0.6cm; color: var(--text-dim); font-style: italic; }
  .summary-cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.4cm; margin: 0.5cm 0; }
  /* Warm card surface — the kami rule: warm cream, never pure #fff */
  .card { background: #FDFCFA; border: 1px solid var(--rule); border-radius: 8px; padding: 0.4cm 0.5cm; page-break-inside: avoid; }
  .card .lbl { font-family: var(--mono); font-size: 8pt; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-dim); }
  .card .val { font-size: 11pt; }

  /* ── EVIDENCE TABLE (tabular-nums — numbers stack consistently) ── */
  table { width: 100%; border-collapse: collapse; margin: 0.5cm 0; page-break-inside: avoid; }
  th { font-family: var(--mono); font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.08em; text-align: left; color: var(--text-dim); border-bottom: 1px solid var(--ink); padding: 6px 8px; }
  td { border-bottom: 1px solid var(--rule); padding: 6px 8px; font-size: 9.5pt; vertical-align: top; }
  .mono { font-family: var(--mono); font-size: 8.5pt; font-variant-numeric: tabular-nums; }
  .ok { color: var(--verified); font-weight: 600; }
  .warn { color: var(--warn); }

  /* ── PAGED MEDIA (native Chrome 131+ margin boxes — the running footer
        repeats on every content page; the cover is its own named page) ── */
  @media print {
    @page {
      size: A4;
      margin: 20mm 16mm 22mm;
      @bottom-center {
        content: 'P31 Labs · CC BY-SA 4.0 · p31ca.org · github.com/p31labs';
        font-family: 'JetBrains Mono', monospace;
        font-size: 8pt;
        color: #8FA3B5;
      }
      @bottom-right {
        content: counter(page);
        font-family: 'JetBrains Mono', monospace;
        font-size: 9pt;
        color: #8FA3B5;
      }
    }
    @page cover-page {
      margin: 0;
      @bottom-center { content: none; }
      @bottom-right { content: none; }
    }
    .cover { page: cover-page; min-height: auto; height: 297mm; }
    body { font-size: 10.5pt; }
  }
  .footer { display: none; } /* replaced by native @page margin boxes */
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