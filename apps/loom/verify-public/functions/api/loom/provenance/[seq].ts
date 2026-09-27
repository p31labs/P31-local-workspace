import { verifyChain, type ChainRecord } from '@p31ca/canon/loom/hash-chain'
import { readRecords, type D1Env, type LoomRecord } from '../_lib/db'

/**
 * GET /api/loom/provenance/:seq — PUBLIC, no auth.
 *
 * The chain from genesis to the given seq, each record carrying its raw
 * `data` string (the byte-exact preimage piece the chain hashes), its parsed
 * `event` summary, and its prev_hash. Also returns the recomputed chain
 * verdict plus the head hash of the slice — the commitment a visitor can hold.
 *
 * The raw `data` string is returned specifically so a client can recompute
 * SHA-256 over the same canonical preimage and prove the linkage in-browser.
 *
 * REDACTION: the chain is scope-blind (tamper-evidence covers every record),
 * but visibility is not. A personal record the caller is not authorized to
 * read returns seq/ts/prev_hash/scope with data: null and event: null. Shared
 * records (the family's public log) return full data.
 */
export const onRequestGet: PagesFunction<D1Env> = async (context) => {
  const target = Number(context.params.seq)
  if (!Number.isInteger(target) || target < 0) {
    return Response.json({ error: 'seq must be a non-negative integer' }, { status: 400 })
  }

  const records = await readRecords(context.env)
  const upto: LoomRecord[] = records.filter((r) => r.seq <= target)

  if (upto.length === 0 || upto[upto.length - 1].seq !== target) {
    return Response.json({ error: `no event at seq ${target}` }, { status: 404 })
  }

  const verdict = await verifyChain(records)
  const sliceVerdict = await verifyChain(upto as ChainRecord[])

  const chain = upto.map((r) => {
    const visible = r.scope !== 'personal'
    return {
      seq: r.seq,
      ts: r.ts,
      prev_hash: r.prev_hash,
      scope: r.scope,
      ...(visible
        ? { data: r.data, event: JSON.parse(r.data) }
        : { data: null, event: null, redacted: true }),
    }
  })

  return Response.json(
    {
      target,
      chain,
      verified: verdict.valid,
      brokenAt: verdict.brokenAt,
      head: sliceVerdict.head,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}