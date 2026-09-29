#!/usr/bin/env node
/**
 * Negative control for verify.mjs.
 *
 * A verifier that cannot be shown to fail is furniture. This control runs
 * the real verify.mjs against a manifest with a deliberately false claim
 * (a file that does not exist — the exact class this session hallucinated:
 * approve.ts). It must exit 1 with VERIFY_RESULT: FAIL. Emits
 * NEGATIVE_CONTROL_OK on success.
 */
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

const verify = resolve('/home/p31/P31-local-workspace/tools/agent-verify/verify.mjs')
const fixture = resolve('/home/p31/P31-local-workspace/tools/agent-verify/nc/false-claims.json')

let exit = 0
try {
  execFileSync(process.execPath, [verify, '--claims', fixture], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
} catch (e) {
  exit = e && e.status !== undefined ? e.status : 1
}

if (exit === 1) {
  console.log('NEGATIVE_CONTROL_OK: verify.mjs rejected a false claim (exit 1)')
  process.exit(0)
}
console.error(`NC_FAILED: verify.mjs exited ${exit}, expected 1 — the verifier could not be shown to fail`)
process.exit(1)