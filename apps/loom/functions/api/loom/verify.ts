import { verifyChain } from '@p31/canon/loom/hash-chain';
import { readRecords } from './_lib/log';

/**
 * GET /api/loom/verify — replay the D1 log, recompute the prev_hash chain,
 * return the integrity verdict. This is the log's tamper-evidence surface:
 * any rewritten, reordered, or deleted row breaks the chain at a specific seq,
 * and the verdict names it.
 *
 * The response is never cached — a stale 200 must not mask a tamper.
 */
export const onRequestGet: PagesFunction = async (context) => {
  const records = await readRecords(context.env);
  const verdict = await verifyChain(records);
  return Response.json(verdict, {
    headers: { 'Cache-Control': 'no-store' },
  });
};