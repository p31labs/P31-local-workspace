import { verifyChain } from '@p31ca/canon/loom/hash-chain';
import { readRecords, type LoomPagesEnv } from './_lib/log';
import { handlePreflight, withCors, type CorsEnv } from './_lib/cors';

/**
 * GET /api/loom/verify — replay the D1 log, recompute the prev_hash chain,
 * return the integrity verdict. This is the log's tamper-evidence surface:
 * any rewritten, reordered, or deleted row breaks the chain at a specific seq,
 * and the verdict names it.
 *
 * CORS-enabled for the marketing sites (p31ca.org / phosphorus31.org) so the
 * chain-verification widget can read the verdict cross-origin. The response is
 * never cached — a stale 200 must not mask a tamper.
 */
export type VerifyEnv = LoomPagesEnv & CorsEnv;

export const onRequestGet: PagesFunction<VerifyEnv> = async (context) => {
  const { env, request } = context;
  const preflight = handlePreflight(env, request);
  if (preflight) return preflight;
  const records = await readRecords(env);
  const verdict = await verifyChain(records);
  return withCors(
    env,
    request,
    Response.json(verdict, {
      headers: { 'Cache-Control': 'no-store' },
    }),
  );
};