import { verifyChain } from '@p31ca/canon/loom/hash-chain'
import { readRecords, type D1Env } from './_lib/db'

/**
 * GET /api/loom/verify — PUBLIC, no auth.
 *
 * Replays the D1 log, recomputes the prev_hash chain, and returns the
 * tamper-evidence verdict. Any rewritten, reordered, or deleted row breaks at
 * a specific seq and the verdict names it. The response is the aggregate chain
 * state ONLY — no event payloads, no writer identities.
 *
 * Response shape matches the gated app's /api/loom/verify plus `service` and
 * `checkedAt` so a widget works identically against either endpoint.
 */
export const onRequestGet: PagesFunction<D1Env> = async (context) => {
  const records = await readRecords(context.env)
  const verdict = await verifyChain(records)
  return Response.json(
    {
      service: 'p31-loom',
      ...verdict,
      checkedAt: new Date().toISOString(),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}