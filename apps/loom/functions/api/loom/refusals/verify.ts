import { verifyChain } from '@p31ca/canon/loom/hash-chain';
import { readRefusals, refusalToChainRecord, type LoomPagesEnv } from '../_lib/log';
import { handlePreflight, withCors, type CorsEnv } from '../_lib/cors';

/** GET /api/loom/refusals/verify — walk the refusals sidecar chain and report
 *  whether it is intact. Uses the SAME JCS canonicalizer (via
 *  refusalToChainRecord) and verifyChain as the events log, so the two chains
 *  are verifiable by the same code. Any rewrite, reorder, or deletion breaks
 *  at the first affected record. CORS-enabled for the chain-verification
 *  widget on p31ca.org / phosphorus31.org. */
export type RefusalsVerifyEnv = LoomPagesEnv & CorsEnv;

export const onRequestGet: PagesFunction<RefusalsVerifyEnv> = async (context) => {
  const { env, request } = context;
  const preflight = handlePreflight(env, request);
  if (preflight) return preflight;
  const rows = await readRefusals(env);
  const result = await verifyChain(rows.map(refusalToChainRecord));
  return withCors(
    env,
    request,
    Response.json({ valid: result.valid, checked: result.checked, brokenAt: result.brokenAt, head: result.head }),
  );
};