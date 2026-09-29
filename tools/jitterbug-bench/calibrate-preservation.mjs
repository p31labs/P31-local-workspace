#!/usr/bin/env node
/**
 * calibrate-preservation.mjs — calibrate the Path E preservation judge.
 *
 * The bench judge passed the trust bar (agreement 0.909 / κ 0.818). The
 * preservation judge (PR-1..PR-5) is a NEW instrument scored by the same
 * model — it has NO authority until it passes the same trust bar against
 * human verdicts. This is the fifth-instance rule from AGENT-RUNBOOK §9.
 *
 * Workflow:
 *   1. Run diagnose-compression.mjs --dry-run to harvest real (source,
 *      target) pairs. It writes runs/compression/pairs.json.
 *   2. This tool picks a tranche (default ~15 pairs), writes
 *      calibration/preservation-sheet.json with empty human_verdicts.
 *   3. A human fills them (Satisfied/Partially/Not Satisfied per criterion).
 *   4. Re-run this tool to compute raw agreement + Cohen's κ vs the trust
 *      bar (0.80 / 0.60). Writes preservation-CALIBRATION.md; exits non-zero
 *      on fail. Outputs of the judge are ADVISORY until it passes.
 *
 * Usage:
 *   node tools/jitterbug-bench/calibrate-preservation.mjs --harvest   # step 1+2
 *   node tools/jitterbug-bench/calibrate-preservation.mjs              # step 4
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const BENCH = '/home/p31/P31-local-workspace/tools/jitterbug-bench'
const OUT = resolve(BENCH, 'runs', 'compression')
const CAL = resolve(BENCH, 'calibration')
const TRUST_BAR = { raw_agreement: 0.80, cohens_kappa: 0.60 }
const CRITERIA = [
  { id: 'PR-1', weight: 3, criterion: 'Retains every citation / source name from the input' },
  { id: 'PR-2', weight: 3, criterion: 'Retains every key claim / finding from the input' },
  { id: 'PR-3', weight: 2, criterion: 'Retains every numeric value from the input' },
  { id: 'PR-4', weight: 2, criterion: 'Retains concrete specifics without genericizing' },
  { id: 'PR-5', weight: 2, criterion: 'Does NOT add invented content or false attribution' },
]
const SHEET_PATH = resolve(CAL, 'preservation-sheet.json')

function harvest() {
  const pairsPath = resolve(OUT, 'pairs.json')
  if (!existsSync(pairsPath)) {
    console.error('no pairs.json — run diagnose-compression.mjs --dry-run first')
    process.exit(2)
  }
  const pairs = JSON.parse(readFileSync(pairsPath, 'utf-8')).pairs ?? []
  // Pick a spread: 8 map + 5 reduce + 2 test hooks = 15.
  const map = pairs.filter((p) => p.kind === 'map').slice(0, 8)
  const reduce = pairs.filter((p) => p.kind === 'reduce').slice(0, 5)
  const picked = [...map, ...reduce]
  const sheet = {
    generated: new Date().toISOString(),
    note: 'Preservation judge calibration tranche. Fill human_verdict per criterion.',
    items: [],
  }
  for (const p of picked) {
    for (const c of CRITERIA) {
      sheet.items.push({
        pair: p.id, kind: p.kind, criterion: c.id, weight: c.weight,
        human_verdict: '', judge_verdict: (p.judgement?.scores ?? []).find((s) => s.id === c.id)?.verdict ?? null,
      })
    }
  }
  writeFileSync(SHEET_PATH, JSON.stringify(sheet, null, 2), 'utf-8')
  console.log(`harvested ${picked.length} pairs -> ${SHEET_PATH}`)
  console.log(`  (${sheet.items.length} verdicts to hand-score)`)
  console.log('  fill human_verdict, then re-run without --harvest')
}

function calibrate() {
  if (!existsSync(SHEET_PATH)) {
    console.error('no preservation-sheet.json — run with --harvest first')
    process.exit(2)
  }
  const sheet = JSON.parse(readFileSync(SHEET_PATH, 'utf-8'))
  const filled = sheet.items.filter((i) => i.human_verdict && i.human_verdict.trim())
  if (filled.length === 0) {
    console.error('no human verdicts filled')
    process.exit(2)
  }
  const normalize = (v) => (v === 'Present' ? 'Not Satisfied' : v === 'Absent' ? 'Satisfied' : v)
  const pairs = filled.map((i) => ({ h: normalize(i.human_verdict.trim()), j: normalize(i.judge_verdict ?? '') }))
  const n = pairs.length
  const rawAgreement = pairs.filter((p) => p.h === p.j).length / n

  const cats = ['Satisfied', 'Partially', 'Not Satisfied']
  const confusion = {}
  for (const c of cats) { confusion[c] = {}; for (const d of cats) confusion[c][d] = 0 }
  for (const p of pairs) confusion[p.h][p.j] += 1
  let po = 0
  for (const c of cats) po += confusion[c][c]
  po /= n
  const hm = {}, jm = {}
  for (const c of cats) {
    hm[c] = pairs.filter((p) => p.h === c).length / n
    jm[c] = pairs.filter((p) => p.j === c).length / n
  }
  let pe = 0
  for (const c of cats) pe += hm[c] * jm[c]
  const kappa = pe === 1 ? 0 : (po - pe) / (1 - pe)

  const pass = rawAgreement >= TRUST_BAR.raw_agreement && kappa >= TRUST_BAR.cohens_kappa
  const report = [
    '# Preservation Judge Calibration',
    '',
    `Human verdicts: ${filled.length} of ${sheet.items.length}`,
    '',
    '| Metric | Value | Trust bar | Pass |',
    '|---|---|---|---|',
    `| Raw agreement | ${rawAgreement.toFixed(3)} | >= ${TRUST_BAR.raw_agreement} | ${rawAgreement >= TRUST_BAR.raw_agreement ? 'YES' : 'NO'} |`,
    `| Cohen\'s kappa | ${kappa.toFixed(3)} | >= ${TRUST_BAR.cohens_kappa} | ${kappa >= TRUST_BAR.cohens_kappa ? 'YES' : 'NO'} |`,
    '',
    `**${pass ? 'PRESERVATION JUDGE CALIBRATED — rates are authoritative.' : 'PRESERVATION JUDGE NOT CALIBRATED — its outputs are ADVISORY only.'}**`,
    '',
    '## Confusion matrix (human → judge)',
    '',
    `| | ${cats.join(' | ')} |`,
    '|---|---|---|---|',
    ...cats.map((h) => `| **${h}** | ${cats.map((j) => confusion[h][j]).join(' | ')} |`),
  ].join('\n')
  writeFileSync(resolve(CAL, 'preservation-CALIBRATION.md'), report + '\n', 'utf-8')
  console.log(report)
  process.exit(pass ? 0 : 1)
}

const args = process.argv.slice(2)
if (args.includes('--harvest')) harvest()
else calibrate()