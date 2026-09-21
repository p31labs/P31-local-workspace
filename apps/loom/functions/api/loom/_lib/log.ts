import { ReplayGate, type LoomEventInput } from '@p31/canon/loom/gate';
import type { LoomEvent } from '@p31/canon/loom/events';
import {
  hashRecord,
  GENESIS_PREV_HASH,
  type ChainRecord,
} from '@p31/canon/loom/hash-chain';

/**
 * The D1-backed log adapter. The canon's log is file-based locally; in the
 * edge it is D1 rows. seq/ts are gate-assigned; the full event JSON is stored
 * in `data` so replay reconstructs LoomEvent objects exactly.
 *
 * The gate is stateless per invocation, so appendEvent rebuilds it by folding
 * the existing rows first (reconstructing proposalIds / proposalRevisions),
 * then appends the new input. O(log length) per append — trivial for a family
 * log.
 *
 * prev_hash: each row links to the one before it (SHA-256 of the previous
 * row's canonical preimage). `readRecords` returns the ChainRecord view so the
 * trust endpoints (/verify, /provenance) can recompute the chain; `appendEvent`
 * stamps the new row's link from the current head.
 */
export interface D1Env {
  LOOM_D1: import('@cloudflare/workers-types').D1Database;
}

/** The raw row shape — the ChainRecord the hash-chain module consumes. */
export async function readRecords(env: D1Env): Promise<ChainRecord[]> {
  const { results } = await env.LOOM_D1.prepare(
    'SELECT seq, ts, data, prev_hash FROM events ORDER BY seq ASC',
  ).all<{ seq: number; ts: string; data: string; prev_hash: string }>();
  return (results ?? []).map((r) => ({
    seq: r.seq,
    ts: r.ts,
    data: r.data,
    prev_hash: r.prev_hash ?? GENESIS_PREV_HASH,
  }));
}

export async function readEvents(env: D1Env): Promise<LoomEvent[]> {
  const records = await readRecords(env);
  return records.map((r) => {
    const event = JSON.parse(r.data) as LoomEvent;
    return { ...event, seq: r.seq, ts: r.ts };
  });
}

/** Append one input, gate-validated. Returns the committed event, or throws
 *  with the gate's error if invalid. */
export async function appendEvent(env: D1Env, input: LoomEventInput): Promise<LoomEvent> {
  const gate = new ReplayGate();
  const existing = await readRecords(env);
  for (const r of existing) {
    const e = JSON.parse(r.data) as LoomEventInput;
    const rr = gate.append(e);
    if (!rr.valid) throw new Error(`replay rejected existing event: ${rr.error}`);
  }
  const result = gate.append(input);
  if (!result.valid) throw new Error(`gate rejected ${input.kind}: ${result.error}`);
  // The gate's append returns {valid, error} — the committed event is the last
  // entry of its internal log.
  const log = gate.getLog();
  const event = log[log.length - 1];

  // The new row's prev_hash is the hash of the current head record. For an
  // empty log the link is the genesis sentinel. A pre-existing row whose
  // prev_hash was backfilled (or is the genesis sentinel) is left untouched;
  // the chain is recomputed only forward, at append time.
  const head = existing.length ? await hashRecord(existing[existing.length - 1]) : GENESIS_PREV_HASH;

  await env.LOOM_D1.prepare('INSERT INTO events (seq, ts, data, prev_hash) VALUES (?, ?, ?, ?)')
    .bind(event.seq, event.ts, JSON.stringify(event), head)
    .run();
  return event;
}

// ── SBT anchor store ───────────────────────────────────────────────────

export interface SbtAnchorRow {
  did: string;
  blockNumber: number;
  blockHash: string;
  prevBlockHash: string | null;
  payload: string;
  entryHash: string;
  createdAt: string;
}

/** The last anchored block for a DID, or null when none yet. The per-DID
 *  linkage check uses this: an incoming block's prevHash must equal the last
 *  anchored block's hash. */
export async function readLastAnchor(env: D1Env, did: string): Promise<SbtAnchorRow | null> {
  const row = await env.LOOM_D1.prepare(
    'SELECT did, block_number, block_hash, prev_block_hash, payload, entry_hash, created_at FROM sbt_anchors WHERE did = ? ORDER BY block_number DESC LIMIT 1',
  )
    .bind(did)
    .first<{
      did: string;
      block_number: number;
      block_hash: string;
      prev_block_hash: string | null;
      payload: string;
      entry_hash: string;
      created_at: string;
    }>();
  if (!row) return null;
  return {
    did: row.did,
    blockNumber: row.block_number,
    blockHash: row.block_hash,
    prevBlockHash: row.prev_block_hash,
    payload: row.payload,
    entryHash: row.entry_hash,
    createdAt: row.created_at,
  };
}

/** Insert an SBT anchor. Returns false when the block hash is already
 *  anchored for that DID (idempotent — a retried POST re-anchors nothing). */
export async function insertAnchor(
  env: D1Env,
  did: string,
  blockNumber: number,
  blockHash: string,
  prevBlockHash: string | null,
  payload: unknown,
  entryHash: string,
): Promise<boolean> {
  const dup = await env.LOOM_D1.prepare(
    'SELECT 1 FROM sbt_anchors WHERE did = ? AND block_hash = ? LIMIT 1',
  )
    .bind(did, blockHash)
    .first();
  if (dup) return false;
  await env.LOOM_D1.prepare(
    'INSERT INTO sbt_anchors (did, block_number, block_hash, prev_block_hash, payload, entry_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(did, blockNumber, blockHash, prevBlockHash, JSON.stringify(payload), entryHash, new Date().toISOString())
    .run();
  return true;
}