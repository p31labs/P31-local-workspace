/**
 * The Loom — LOVE ledger client + care-proof read.
 *
 * LOVE is the P31 care economy: a soulbound, off-chain ledger
 * (love-ledger.p31ca.org) that tracks care_score, sovereignty/performance
 * pools, and (via ERC-5192 soulbound badges on Base) verified-caregiver
 * status. This module is the Loom's ONLY doorway to it.
 *
 * Privacy promise: a care read returns what the ledger will attest — that a
 * DID is a verified caregiver, its care score, and its pools — WITHOUT the
 * underlying care events. The Loom can answer "does this family member carry
 * a care record" and show a gentle care presence, never the intimate events
 * that produced it.
 *
 * The ledger's GET endpoints are unauthenticated by design (reads); the
 * ledger's write path (earn/spend) is separately gated by HS256 JWT + nonce
 * replay — the Loom never touches it here. A future service-to-service token
 * (LOVE_INTERNAL_TOKEN) would scope a dedicated identity; reads stay open.
 */
import type { PagesFunction } from '@cloudflare/workers-types';
import {
  careProofOf,
  type LoveBalance,
  type CareProof,
} from '@p31/canon/loom/love';

export interface LoveEnv {
  /** Base URL of the love-ledger worker. Defaults to production. */
  LOVE_LEDGER_URL?: string;
  /** Optional dedicated service token for authenticated reads. When set it is
   *  forwarded as `X-Love-Internal`; reads are open regardless. */
  LOVE_INTERNAL_TOKEN?: string;
}

export const LOVE_LEDGER_DEFAULT = 'https://love-ledger.p31ca.org';

/** Read the care proof for a DID from the live ledger. Never throws — a
 *  ledger outage degrades to `bound: false`, which the companion view shows
 *  as "not yet a care record", not an error. */
export async function fetchCareProof(env: LoveEnv, did: string): Promise<CareProof> {
  const base = env.LOVE_LEDGER_URL ?? LOVE_LEDGER_DEFAULT;
  try {
    const res = await fetch(`${base}/api/love/balance/${encodeURIComponent(did)}`, {
      headers: env.LOVE_INTERNAL_TOKEN
        ? { 'X-Love-Internal': env.LOVE_INTERNAL_TOKEN }
        : undefined,
    });
    if (!res.ok) return careProofOf(did, null);
    const balance = (await res.json()) as LoveBalance;
    return careProofOf(did, balance);
  } catch {
    return careProofOf(did, null);
  }
}

export type LovePagesFunction = PagesFunction<LoveEnv>;