import { verifyChain, type ChainRecord } from '@p31/canon/loom/hash-chain';
import { readRecords, type LoomRecord } from '../_lib/log';

/**
 * GET /api/loom/provenance/:seq — the event chain from genesis to the given
 * seq, each record carrying its prev_hash, plus the recomputed chain verdict.
 *
 * This is the artifact a reviewer asks for: "show me every action that led to
 * this state, and prove none of them were changed." The head hash returned here
 * is the commitment a client can hold and later re-check against /verify.
 *
 * REDACTION (the scope complement): the chain is scope-blind (tamper-evidence
 * covers every record), but visibility is not. A personal record the caller is
 * not authorized to read returns its prev_hash / seq / ts (chain integrity is
 * preserved — the next record's prev_hash still commits to this record's
 * preimage) with data: null, redacted: true. The raw payload is never exposed.
 * Shared records and the caller's own personal records return full data.
 */
export const onRequestGet: PagesFunction<unknown, 'seq'> = async (context) => {
  const target = Number(context.params.seq);
  if (!Number.isInteger(target) || target < 0) {
    return Response.json({ error: 'seq must be a non-negative integer' }, { status: 400 });
  }

  // Caller identity — same resolution as the scoped read: Access sub when ON,
  // X-Human-Id header in the interim, else anonymous (shared only).
  const access = (context.data as { access?: { payload: Record<string, unknown> } }).access;
  const sub = access?.payload?.sub as string | undefined;
  const header = context.request.headers.get('X-Human-Id')?.trim() || undefined;
  const callerId = (sub as string | undefined) ?? (header || undefined);

  const records = await readRecords(context.env);
  const upto: LoomRecord[] = records.filter((r) => r.seq <= target);

  if (upto.length === 0 || upto[upto.length - 1].seq !== target) {
    return Response.json({ error: `no event at seq ${target}` }, { status: 404 });
  }

  // Verify the WHOLE log (tamper-evidence is scope-blind) but report the head
  // of the slice so the client has a stable commitment for its window.
  const verdict = await verifyChain(records);
  const sliceVerdict = await verifyChain(upto as ChainRecord[]);

  const chain = upto.map((r) => {
    const event = JSON.parse(r.data) as { humanId?: string };
    const owner = r.scope === 'personal' ? (event.humanId ?? '') : '';
    const mayRead = r.scope !== 'personal' || (callerId && owner === callerId);
    return {
      seq: r.seq,
      ts: r.ts,
      prev_hash: r.prev_hash,
      scope: r.scope,
      ...(mayRead
        ? { data: JSON.parse(r.data) }
        : { data: null, redacted: true }),
    };
  });

  return Response.json(
    {
      target,
      chain,
      verified: verdict.valid,
      brokenAt: verdict.brokenAt,
      head: sliceVerdict.head,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
};