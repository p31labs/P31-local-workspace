import { verifyChain, type ChainRecord } from '@p31/canon/loom/hash-chain';
import { readRecords } from '../_lib/log';

/**
 * GET /api/loom/provenance/:seq — the event chain from genesis to the given
 * seq, each record carrying its prev_hash, plus the recomputed chain verdict.
 *
 * This is the artifact a reviewer asks for: "show me every action that led to
 * this state, and prove none of them were changed." The head hash returned here
 * is the commitment a client can hold and later re-check against /verify.
 */
export const onRequestGet: PagesFunction<unknown, 'seq'> = async (context) => {
  const target = Number(context.params.seq);
  if (!Number.isInteger(target) || target < 0) {
    return Response.json({ error: 'seq must be a non-negative integer' }, { status: 400 });
  }

  const records = await readRecords(context.env);
  const upto: ChainRecord[] = records.filter((r) => r.seq <= target);

  if (upto.length === 0 || upto[upto.length - 1].seq !== target) {
    return Response.json({ error: `no event at seq ${target}` }, { status: 404 });
  }

  // The provenance slice is the log up to target; verify the whole log, but
  // report the head of the slice so the client has a stable commitment for
  // the window it asked about.
  const verdict = await verifyChain(records);
  const sliceVerdict = await verifyChain(upto);

  return Response.json(
    {
      target,
      chain: upto,
      verified: verdict.valid,
      brokenAt: verdict.brokenAt,
      head: sliceVerdict.head,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
};