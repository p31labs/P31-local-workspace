/**
 * LedgerLog — Durable Object backing the audit + transparency hash chains (N3).
 *
 * One DO instance per log (fixed names 'audit' and 'transparency'), giving
 * independent verification boundaries. Each instance is single-threaded and
 * strongly consistent: append verifies `prev === head` before writing, so the
 * chain cannot fork. Storage is DO-backed (SQLite), durable and replayable.
 */

import { DurableObject } from 'cloudflare:workers'

export interface LedgerEntry {
  prev: string
  hash: string
  [k: string]: unknown
}

export class LedgerLog extends DurableObject<Record<string, unknown>> {
  private storage: DurableObjectStorage

  constructor(ctx: DurableObjectState, _env: Record<string, unknown>) {
    super(ctx, _env)
    this.storage = ctx.storage
  }

  /** Append an entry only if its prev hash matches the current head. */
  async append(entry: LedgerEntry): Promise<{ ok: boolean; reason?: string }> {
    const head = ((await this.storage.get<string>('head')) ?? 'GENESIS') as string
    if (entry.prev !== head) {
      return { ok: false, reason: `prev mismatch: expected ${head}, got ${entry.prev}` }
    }
    const log = (await this.storage.get<LedgerEntry[]>('log')) ?? []
    log.push(entry)
    await this.storage.put('log', log)
    await this.storage.put('head', entry.hash)
    return { ok: true }
  }

  /** Append a batch (used for KV→DO backfill during migration). */
  async backfill(entries: LedgerEntry[]): Promise<{ ok: boolean; reason?: string; written: number }> {
    const head = ((await this.storage.get<string>('head')) ?? 'GENESIS') as string
    let prev = head
    const log = (await this.storage.get<LedgerEntry[]>('log')) ?? []
    for (const e of entries) {
      if (e.prev !== prev) return { ok: false, reason: `chain broken at ${e.hash?.slice(0, 12)}`, written: log.length }
      log.push(e)
      prev = e.hash
    }
    if (log.length > 0) {
      await this.storage.put('log', log)
      await this.storage.put('head', prev)
    }
    return { ok: true, written: log.length }
  }

  async exportAll(): Promise<{ log: LedgerEntry[]; head: string }> {
    const log = (await this.storage.get<LedgerEntry[]>('log')) ?? []
    const head = ((await this.storage.get<string>('head')) ?? 'GENESIS') as string
    return { log, head }
  }

  async size(): Promise<number> {
    return ((await this.storage.get<LedgerEntry[]>('log')) ?? []).length
  }
}