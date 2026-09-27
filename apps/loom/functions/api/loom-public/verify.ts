import { verifyChain } from '@p31ca/canon/loom/hash-chain';
import { readRecords, type LoomPagesEnv } from '../loom/_lib/log';
import { handlePreflight, withCors, type CorsEnv } from '../loom/_lib/cors';

/**
 * GET /api/loom-public/verify — PUBLIC read-only chain verification.
 *
 * This route sits OUTSIDE the Cloudflare Access gate (no middleware) so any
 * visitor — a grant reviewer, a prospective buyer, an auditor — can
 * independently verify that The Loom's hash chain is intact, without needing
 * an account or a token. CORS allowlist comes from the shared loom cors helper
 * (p31ca.org / phosphorus31.org and siblings), locked — never echoes an
 * arbitrary Origin.
 *
 * ⚠️ PRIVACY: the verdict is the aggregate chain state ONLY. It contains
 *   { valid, checked, brokenAt, head, expected, found } — no event payloads,
 *   no writer identities, no private records. The raw log stays behind Access
 *   at /api/loom/events.
 *
 * This is the transducer surface: the proof that anyone can check.
 *
 * NOTE: the loom.p31ca.org edge Access application currently covers the whole
 * hostname (302), so this route is reachable only after the edge policy is
 * un-gated. The live public surface is the loom-verify Pages project
 * (https://loom-verify.pages.dev), which serves these same verdicts from the
 * same D1 database. See verify-public/ in this repo.
 */
export type LoomPublicVerifyEnv = LoomPagesEnv & CorsEnv;

export const onRequestGet: PagesFunction<LoomPublicVerifyEnv> = async (context) => {
  const { env, request } = context;
  const preflight = handlePreflight(env, request);
  if (preflight) return preflight;
  const records = await readRecords(env);
  const verdict = await verifyChain(records);
  return withCors(
    env,
    request,
    Response.json(
      {
        service: 'p31-loom',
        ...verdict,
        checkedAt: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    ),
  );
};