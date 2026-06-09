/**
 * Trust Module for P31 K₄ Mesh
 * 
 * Provides decentralized trust computation using the EigenTrust algorithm
 * as specified in the BROS architecture. Prevents Sybil attacks without
 * centralized KYC by anchoring trust to pre-trusted genesis nodes.
 */

export {
  computeEigenTrust,
  normalizeTrustVector,
  interactionsToTrustMatrix,
  isSoulboundEligible,
  getTrustTier,
  TRUST_THRESHOLDS
} from './eigentrust';

export type {
  TrustVector,
  LocalTrustMatrix,
  EigenTrustOptions,
  InteractionHistory
} from './eigentrust';
