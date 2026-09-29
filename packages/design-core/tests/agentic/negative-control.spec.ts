import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { parseIntent } from '../../src/agentic/intent/parser'
import { runQaGates } from '../../src/agentic/qa/gates'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CORE = resolve(__dirname, '..', '..')

describe('Opus QA gate — negative control', () => {
  it("rejects a fixture with contrast below the AA floor (a gate that can't fail is furniture)", () => {
    const fixture = join(CORE, 'src', 'agentic', 'intent', 'examples', '__nc__fail-contrast.yml')
    const res = parseIntent(readFileSync(fixture, 'utf8'))
    expect(res.ok).toBe(true)
    expect(runQaGates(res.spec!).approved).toBe(false)
  })

  it('design audit --nc exits 0 with the marker (proves the gate can fail)', () => {
    const out = execSync('pnpm exec tsx src/agentic/cli.ts audit --nc', {
      cwd: CORE,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    expect(out).toContain('NEGATIVE CONTROL OK')
  })
})