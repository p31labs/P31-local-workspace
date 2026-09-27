/**
 * D1 read helpers for the public verify surface.
 *
 * Deliberately minimal: only the read paths the public endpoints need. It does
 * NOT import the gated app's `_lib/log.ts` (which pulls in the write gate,
 * scope evaluation, and Lumi token verification). The one shared substrate it
 * DOES reuse is @p31ca/canon/loom/hash-chain — the canonicalizer and the chain
 * verifier — so the public verdict is computed with the exact same code as the
 * gated app: same bytes, same SHA-256, same verdict.
 */
import {
  canonicalize,
  GENESIS_PREV_HASH,
  type ChainRecord,
} from '@p31ca/canon/loom/hash-chain'
import type { D1Database } from '@cloudflare/workers-types'

export interface D1Env {
  LOOM_D1: D1Database
}

export interface LoomRecord extends ChainRecord {
  scope: string
}

export interface RefusalRecord {
  seq: number
  ts: string
  mode: 'observe' | 'enforce'
  session: string
  agent: string
  kind: string
  node: string
  reason: string
  prev_hash: string
}

export async function readRecords(env: D1Env): Promise<LoomRecord[]> {
  const { results } = await env.LOOM_D1.prepare(
    'SELECT seq, ts, data, prev_hash, scope FROM events ORDER BY seq ASC',
  ).all<{ seq: number; ts: string; data: string; prev_hash: string; scope: string }>()
  return (results ?? []).map((r) => ({
    seq: r.seq,
    ts: r.ts,
    data: r.data,
    prev_hash: r.prev_hash ?? GENESIS_PREV_HASH,
    scope: (r.scope ?? 'shared') as string,
  }))
}

export async function readRefusals(env: D1Env): Promise<RefusalRecord[]> {
  const { results } = await env.LOOM_D1.prepare(
    'SELECT seq, ts, mode, session, agent, kind, node, reason, prev_hash FROM refusals ORDER BY seq ASC',
  ).all<RefusalRecord>()
  return results ?? []
}

/** The ChainRecord view of a refusal row — same canonicalizer as the events
 *  log, so the refusals sidecar is verifiable with the same code. */
export function refusalToChainRecord(r: RefusalRecord): ChainRecord {
  return {
    seq: r.seq,
    ts: r.ts,
    data: canonicalize({
      mode: r.mode,
      session: r.session,
      agent: r.agent,
      kind: r.kind,
      node: r.node,
      reason: r.reason,
    }),
    prev_hash: r.prev_hash,
  }
}