import { describe, it, expect } from 'vitest'
import { validateArgs, validateBodySize, LIMITS } from './sanitizer'

const NO_SCHEMA = undefined

describe('sanitizer: size caps', () => {
  it('rejects oversized string arguments (413)', () => {
    const r = validateArgs({ q: 'x'.repeat(LIMITS.maxStringBytes + 1) }, NO_SCHEMA)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(413)
  })

  it('rejects too many object keys (413)', () => {
    const o: Record<string, unknown> = {}
    for (let i = 0; i < LIMITS.maxObjectKeys + 5; i++) o['k' + i] = 1
    const r = validateArgs({ payload: o }, NO_SCHEMA)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(413)
  })

  it('rejects too many array items (413)', () => {
    const r = validateArgs({ list: Array.from({ length: LIMITS.maxArrayItems + 3 }, (_, i) => i) }, NO_SCHEMA)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(413)
  })

  it('rejects deep nesting (413)', () => {
    let v: unknown = {}
    let cur: Record<string, unknown> = {}
    const root = cur
    for (let i = 0; i < LIMITS.maxDepth + 3; i++) { cur.child = {}; cur = cur.child as Record<string, unknown> }
    const r = validateArgs({ root }, NO_SCHEMA)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(413)
  })

  it('body size cap (413)', () => {
    const r = validateBodySize('x'.repeat(LIMITS.maxBodyBytes + 1))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(413)
  })
})

describe('sanitizer: command / URL sinks', () => {
  it('rejects command-sink patterns (400)', () => {
    for (const bad of ['curl http://x', 'bash -c "rm -rf /"', 'eval(atob(...))', '<script>alert(1)</script>', 'file:///etc/passwd']) {
      const r = validateArgs({ cmd: bad }, NO_SCHEMA)
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.status).toBe(400)
    }
  })

  it('rejects external URLs unless the schema declares a URL-shaped field', () => {
    const noSchema = validateArgs({ data: 'https://evil.example/hook' }, NO_SCHEMA)
    expect(noSchema.ok).toBe(false)
    // Declared url field → allowed.
    const withSchema = validateArgs({ url: 'https://evil.example/hook' }, { properties: { url: { type: 'string' } } })
    expect(withSchema.ok).toBe(true)
  })

  it('allows benign arguments', () => {
    const r = validateArgs({ q: 'search tokens', count: 5, enabled: true }, NO_SCHEMA)
    expect(r.ok).toBe(true)
  })
})

describe('sanitizer: base64-bomb / binary magic', () => {
  it('rejects large base64 blobs (400)', () => {
    const big = Buffer.alloc(33 * 1024, 65).toString('base64')
    const r = validateArgs({ data: big }, NO_SCHEMA)
    expect(r.ok).toBe(false)
  })

  it('rejects base64-encoded binary magic (ELF)', () => {
    const elf = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, 0x00, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]).toString('base64')
    const r = validateArgs({ payload: elf }, NO_SCHEMA)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toContain('ELF')
  })

  it('allows short base64 that is not a bomb', () => {
    const r = validateArgs({ token: Buffer.from('hello').toString('base64') }, NO_SCHEMA)
    expect(r.ok).toBe(true)
  })
})