import { fetchCareProof, type LovePagesFunction } from '../_lib/love';

/**
 * GET /api/loom/love/:did — the privacy-preserving care proof for a DID.
 *
 * Returns { did, bound, careScore, verified, sovereigntyPool, performancePool,
 * totalEarned, updatedAt } — what the ledger attests, WITHOUT the care events.
 * This is the LOVE integration's read surface: the companion view and the docs
 * pane can show "this family member carries a care record" without exposing
 * the intimate details that produced it.
 *
 * Reads are open (the ledger's GET balance is unauthenticated by design); the
 * write path stays behind the ledger's HS256 JWT + nonce replay.
 */
export const onRequestGet: LovePagesFunction = async (context) => {
  const did = context.params.did as string;
  if (!did) {
    return Response.json({ error: 'did is required' }, { status: 400 });
  }
  const proof = await fetchCareProof(context.env, did);
  return Response.json(proof, {
    headers: { 'Cache-Control': 'no-store' },
  });
};