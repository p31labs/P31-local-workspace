#!/usr/bin/env node
/**
 * calibrate.mjs — compute the judge trust metrics.
 *
 * Reads calibration/sheet.json (human_verdict filled in), computes:
 *   - raw agreement (all verdicts)
 *   - Cohen's kappa (ternary: Satisfied/Partially/Not Satisfied; negatives mapped)
 *   - negative-criteria agreement (Present/Absent, informational)
 * Compares against the rubric trust bar:
 *   raw_agreement >= 0.80  AND  cohens_kappa >= 0.60
 * Writes calibration/CALIBRATION.md and exits non-zero if the bar is not met.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const BENCH = '/home/p31/P31-local-workspace/tools/jitterbug-bench'
const sheet = JSON.parse(readFileSync(resolve(BENCH, 'calibration/sheet.json'), 'utf8'))
const rubric = JSON.parse(readFileSync(resolve(BENCH, 'rubric.json'), 'utf8'))
const bar = rubric.judge.trust_bar

const filled = sheet.items.filter((i) => i.human_verdict && i.human_verdict.trim().length > 0)
if (filled.length === 0) {
  console.error('No human_verdict filled — edit calibration/sheet.json first.')
  process.exit(2)
}

// Map Present/Absent into the ternary category space (for kappa).
function normalize(v) {
  if (v === 'Present') return 'Not Satisfied'
  if (v === 'Absent') return 'Satisfied'
  return v
}

const ternaryPairs = filled.map((i) => ({ human: normalize(i.human_verdict.trim()), judge: normalize(i.judge_verdict ?? '') }))

const rawAgreement = ternaryPairs.filter((p) => p.human === p.judge).length / ternaryPairs.length

const cats = ['Satisfied', 'Partially', 'Not Satisfied']
const n = ternaryPairs.length
const confusion = {}
for (const c of cats) { confusion[c] = {}; for (const d of cats) confusion[c][d] = 0 }
for (const p of ternaryPairs) confusion[p.human][p.judge] += 1
let po = 0
for (const c of cats) po += confusion[c][c]
po /= n
const humanMarg = {}, judgeMarg = {}
for (const c of cats) {
  humanMarg[c] = ternaryPairs.filter((p) => p.human === c).length / n
  judgeMarg[c] = ternaryPairs.filter((p) => p.judge === c).length / n
}
let pe = 0
for (const c of cats) pe += humanMarg[c] * judgeMarg[c]
const kappa = pe === 1 ? 0 : (po - pe) / (1 - pe)

const negPairs = filled.filter((i) => i.weight < 0).map((i) => ({ h: i.human_verdict.trim(), j: i.judge_verdict ?? '' }))
const negAgree = negPairs.length === 0 ? null : negPairs.filter((p) => p.h === p.j).length / negPairs.length

const passAgree = rawAgreement >= bar.raw_agreement
const passKappa = kappa >= bar.cohens_kappa
const pass = passAgree && passKappa

const lines = [
  `# Judge Calibration`,
  ``,
  `Run: ${sheet.run}`,
  `Human verdicts: ${filled.length} of ${sheet.items.length}`,
  ``,
  `| Metric | Value | Trust bar | Pass |`,
  `|---|---|---|---|`,
  `| Raw agreement | ${rawAgreement.toFixed(3)} | >= ${bar.raw_agreement} | ${passAgree ? 'YES' : 'NO'} |`,
  `| Cohen's kappa | ${kappa.toFixed(3)} | >= ${bar.cohens_kappa} | ${passKappa ? 'YES' : 'NO'} |`,
  `| Negative-criteria agreement | ${negAgree === null ? 'n/a' : negAgree.toFixed(3)} | (informational) | — |`,
  ``,
  `**Verdict: ${pass ? 'JUDGE CALIBRATED — scores are authoritative.' : 'JUDGE NOT CALIBRATED — scores are advisory only.'}**`,
  ``,
  `## Confusion matrix (human → judge)`,
  ``,
  `| | ${cats.join(' | ')} |`,
  `|---|---|---|---|`,
  ...cats.map((h) => `| **${h}** | ${cats.map((j) => confusion[h][j]).join(' | ')} |`),
  ``,
  pass
    ? `## Next step`
    : `## What this means`,
  pass
    ? `The frontier comparison leg (run-bench.mjs --models glm-5.3,deepseek-v4-pro) is now valid. Run it.`
    : `Do not run the frontier comparison. Tune the judge prompt or switch the rubric to "advisory" status.`,
]
writeFileSync(resolve(BENCH, 'calibration/CALIBRATION.md'), lines.join('\n'), 'utf-8')

console.log(lines.join('\n'))
process.exit(pass ? 0 : 1)