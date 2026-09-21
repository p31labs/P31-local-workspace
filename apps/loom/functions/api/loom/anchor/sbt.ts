import { sbtAnchor, LOVE_GENESIS_HASH, type SbtBlock } from '@p31/canon/loom/anchor';
import { readLastAnchor, insertAnchor, type D1Env } from '../_lib/log';
import { handlePreflight, withCors, type CorsEnv } from '../_lib/cors';

interface Env extends D1Env, CorsEnv {}

/**
 * POST /api/loom/anchor/sbt — witness a QPJ SBT block into the Loom's anchor
 * store, making the portal's client-side (localStorage) hash chain PROVABLE.
 *
 * The Loom does NOT recompute the block's hash (QPJ uses insertion-order
 * JSON.stringify; the Loom uses RFC 8785 — they would disagree). It witnesses
 * the block's own `hash` as an opaque value and verifies the per-DID linkage:
 * an incoming block whose blockNumber is N must carry prevHash == the hash of
 * the last anchored block (N-1) for that DID. That linkage is what makes the
 * client-side chain server-authoritative — a rewritten block breaks it.
 *
 * Body: { did, block } where block is the QPJ appendSBT result.
 *
 * Response: { entryType, payload, prevHash, entryHash, message, anchored,
 * inserted } — `anchored` is true when this block was newly witnessed;
 * `inserted` false when it was already anchored (idempotent retry).
 *
 * CORS: locked allowlist (LOOM_CORS_ORIGINS) — see _lib/cors.ts. Browser
 * calls from *.p31ca.org are echoed; anything else is rejected.
 */
export const onRequest: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  // CORS preflight first.
  const preflight = handlePreflight(env, request);
  if (preflight) return preflight;

  if (request.method !== 'POST') {
    return withCors(env, request, Response.json({ error: 'method not allowed' }, { status: 405 }));
  }

  let body: { did?: string; block?: SbtBlock };
  try {
    body = (await request.json()) as { did?: string; block?: SbtBlock };
  } catch {
    return withCors(env, request, Response.json({ error: 'invalid JSON' }, { status: 400 }));
  }

  const did = body?.did;
  const block = body?.block;
  if (!did || !block || typeof block.hash !== 'string' || !/^[0-9a-f]{64}$/.test(block.hash)) {
    return withCors(
      env,
      request,
      Response.json({ error: 'did and a valid 64-hex block.hash are required' }, { status: 400 }),
    );
  }
  if (!Number.isInteger(block.blockNumber) || block.blockNumber < 0) {
    return withCors(env, request, Response.json({ error: 'block.blockNumber must be a non-negative integer' }, { status: 400 }));
  }

  // Per-DID linkage: the incoming block's prevHash must equal the last anchored
  // block's hash for this DID. Genesis (block 0) must carry null/''.
  // Idempotent retry: the same block hash already anchored returns 200 with
  // inserted:false (the dedupe in insertAnchor catches it) — a retry is not a
  // replay error. Only a DIFFERENT genesis block for an existing DID is a 409.
  const last = await readLastAnchor(env, did);
  if (last && last.blockHash === block.hash) {
    // Same block — idempotent retry; report it without re-inserting.
    const entryPrev = last?.entryHash ?? LOVE_GENESIS_HASH;
    const anchor = await sbtAnchor(did, block, entryPrev);
    return withCors(
      env,
      request,
      Response.json({ ...anchor, anchored: false, inserted: false }, { headers: { 'Cache-Control': 'no-store' } }),
    );
  }
  if (block.blockNumber > 0) {
    if (!last || block.prevHash !== last.blockHash) {
      return withCors(
        env,
        request,
        Response.json({ error: `linkage broken: block ${block.blockNumber} prevHash does not match last anchored hash for ${did}` }, { status: 409 }),
      );
    }
  } else if (last) {
    // A second, DIFFERENT genesis block for the same DID is a replay.
    return withCors(env, request, Response.json({ error: `genesis already anchored for ${did}` }, { status: 409 }));
  }

  // Witness the block: LOOM_SBT entry in the love-chain format. The prevHash
  // for the entry is the prior anchored ENTRY hash (or genesis), so the anchor
  // chain itself is linked too.
  const entryPrev = last?.entryHash ?? LOVE_GENESIS_HASH;
  const anchor = await sbtAnchor(did, block, entryPrev);

  const inserted = await insertAnchor(
    env,
    did,
    block.blockNumber,
    block.hash,
    block.prevHash ?? null,
    anchor.payload,
    anchor.entryHash,
  );

  const res = Response.json(
    {
      ...anchor,
      anchored: inserted,
      inserted,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
  return withCors(env, request, res);
};