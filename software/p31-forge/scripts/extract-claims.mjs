#!/usr/bin/env node
/**
 * extract-claims.mjs — deterministic claim + source extraction from jitterbug
 * convergence markdown.
 *
 * The PwC citation study (arXiv:2605.06635) shows extraction should NOT be an
 * LLM task: "A Markdown Abstract Syntax Tree (AST) parser structurally
 * extracts citation-claim pairs without requiring LLM inference." This module
 * is that parser — regex-based over the convergence + facet markdown, no model
 * call, deterministic.
 *
 * It extracts:
 *   - the synthesis sections (Consensus / Divergence / Synthesis) as chapters
 *   - claim→source pairs: sentences that name a source (author-year, an
 *     uppercase name, a bracketed [n], or a parenthetical citation)
 *
 * Output: a claims.json the verify + render stages consume.
 *
 * Usage:
 *   node scripts/extract-claims.mjs --session <id>
 *     reads /tmp/phos-jitterbug/<id> convergence + research markdown
 *   node scripts/extract-claims.mjs --session <id> --out /tmp/report/claims.json
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const SESSION_DIR = '/tmp/phos-jitterbug'
const JITTERBUG_DIR = '/home/p31/P31-local-workspace/tools/phos-forge'

// Citation markers: standards (FIPS/WCAG/NIST/ISO/OCGA...), author-year, [n],
// or parenthetical author. "Brief N" is the jitterbug's INTERNAL facet label —
// NOT an external citation — so it is deliberately absent from this regex.
const CITATION_RE =
  /\b(FIPS[\s-]*[\d.\/-]+)\b|\b(WCAG[\s-]*[\d.]+)\b|\b(NIST\s*[A-Z]*[\s-]?[\d-]*)\b|\b(ISO[\s-]*\d+)\b|\b(?:\(([A-Z][A-Za-z][^()]*?\d{4}[^()]*?)\))\b|\[(\d+)\]/g

function sessionArtifacts(session) {
  const dir = resolve(SESSION_DIR, session)
  if (!existsSync(dir)) return { levels: [], facets: [], convergences: [] }
  const levels = readdirSync(dir).filter((d) => d.startsWith('level-')).sort()
  const facets = []
  const convergences = []
  for (const lv of levels) {
    const ldir = resolve(dir, lv)
    if (!existsSync(ldir)) continue
    for (const f of readdirSync(ldir).filter((x) => x.startsWith('research-') && x.endsWith('.md'))) {
      facets.push({ level: lv, file: resolve(ldir, f), text: readFileSync(resolve(ldir, f), 'utf8') })
    }
    for (const c of readdirSync(ldir).filter((x) => x.startsWith('convergence-') && x.endsWith('.md'))) {
      convergences.push({ level: lv, file: resolve(ldir, c), text: readFileSync(resolve(ldir, c), 'utf8') })
    }
  }
  return { levels, facets, convergences }
}

function splitSections(md) {
  const sections = {}
  const re = /^##\s+(.+)$/gm
  let last = null
  const lines = md.split('\n')
  for (const line of lines) {
    const m = line.match(/^##\s+(.+)$/)
    if (m) { last = m[1].trim(); sections[last] = [] }
    else if (last) sections[last].push(line)
  }
  return Object.fromEntries(Object.entries(sections).map(([k, v]) => [k, v.join('\n').trim()]))
}

function extractClaims(text) {
  const claims = []
  const sentences = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 40)
  for (const sentence of sentences) {
    const sources = []
    CITATION_RE.lastIndex = 0
    let m
    while ((m = CITATION_RE.exec(sentence)) !== null) {
      // groups: 1=FIPS, 2=WCAG, 3=NIST, 4=ISO, 5=parenthetical, 6=[n]
      const candidate = (m[1] || m[2] || m[3] || m[4] || m[5] || m[6] || '').trim()
      if (candidate && candidate.length > 1) sources.push(candidate)
    }
    if (sources.length > 0) {
      claims.push({ sentence, sources: [...new Set(sources)] })
    }
  }
  return claims
}

async function main() {
  const si = process.argv.indexOf('--session')
  const session = si >= 0 ? process.argv[si + 1] : null
  if (!session) {
    console.error('usage: node scripts/extract-claims.mjs --session <id> [--out <path>]')
    process.exit(2)
  }
  const oi = process.argv.indexOf('--out')
  const out = oi >= 0 ? process.argv[oi + 1] : null

  const { facets, convergences } = sessionArtifacts(session)
  if (convergences.length === 0) {
    console.error(`no convergence artifacts for session ${session}`)
    process.exit(1)
  }

  // The last convergence is the final synthesis.
  const final = convergences[convergences.length - 1]
  const sections = splitSections(final.text)

  // Collect claims from each section.
  const report = {
    session,
    title: `Research Report — session ${session}`,
    generated: new Date().toISOString(),
    sections: {},
    claims: [],
  }
  for (const [name, body] of Object.entries(sections)) {
    const claims = extractClaims(body)
    report.sections[name] = { body, claims }
    report.claims.push(...claims.map((c) => ({ section: name, ...c })))
  }

  // Facet sources — the raw material for evidence blocks (claim → source where
  // the source appears in a facet).
  const facetClaims = []
  for (const f of facets) {
    facetClaims.push(...extractClaims(f.text).map((c) => ({ level: f.level, file: f.file, ...c })))
  }
  report.facetClaims = facetClaims

  if (out) {
    mkdirSync(resolve(out, '..'), { recursive: true })
    writeFileSync(resolve(out), JSON.stringify(report, null, 2) + '\n', 'utf8')
    console.log(`claims extracted: ${report.claims.length} synthesis + ${facetClaims.length} facet -> ${out}`)
  } else {
    console.log(JSON.stringify(report, null, 2))
  }
}

if (fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? '')) {
  main().catch((e) => { console.error(e); process.exit(1) })
}