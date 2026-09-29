import { describe, it, expect } from 'vitest'
import { readFileSync, writeFileSync, copyFileSync, mkdtempSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { execSync } from 'node:child_process'
import { hashSpec, findApproval, DESIGN_REVIEWER_PICKLE } from '../../src/agentic/approve.ts'
import { JsonlAgenticAuditSink } from '../../src/agentic/audit.ts'

const CORE = resolve(__dirname, '..', '..')
const SPEC = join(CORE, 'src', 'agentic', 'intent', 'examples', 'button-affirm.yml')

function cli(args: string): { out: string; code: number } {
  try {
    const out = execSync(`pnpm exec tsx src/agentic/cli.ts ${args}`, {
      cwd: CORE, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    })
    return { out, code: 0 }
  } catch (e: unknown) {
    const err = e as { stdout?: string; stderr?: string; status?: number }
    return { out: (err.stdout ?? '') + (err.stderr ?? ''), code: err.status ?? 1 }
  }
}

describe('human anchor — the never-full-delta gate', () => {
  it('refuses to approve without --by (no silent default identity)', () => {
    const { code } = cli(`approve ${SPEC}`)
    expect(code).toBe(1)
  })

  it('refuses canon audit with no matching approval (gate can block)', () => {
    // Use a spec that has never been approved and has distinct bytes.
    const fixture = join(CORE, 'src', 'agentic', 'intent', 'examples', '__nc__fail-contrast.yml')
    const { out, code } = cli(`audit --canon ${fixture}`)
    expect(code).toBe(1)
    expect(out).toContain('no human approval bound to this spec hash')
  })

  it('approval is bound to the spec hash — an edited spec invalidates it', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'anchor-'))
    try {
      const edited = join(tmp, 'edited.yml')
      copyFileSync(SPEC, edited)
      expect(cli(`approve ${SPEC} --by ${DESIGN_REVIEWER_PICKLE}`).code).toBe(0)
      // the original is now approved
      expect(findApproval(JsonlAgenticAuditSink.default(), hashSpec(SPEC))).not.toBeNull()
      // an edited copy is NOT approved (different bytes → different hash)
      writeFileSync(edited, readFileSync(edited, 'utf8').replace('contrast: 7', 'contrast: 6'))
      expect(findApproval(JsonlAgenticAuditSink.default(), hashSpec(edited))).toBeNull()
    } finally {
      rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('approves with the reviewer pickle name recorded', () => {
    const { out, code } = cli(`approve ${SPEC} --by ${DESIGN_REVIEWER_PICKLE}`)
    expect(code).toBe(0)
    expect(out).toContain(DESIGN_REVIEWER_PICKLE)
    expect(out).toContain('block #')
  })
})