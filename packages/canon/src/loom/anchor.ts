/**
 * @p31/canon — loom/anchor.ts
 *
 * The cross-anchor: one provable root for the Loom's log and LOVE's care
 * ledger. Both are SHA-256 linked records; this module computes the exact
 * entry a `LOOM_HEAD` anchor WOULD occupy in the love-ledger's chain, using
 * that ledger's own chainAppend format so the two can be verified together.
 *
 * LOVE chain format (workers/love-ledger/src/index.ts, chainAppend):
 *   prevHash   = last row's entry_hash, or the 64-zero genesis
 *   message    = `${entryType}|${JSON.stringify(payload)}|${prevHash}`
 *   entryHash  = SHA-256 hex of message
 *
 * The Loom anchors its /verify head into that chain as a LOOM_HEAD entry:
 * the LOVE chain then commits to the design log's head, and a later /verify
 * whose head matches the anchored value proves the design log is the SAME log
 * the care ledger committed to. Tampering with either breaks the link.
 *
 * Pure + edge-safe (WebCrypto only). The ledger fetch and the /verify read
 * happen one layer up (apps/loom Functions); this module only computes.
 */

/** LOVE's genesis sentinel — 64 zeros, per love-ledger. */
export const LOVE_GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/** The exact message string love-ledger hashes. */
export function loveMessage(entryType: string, payload: unknown, prevHash: string): string {
  return `${entryType}|${JSON.stringify(payload)}|${prevHash}`
}

/** SHA-256 (lowercase hex) — same primitive love-ledger uses. */
export async function sha256Hex(input: string | Uint8Array): Promise<string> {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** The entry hash love-ledger would store for a LOOM_HEAD anchor. */
export async function loveEntryHash(entryType: string, payload: unknown, prevHash: string): Promise<string> {
  return sha256Hex(loveMessage(entryType, payload, prevHash))
}

/** The payload of a LOOM_HEAD anchor. `head` is the Loom's /verify head hash;
 *  `checked`/`brokenAt` are that verdict's walk result. */
export interface LoomHeadPayload {
  loomHead: string
  loomSeq: number
  brokenAt: number | null
  verified: boolean
  anchoredAt: string
}

export interface LoomHeadAnchor {
  entryType: 'LOOM_HEAD'
  payload: LoomHeadPayload
  /** The love-ledger's current head (its last entry_hash), used as prevHash. */
  prevHash: string
  /** The hash love-ledger would record for this entry. */
  entryHash: string
  /** The exact message string that was hashed — court-admissible. */
  message: string
}

/** Compute a complete LOOM_HEAD anchor against the given love-chain head. */
export async function loomHeadAnchor(
  payload: LoomHeadPayload,
  lovePrevHash: string,
): Promise<LoomHeadAnchor> {
  const entryType = 'LOOM_HEAD' as const
  const message = loveMessage(entryType, payload, lovePrevHash)
  const entryHash = await sha256Hex(message)
  return { entryType, payload, prevHash: lovePrevHash, entryHash, message }
}