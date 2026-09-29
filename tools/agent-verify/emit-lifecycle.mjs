#!/usr/bin/env node
/**
 * emit-lifecycle — Authority Lifecycle Events (IETF GAR).
 *
 * Appends an authority-lifecycle block to the design audit chain so the
 * session's governance state is recorded: session-init, authority-grant,
 * authority-suspend, authority-restore, session-revoke.
 *
 * Usage: node tools/agent-verify/emit-lifecycle.mjs --event <event> [--note "..."]
 * The block reuses the agentic audit chain mechanics (SHA-256 hash-link).
 */
import { appendFileSync, readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'

const CHAIN = '/home/p31/P31-local-workspace/packages/govern/domains/design/.govern-audit.jsonl'

const EVENTS = new Set(['session-init', 'authority-grant', 'authority-suspend', 'authority-restore', 'session-revoke'])

const arg = (name) => {
  const i = process.argv.indexOf(name)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null
}

const event = arg('--event')
if (!event || !EVENTS.has(event)) {
  console.error(`usage: emit-lifecycle.mjs --event <${[...EVENTS].join('|')}> [--note "..."]`)
  process.exit(2)
}
const note = arg('--note') ?? ''

function last() {
  if (!existsSync(CHAIN)) return null
  const lines = readFileSync(CHAIN, 'utf8').trim().split('\n').filter(Boolean)
  if (lines.length === 0) return null
  return JSON.parse(lines[lines.length - 1])
}

const prev = last()
const blockNumber = prev ? prev.blockNumber + 1 : 0
const prevHash = prev ? prev.currentHash : '0'.repeat(64)
const payload = { domain: 'design', lifecycleEvent: event, note, sequenceNumber: blockNumber }
const block = {
  blockNumber,
  timestamp: new Date().toISOString(),
  eventType: 'lifecycle',
  payload,
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
console.log(`✅ lifecycle:${event} → block #${block.blockNumber} → ${block.currentHash.slice(0, 16)}…`)
process.exit(0)