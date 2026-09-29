/**
 * approve — the human anchor's signature.
 *
 * "Never go full delta" means there is always a human reference point. This
 * module records that reference point as a hash-chained block: the reviewer's
 * PICKLE name (never a real name — "the street never shows a human name"),
 * the SHA-256 of the exact spec they approved, the decision, and a scope.
 *
 * An approval is bound to the input hash. If the spec changes after approval,
 * the approval is stale and the canon gate rejects it — tamper-evidence.
 *
 * The reviewer identity is the family's pickle name for the adult builder:
 * Half-Sour (adult, "builds the workshop ships"). It is explicit per call —
 * no hidden default identity.
 */
import { readFileSync, appendFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { JsonlAgenticAuditSink, type AgenticBlock } from './audit.js'

export interface HumanApprovalPayload {
  domain: string
  /** The reviewer's pickle name — never a real name. */
  reviewer: string
  component: string
  /** SHA-256 of the approved spec bytes */
  inputHash: string
  decision: 'approved' | 'rejected'
  scope: 'canon-change' | 'advisory'
  note: string
}

/** The default reviewer pickle name — the adult builder, Half-Sour. */
export const DESIGN_REVIEWER_PICKLE = 'Half-Sour'

/** SHA-256 of a spec file's exact bytes. */
export function hashSpec(path: string): string {
  return createHash('sha256').update(readFileSync(path, 'utf8')).digest('hex')
}

/**
 * Scan the design chain for the most recent human-approval block bound to
 * this inputHash. Returns the block or null.
 */
export function findApproval(sink: JsonlAgenticAuditSink, inputHash: string): AgenticBlock | null {
  if (!existsSync(sink.chainPath)) return null
  const lines = readFileSync(sink.chainPath, 'utf8').trim().split('\n').filter(Boolean)
  for (let i = lines.length - 1; i >= 0; i--) {
    const b = JSON.parse(lines[i]) as AgenticBlock
    const p = b.payload as unknown as HumanApprovalPayload
    if (b.eventType === 'human-approval' && p.inputHash === inputHash) return b
  }
  return null
}

/**
 * Emit a human-approval block. The block's eventType is 'human-approval' and
 * its payload records the reviewer pickle, decision, scope, and input hash.
 * Returns the appended block.
 */
export function approveSpec(opts: {
  file: string
  reviewer: string
  decision: 'approved' | 'rejected'
  scope: 'canon-change' | 'advisory'
  note?: string
}): AgenticBlock {
  const sink = JsonlAgenticAuditSink.default()
  const inputHash = hashSpec(opts.file)
  // Read the component name from the spec for the payload.
  const raw = readFileSync(opts.file, 'utf8')
  const m = raw.match(/^component:\s*(.+)$/m)
  const component = m?.[1]?.trim() ?? 'unknown'

  const block: Omit<AgenticBlock, 'currentHash'> = {
    blockNumber: 0, // overwritten by sink
    timestamp: new Date().toISOString(),
    eventType: 'genesis', // overwritten by sink
    payload: {
      domain: 'design',
      reviewer: opts.reviewer,
      component,
      inputHash,
      decision: opts.decision,
      scope: opts.scope,
      note: opts.note ?? '',
    },
    prevHash: '0'.repeat(64), // overwritten by sink
  }
  // Reuse the sink's chain mechanics but force the human-approval event type.
  const last = lastBlock(sink)
  block.blockNumber = last ? last.blockNumber + 1 : 0
  block.prevHash = last ? last.currentHash : '0'.repeat(64)
  block.eventType = block.blockNumber === 0 ? 'genesis' : 'human-approval'
  return appendBlock(sink, block)
}

/** Read the last block in the chain (internal helper). */
function lastBlock(sink: JsonlAgenticAuditSink): AgenticBlock | null {
  if (!existsSync(sink.chainPath)) return null
  const lines = readFileSync(sink.chainPath, 'utf8').trim().split('\n').filter(Boolean)
  if (lines.length === 0) return null
  return JSON.parse(lines[lines.length - 1]) as AgenticBlock
}

/** Append a block with the correct SHA-256 linkage (mirrors the sink). */
function appendBlock(sink: JsonlAgenticAuditSink, block: Omit<AgenticBlock, 'currentHash'>): AgenticBlock {
  const canonical = JSON.stringify({
    blockNumber: block.blockNumber,
    timestamp: block.timestamp,
    eventType: block.eventType,
    payload: block.payload,
    prevHash: block.prevHash,
  })
  const currentHash = createHash('sha256').update(canonical).digest('hex')
  const full: AgenticBlock = { ...block, currentHash }
  appendFileSync(sink.chainPath, JSON.stringify(full) + '\n')
  return full
}