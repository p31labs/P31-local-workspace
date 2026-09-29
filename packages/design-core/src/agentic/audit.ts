/**
 * agentic-audit — the design pipeline's provenance sink.
 *
 * Each agentic design stage (narrator → architect → mechanic → firmware) emits
 * a block into the same SHA-256 hash chain the governance runtime uses, but
 * with a purpose-built `agentic` eventType. This is the provenance root:
 * every agent action, gate verdict, and human checkpoint is recorded
 * tamper-evidently and reconciled into the enterprise timeline.
 *
 * Block: { blockNumber, timestamp, eventType: 'agentic', payload, prevHash, currentHash }
 * currentHash = SHA-256 over {blockNumber, timestamp, eventType, payload, prevHash}.
 */
import { createHash } from 'node:crypto'
import { appendFileSync, readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export type AgentStage = 'lantern-narrator' | 'lantern-architect' | 'lantern-mechanic' | 'lantern-firmware'

export interface AgenticEventPayload {
  domain: string
  stage: AgentStage
  component: string
  /** SHA-256 of the stage's input artifact */
  inputHash: string
  /** Gate verdict: 'approved' | 'rejected' | 'passed' | 'pending' */
  gateVerdict: string
  /** Human checkpoint: 'approved' | 'rejected' | 'not-required' */
  humanCheckpoint: string
  summary: string
}

export interface AgenticBlock {
  blockNumber: number
  timestamp: string
  eventType: 'genesis' | 'agentic' | 'human-approval'
  payload: AgenticEventPayload | HumanApprovalPayloadLike
  prevHash: string
  currentHash: string
}

/** The human-approval payload shape (defined fully in approve.ts). */
export interface HumanApprovalPayloadLike {
  domain: string
  reviewer: string
  component: string
  inputHash: string
  decision: 'approved' | 'rejected'
  scope: 'canon-change' | 'advisory'
  note?: string
}

export interface AgenticAuditSink {
  append(payload: AgenticEventPayload | HumanApprovalPayloadLike): AgenticBlock
  readonly chainPath: string
}

/** SHA-256 over the canonical JSON of the block fields. */
function hashBlock(b: Omit<AgenticBlock, 'currentHash'>): string {
  const canonical = JSON.stringify({
    blockNumber: b.blockNumber,
    timestamp: b.timestamp,
    eventType: b.eventType,
    payload: b.payload,
    prevHash: b.prevHash,
  })
  return createHash('sha256').update(canonical).digest('hex')
}

export class JsonlAgenticAuditSink implements AgenticAuditSink {
  readonly chainPath: string

  constructor(chainPath: string) {
    this.chainPath = chainPath
  }

  /** Default: the design domain's governance chain, resolved from this file. */
  static default(): JsonlAgenticAuditSink {
    const here = dirname(fileURLToPath(import.meta.url))
    const chain = resolve(
      here,
      '..', '..', '..', '..',
      'packages', 'govern', 'domains', 'design', '.govern-audit.jsonl',
    )
    return new JsonlAgenticAuditSink(chain)
  }

  private last(): AgenticBlock | null {
    if (!existsSync(this.chainPath)) return null
    const lines = readFileSync(this.chainPath, 'utf8').trim().split('\n').filter(Boolean)
    if (lines.length === 0) return null
    return JSON.parse(lines[lines.length - 1]) as AgenticBlock
  }

  append(payload: AgenticEventPayload | HumanApprovalPayloadLike): AgenticBlock {
    const last = this.last()
    const blockNumber = last ? last.blockNumber + 1 : 0
    const prevHash = last ? last.currentHash : '0'.repeat(64)
    const block: Omit<AgenticBlock, 'currentHash'> = {
      blockNumber,
      timestamp: new Date().toISOString(),
      eventType: blockNumber === 0 ? 'genesis' : 'agentic',
      payload,
      prevHash,
    }
    const full: AgenticBlock = { ...block, currentHash: hashBlock(block) }
    appendFileSync(this.chainPath, JSON.stringify(full) + '\n')
    return full
  }
}

/** Hash an artifact string for the inputHash field. */
export function hashInput(artifact: string): string {
  return createHash('sha256').update(artifact).digest('hex')
}