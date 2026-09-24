/**
 * sanitizer.ts — runtime argument sanitization for the MCP call proxy (N2).
 * Pure TS, no runtime deps. Applied in handleCall before the upstream request:
 *  - body/field size caps (413)
 *  - command/URL sink detection (400) — URLs allowed only for URL-shaped
 *    schema fields declared by the tool
 *  - base64-bomb detection (400)
 * Rejections are counted in KV and surfaced in /anomalies.
 */

export const LIMITS = {
  maxBodyBytes: 64 * 1024,
  maxStringBytes: 8 * 1024,
  maxObjectKeys: 100,
  maxArrayItems: 16,
  maxDepth: 4,
  maxBase64BlobBytes: 32 * 1024,
} as const

export type Rejection = { ok: true } | { ok: false; status: 413 | 400; reason: string; field?: string }

interface PropMeta { type?: string }

const URL_SHAPED_KEY = /\b(url|endpoint|host|origin|uri|link|webhook|callback)\b/i
const COMMAND_SINKS = /(\bcurl\b|\bwget\b|\bbash\s+-c|\bsh\s+-c|\beval\(|\bexec\(|\bsystem\(|`|<\s*script|file:\/\/|gopher:\/\/)/
const EXTERNAL_URL = /https?:\/\/[^\s"'`]+/i
const BASE64_BLOB = /[A-Za-z0-9+/]{43,}={0,2}/g
const MAGIC = [
  { name: 'ELF', bytes: [0x7f, 0x45, 0x4c, 0x46] },
  { name: 'ZIP', bytes: [0x50, 0x4b, 0x03, 0x04] },
  { name: 'GIF', bytes: [0x47, 0x49, 0x46, 0x38] },
  { name: 'PE', bytes: [0x4d, 0x5a] },
]

function walk(value: unknown, path: string, depth: number, schemaProps: Record<string, PropMeta>, out: string[]): void {
  if (depth > LIMITS.maxDepth) { out.push(`${path}: nesting exceeds ${LIMITS.maxDepth} levels`); return }
  if (Array.isArray(value)) {
    if (value.length > LIMITS.maxArrayItems) out.push(`${path}: array exceeds ${LIMITS.maxArrayItems} items`)
    value.forEach((v, i) => walk(v, `${path}[${i}]`, depth + 1, schemaProps, out))
    return
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length > LIMITS.maxObjectKeys) out.push(`${path}: object exceeds ${LIMITS.maxObjectKeys} keys`)
    for (const [k, v] of entries) walk(v, `${path}.${k}`, depth + 1, schemaProps, out)
    return
  }
  if (typeof value === 'string') {
    if (Buffer.byteLength(value, 'utf8') > LIMITS.maxStringBytes) out.push(`${path}: string exceeds ${LIMITS.maxStringBytes} bytes`)
    const key = path.split('.').pop() ?? path
    const urlShaped = URL_SHAPED_KEY.test(key) || Boolean(schemaProps[key]?.type === 'string' && URL_SHAPED_KEY.test(key))
    if (COMMAND_SINKS.test(value)) { out.push(`${path}: command sink pattern`); return }
    if (!urlShaped && EXTERNAL_URL.test(value)) out.push(`${path}: external URL (tool schema does not declare a URL-shaped field)`)
    // Base64-bomb detection: large base64 blobs + binary magic on decode.
    for (const m of value.matchAll(BASE64_BLOB)) {
      const blob = m[0].replace(/={1,2}$/, '')
      if (blob.length >= 32 && Buffer.byteLength(blob, 'utf8') >= LIMITS.maxBase64BlobBytes) {
        out.push(`${path}: base64 blob ${blob.length} chars exceeds ${LIMITS.maxBase64BlobBytes} bytes`)
        break
      }
      if (blob.length >= 32) {
        try {
          const decoded = Buffer.from(blob, 'base64')
          for (const magic of MAGIC) {
            if (decoded.length >= magic.bytes.length && magic.bytes.every((b, i) => decoded[i] === b)) {
              out.push(`${path}: binary magic (${magic.name}) inside base64 argument`)
              break
            }
          }
        } catch {
          /* not valid base64 — ignore */
        }
      }
    }
  }
}

/** Validate a tool call's arguments against the sanitization rules. */
export function validateArgs(
  args: Record<string, unknown>,
  toolSchema?: { properties?: Record<string, PropMeta> },
): Rejection {
  const problems: string[] = []
  walk(args, 'args', 1, (toolSchema?.properties ?? {}) as Record<string, PropMeta>, problems)
  if (problems.length === 0) return { ok: true }
  const field = problems[0].split(':')[0]
  const oversized = problems.some((p) => p.includes('bytes') || p.includes('keys') || p.includes('items') || p.includes('nesting'))
  return { ok: false, status: oversized ? 413 : 400, reason: problems[0], field }
}

/** Validate the raw JSON-RPC request body size before parsing. */
export function validateBodySize(bodyText: string): Rejection {
  if (Buffer.byteLength(bodyText, 'utf8') > LIMITS.maxBodyBytes) {
    return { ok: false, status: 413, reason: `body exceeds ${LIMITS.maxBodyBytes} bytes` }
  }
  return { ok: true }
}