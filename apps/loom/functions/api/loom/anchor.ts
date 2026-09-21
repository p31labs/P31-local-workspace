import { verifyChain } from '@p31/canon/loom/hash-chain';
import { loomHeadAnchor, LOVE_GENESIS_HASH } from '@p31/canon/loom/anchor';
import { readRecords } from './_lib/log';
import { LOVE_LEDGER_DEFAULT } from './_lib/love';

/**
 * GET /api/loom/anchor — the cross-anchor dry-run: compute the exact LOOM_HEAD
 * entry this log WOULD occupy in the LOVE chain.
 *
 * One provable root: the LOVE chain commits to the Loom's /verify head, and a
 * later /verify whose head matches the anchored value proves the design log is
 * the same log the care ledger committed to. This endpoint computes the entry
 * (entryType, payload, prevHash, entryHash, message) against the LIVE LOVE
 * chain head — read-only, nothing is written.
 *
 * Write path (documented): once a dedicated service-to-service token exists,
 * a POST to love-ledger appends this LOOM_HEAD entry. Reads stay open.
 */
export const onRequestGet: PagesFunction = async (context) => {
  const records = await readRecords(context.env);
  const verdict = await verifyChain(records);

  // The LOVE chain's current head is its last entry_hash. Read it live; a
  // ledger outage degrades to the LOVE genesis so the anchor is still computable.
  let loveHead = LOVE_GENESIS_HASH;
  try {
    const res = await fetch(`${context.env.LOVE_LEDGER_URL ?? LOVE_LEDGER_DEFAULT}/api/love/chain`);
    if (res.ok) {
      const { chain } = (await res.json()) as { chain: Array<{ entry_hash: string }> };
      // getChain returns DESC (newest first); the head is the first row.
      loveHead = chain?.[0]?.entry_hash ?? LOVE_GENESIS_HASH;
    }
  } catch {
    // ledger unreachable — anchor against genesis
  }

  const anchor = await loomHeadAnchor(
    {
      loomHead: verdict.head,
      loomSeq: verdict.checked,
      brokenAt: verdict.brokenAt,
      verified: verdict.valid,
      anchoredAt: new Date().toISOString(),
    },
    loveHead,
  );

  return Response.json(
    {
      ...anchor,
      status: 'dry-run',
      writePath: 'awaits dedicated service-to-service token (see docs/LOVE_INTEGRATION.md)',
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
};