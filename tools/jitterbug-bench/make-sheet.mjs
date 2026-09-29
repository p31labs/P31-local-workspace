#!/usr/bin/env node
/**
 * make-sheet.mjs — generate the human hand-scoring sheet for judge calibration.
 *
 * Picks the two extreme reports (lowest + highest compliance) from the newest
 * jitterbug run, writes:
 *   calibration/SHEET.md       — human-readable (open in editor, fill verdicts)
 *   calibration/sheet.json     — machine-readable skeleton (calibrate.mjs input)
 *   calibration/reports/*.md   — the report text for each prompt (read-only)
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const BENCH = '/home/p31/P31-local-workspace/tools/jitterbug-bench'
const CAL = resolve(BENCH, 'calibration')
const REPORTS = resolve(CAL, 'reports')
mkdirSync(CAL, { recursive: true })
mkdirSync(REPORTS, { recursive: true })

const rubric = JSON.parse(readFileSync(resolve(BENCH, 'rubric.json'), 'utf8'))
// Newest run by modification time — name sort is NOT reliable (suffixes like
// "-unpinned-judge" sort after plain dates and would pick a stale run).
const runs = readdirSync(resolve(BENCH, 'runs'))
  .filter((d) => !d.startsWith('.'))
  .sort((a, b) => statSync(resolve(BENCH, 'runs', b)).mtimeMs - statSync(resolve(BENCH, 'runs', a)).mtimeMs)
const newest = runs[0]
const results = JSON.parse(readFileSync(resolve(BENCH, 'runs', newest, 'results.json'), 'utf8')).results

const jit = results.filter((r) => r.source === 'jitterbug')
jit.sort((a, b) => a.compliance - b.compliance)
const picks = [jit[0], jit[jit.length - 1]]
if (!picks[0]) { console.error('no jitterbug results found'); process.exit(1) }

const sheet = { run: newest, generated: new Date().toISOString(), items: [] }
const mdLines = [
  `# Judge Calibration Sheet`,
  ``,
  `Run: ${newest}`,
  ``,
  `**Instructions:** For each criterion below, replace \`______\` with one of:`,
  `\`Satisfied\` / \`Partially\` / \`Not Satisfied\` (positive criteria),`,
  `or \`Present\` / \`Absent\` (negative criteria, weight < 0).`,
  ``,
  `Read the full report at the path shown before scoring.`,
  ``,
  `When done, edit \`tools/jitterbug-bench/calibration/sheet.json\` to match and run`,
  `\`node tools/jitterbug-bench/calibrate.mjs\` to compute agreement + Cohen's kappa.`,
  ``,
  `---`,
]

for (const row of picks) {
  const promptRubric = rubric.prompts[row.prompt]
  const reportPath = resolve(REPORTS, `${row.prompt}.md`)
  writeFileSync(reportPath, row.report ?? '(report text missing)', 'utf-8')

  mdLines.push(``)
  mdLines.push(`## ${row.prompt}`)
  mdLines.push(``)
  mdLines.push(`Compliance (judge): **${row.compliance.toFixed(3)}**  ·  Report: \`${reportPath}\``)
  mdLines.push(``)
  mdLines.push(`| ID | Axis | Criterion | Your verdict |`)
  mdLines.push(`|---|---|---|---|`)
  for (const c of promptRubric.rubrics) {
    const isNeg = c.weight < 0
    const hint = isNeg ? 'Present / Absent' : 'Satisfied / Partially / Not Satisfied'
    mdLines.push(`| ${c.id} | ${c.axis} | ${c.criterion} | ______ *(${hint})* |`)
    sheet.items.push({
      prompt: row.prompt,
      id: c.id,
      axis: c.axis,
      criterion: c.criterion,
      weight: c.weight,
      human_verdict: '',
      judge_verdict: (row.judgement.scores ?? []).find((s) => s.id === c.id)?.verdict ?? null,
    })
  }
}

writeFileSync(resolve(CAL, 'SHEET.md'), mdLines.join('\n'), 'utf-8')
writeFileSync(resolve(CAL, 'sheet.json'), JSON.stringify(sheet, null, 2), 'utf-8')

console.log(`wrote ${resolve(CAL, 'SHEET.md')} (${sheet.items.length} verdicts to hand-score)`)
console.log(`wrote ${resolve(CAL, 'sheet.json')} (fill human_verdict fields)`)
console.log(`wrote ${REPORTS}/ for the picked reports`)