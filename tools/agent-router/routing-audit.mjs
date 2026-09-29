#!/usr/bin/env node
/**
 * routing-audit — the routing decision, made governable.
 *
 * Every stage's routing decision is appended to the design audit chain as a
 * 'routing' block: stage, intent tag, model used, cost index, attempts, schema
 * verdict. This closes the "routing decision nobody governs" gap — the model
 * selection that shapes the output is itself a governed artifact.
 *
 * Block: { blockNumber, timestamp, eventType: 'routing', payload, prevHash, currentHash }
 */
import { appendFileSync, readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'

const CHAIN = '/home/p31/P31-local-workspace/packages/govern/domains/design/.govern-audit.jsonl'

function last() {
  if (!existsSync(CHAIN)) return null
  const lines = readFileSync(CHAIN, 'utf8').trim().split('\n').filter(Boolean)
  if (lines.length === 0) return null
  return JSON.parse(lines[lines.length - 1])
}

/** Append a routing block. Returns the block. */
export function emitRoutingBlock(payload) {
  const prev = last()
  const blockNumber = prev ? prev.blockNumber + 1 : 0
  const prevHash = prev ? prev.currentHash : '0'.repeat(64)
  const block = {
    blockNumber,
    timestamp: new Date().toISOString(),
    eventType: 'routing',
    payload: { domain: 'design', routing: payload },
    prevHash,
  }
  const canonical = JSON.stringify({
    blockNumber: block.blockNumber,
    timestamp: block.timestamp,
    eventType: block.eventType,
    payload: block.payload,
    prevHash: block.prevHash,
  })
  block.currentHash = createHash('sha256').update(canonical).digest('hex')
  appendFileSync(CHAIN, JSON.stringify(block) + '\n')
  return block
}