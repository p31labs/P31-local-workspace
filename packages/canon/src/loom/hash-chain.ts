/**
 * @p31/canon — loom/hash-chain.ts
 *
 * The tamper-evidence layer for The Loom's log. A single `prev_hash` field on
 * each stored record turns an *ordered* log into a *linked* one: rewriting,
 * reordering, or deleting any row breaks the chain at the next row, and
 * `/verify` recomputes the chain and returns exactly where.
 *
 * The hash input is RFC 8785 canonical JSON (JCS): keys sorted, no
 * insignificant whitespace, numbers serialized via ECMAScript Number::toString
 * (which is what JSON.stringify already does for the values the loom stores).
 * A chain computed here is byte-identical on the edge (Workers), in Node (the
 * dev middleware), and in a test — same bytes, same SHA-256, same verdict.
 *
 * Edge-safe by construction: uses only WebCrypto (crypto.subtle) and TextEncoder,
 * which exist in Workers, Node ≥ 20, and browsers. No node: imports, no fs.
 *
 * This module is a SHARED substrate like gate.ts/events.ts — Path α (the
 * D1-backed Pages Functions) and Path β (the dev middleware / future MCP
 * server) both import it. Do not fork the two paths against a different hash.
 */

/** A stored log record: the event payload plus its chain link. `data` is the
 *  canonical JSON string of the event itself (what D1 stores in `events.data`);
 *  `prev_hash` links this record to the one before it. */
export interface ChainRecord {
  seq: number
  ts: string
  data: string
  prev_hash: string
}

/** The chain's genesis link: nothing precedes seq 0. */
export const GENESIS_PREV_HASH = ''

export interface VerifyResult {
  valid: boolean
  /** The last seq the walk reached before a mismatch, or the full head. */
  checked: number
  /** The seq of the first broken record, or null when the chain is intact. */
  brokenAt: number | null
  /** The recomputed head hash — the chain's current commitment. Two logs with
   *  the same head hash have identical histories (by collision resistance). */
  head: string
  /** The hash the chain *should* have had at the break, when broken. */
  expected: string | null
  /** The prev_hash actually stored at the break, when broken. */
  found: string | null
}

/** RFC 8785 (JCS) canonical serialization — keys sorted lexicographically by
 *  code unit, no whitespace, numbers via Number::toString, strings JSON-escaped.
 *  Stable across runtimes, which is the whole point of a hash input. */
export function canonicalize(value: unknown): string {
  if (value === null) return 'null'
  const t = typeof value
  if (t === 'boolean') return value ? 'true' : 'false'
  if (t === 'number') return JSON.stringify(value)
  if (t === 'string') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`
  if (t === 'object') {
    const obj = value as Record<string, unknown>
    const keys = Object.keys(obj).sort()
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`).join(',')}}`
  }
  // undefined / bigint / function / symbol — not representable in JSON.
  throw new Error(`cannot canonicalize ${t}`)
}

/** The canonical preimage of a record: seq + ts + the event payload + the
 *  chain link itself. Including prev_hash makes each record's hash commit to
 *  the record before it, so the chain is linked, not just ordered. */
export function recordPreimage(r: ChainRecord): string {
  return canonicalize({ seq: r.seq, ts: r.ts, data: r.data, prev_hash: r.prev_hash })
}

/** SHA-256 (lowercase hex) of the given string/bytes. WebCrypto — async in
 *  Workers and Node alike. */
export async function sha256Hex(input: string | Uint8Array): Promise<string> {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** The hash of a record: SHA-256 of its canonical preimage. This is what the
 *  NEXT record's prev_hash must equal. */
export async function hashRecord(r: ChainRecord): Promise<string> {
  return sha256Hex(recordPreimage(r))
}

/** Walk the chain from genesis, recomputing each record's hash and comparing
 *  it to the next record's stored prev_hash. An honest log verifies in O(n);
 *  any rewrite, reorder, or deletion breaks at the first affected record.
 *
 *  The genesis record's own prev_hash must be GENESIS_PREV_HASH; its hash is
 *  the commitment the second record carries.
 *
 *  Deterministic: the same records yield the same head on every runtime. */
export async function verifyChain(records: readonly ChainRecord[]): Promise<VerifyResult> {
  if (records.length === 0) {
    return { valid: true, checked: 0, brokenAt: null, head: '', expected: null, found: null }
  }

  // Genesis check: the first record's link must be the empty-string sentinel.
  if (records[0].prev_hash !== GENESIS_PREV_HASH) {
    return {
      valid: false,
      checked: 0,
      brokenAt: records[0].seq,
      head: '',
      expected: GENESIS_PREV_HASH,
      found: records[0].prev_hash,
    }
  }

  let prev = records[0]
  for (let i = 1; i < records.length; i++) {
    const expected = await hashRecord(prev)
    const current = records[i]
    if (current.prev_hash !== expected) {
      return {
        valid: false,
        checked: i,
        brokenAt: current.seq,
        head: expected, // the head the chain *should* have rolled to
        expected,
        found: current.prev_hash,
      }
    }
    prev = current
  }

  const head = await hashRecord(prev)
  return { valid: true, checked: records.length, brokenAt: null, head, expected: null, found: null }
}

/** Fold a sequence of `{ seq, ts, data }` payloads into a fully-linked chain,
 *  assigning each record its prev_hash. Used to seed a fresh log and to
 *  rebuild the chain from a raw payload list (backfill / replay). */
export async function linkChain(payloads: readonly { seq: number; ts: string; data: string }[]): Promise<ChainRecord[]> {
  const records: ChainRecord[] = []
  let prevHash = GENESIS_PREV_HASH
  for (const p of payloads) {
    const record: ChainRecord = { seq: p.seq, ts: p.ts, data: p.data, prev_hash: prevHash }
    records.push(record)
    prevHash = await hashRecord(record)
  }
  return records
}