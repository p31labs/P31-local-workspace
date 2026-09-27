import { verifyChain } from '@p31ca/canon/loom/hash-chain'
import { readRefusals, refusalToChainRecord, type D1Env } from '../_lib/db'

/**
 * GET /api/loom/refusals/verify — PUBLIC, no auth.
 *
 * Walks the refusals sidecar chain (the same JCS canonicalizer and verifyChain
 * as the events log) and reports whether it is intact. Aggregate state only.
 */
export const onRequestGet: PagesFunction<D1Env> = async (context) => {
  const rows = await readRefusals(context.env)
  const result = await verifyChain(rows.map(refusalToChainRecord))
  return Response.json(
    { valid: result.valid, checked: result.checked, brokenAt: result.brokenAt, head: result.head },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}