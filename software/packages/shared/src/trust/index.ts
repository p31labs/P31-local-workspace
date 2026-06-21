/**
 * Trust Module for P31 K₄ Mesh
 * 
 * Provides decentralized trust computation using the EigenTrust algorithm
 * as specified in the BROS architecture. Prevents Sybil attacks without
 * centralized KYC by anchoring trust to pre-trusted genesis nodes.
 * 
 * Also provides Cognitive Passport integration for seeding the trust
 * graph from user-defined relationship data.
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

export {
  parseRelationships,
  relationshipsToTrustMatrix,
  genesisTrustVector,
  computePassportTrust,
  computeTrustWithPassthrough,
  trustScoresForDads,
  DEFAULT_RELATIONSHIP_WEIGHTS
} from './passport-trust';

export type {
  CogPassRelationship,
  CogPassTrustConfig
} from './passport-trust';
