#!/usr/bin/env node
import { writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { execSync } from 'node:child_process'

const TMP = '/tmp/p31-hex-smoke'
mkdirSync(`${TMP}/src`, { recursive: true })
writeFileSync(`${TMP}/src/test.tsx`, `export const x = "#AABBCC"\n`)

try {
  execSync(
    `if grep -rEn '#[0-9a-fA-F]{3,8}\\b' ${TMP} --include='*.tsx' --include='*.astro' --include='*.css' --include='*.html' --exclude-dir=node_modules 2>/dev/null; then exit 1; else exit 0; fi`,
    { shell: '/bin/bash' }
  )
  console.error('Smoke test FAILED — hex gate should have exited nonzero on hardcoded hex fixture')
  process.exit(1)
} catch {
  console.log('Smoke test PASSED — hex gate correctly detected hardcoded hex in fixture')
} finally {
  rmSync(TMP, { recursive: true, force: true })
}
