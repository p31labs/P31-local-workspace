#!/usr/bin/env node
/**
 * render-pdf.mjs — HTML report -> PDF via headless Chromium.
 *
 * The styled report HTML (render-report.mjs) is print-ready: @page A4,
 * running footer, cover full-page. This renders it to PDF with the system
 * chromium. Zero new dependencies.
 *
 * Usage:
 *   node scripts/render-pdf.mjs --session <id> [--out <path>.pdf]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPORT_DIR = '/tmp/report'

function main() {
  const si = process.argv.indexOf('--session')
  const session = si >= 0 ? process.argv[si + 1] : null
  if (!session) {
    console.error('usage: node scripts/render-pdf.mjs --session <id> [--out <path>]')
    process.exit(2)
  }
  const htmlPath = resolve(REPORT_DIR, `${session}.report.html`)
  if (!existsSync(htmlPath)) {
    console.error(`render-pdf: no report html at ${htmlPath}`)
    process.exit(1)
  }
  const oi = process.argv.indexOf('--out')
  const pdfPath = oi >= 0 ? process.argv[oi + 1] : resolve(REPORT_DIR, `${session}.report.pdf`)

  // Headless chromium print-to-pdf. Uses the system chromium if present.
  const chromium = process.env.CHROMIUM_BIN || 'chromium'
  try {
    execFileSync(chromium, [
      '--headless', '--disable-gpu', '--no-sandbox',
      `--print-to-pdf=${pdfPath}`, '--no-pdf-header-footer', htmlPath,
    ], { stdio: 'pipe' })
  } catch (e) {
    console.error(`render-pdf: chromium failed (is it installed? set CHROMIUM_BIN if not 'chromium').\n${e.stderr?.toString?.() ?? ''}`)
    process.exit(1)
  }
  const size = existsSync(pdfPath) ? statSize(pdfPath) : 0
  console.log(`report pdf -> ${pdfPath} (${size} bytes)`)
}

function statSize(p) {
  try { return readFileSync(p).length } catch { return 0 }
}

if (fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? '')) {
  main()
}