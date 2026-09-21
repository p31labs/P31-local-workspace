/**
 * @p31/canon — loom/love.ts
 *
 * The LOVE care-proof derivation, as a shared substrate. Path α (the Loom's
 * Pages Functions + dev middleware) and Path β (future MCP surface) both
 * consume the same pure verdict: given a DID and the ledger's balance shape,
 * derive what the Loom is allowed to show — a care score, a verified verdict,
 * the sovereignty/performance pools — and NOTHING else.
 *
 * The privacy promise is structural: this module never sees or returns the
 * care events. It folds a balance into a proof, and the ledger read happens
 * one layer up (apps/loom/functions/api/loom/_lib/love.ts), which only ever
 * calls the ledger's GET /api/love/balance/:did.
 *
 * The verified threshold mirrors the ledger's CARE_THRESHOLD (0.5) and the
 * on-chain ProofOfCare CARE_THRESHOLD = 0.5e18.
 */
export interface LoveBalance {
  userId: string
  totalEarned: number
  sovereigntyPool: number
  performancePool: number
  careScore: number
  availableBalance: number
  frozenBalance: number
  totalSpoonDebt: number
  updatedAt: number | null
}

export interface CareProof {
  did: string
  bound: boolean
  careScore: number
  verified: boolean
  sovereigntyPool: number
  performancePool: number
  totalEarned: number
  updatedAt: number | null
}

/** The ledger's care threshold — a score at or above this is a verified
 *  caregiver. Mirrors workers/love-ledger CARE_THRESHOLD and ProofOfCare.sol. */
export const CARE_THRESHOLD = 0.5

/** Fold a ledger balance into the privacy-preserving care proof. A null
 *  balance (unbound / ledger outage) degrades to `bound: false`, never throws. */
export function careProofOf(did: string, balance: LoveBalance | null): CareProof {
  return {
    did,
    bound: balance !== null,
    careScore: balance?.careScore ?? 0,
    verified: (balance?.careScore ?? 0) >= CARE_THRESHOLD,
    sovereigntyPool: balance?.sovereigntyPool ?? 0,
    performancePool: balance?.performancePool ?? 0,
    totalEarned: balance?.totalEarned ?? 0,
    updatedAt: balance?.updatedAt ?? null,
  }
}