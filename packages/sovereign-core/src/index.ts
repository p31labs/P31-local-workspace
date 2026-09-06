export { configure, getProfilePrefix } from './profile';
export {
  createProfile,
  getProfile,
  updateProfile,
  updateTetrahedronVertex,
  addSBT,
  mintAchievementSBT,
  getDid,
  ensureDid,
  incrementMoodCount,
  addSBTMilestone,
  hasSBTMilestone,
} from './profile';

export { HeartbeatMesh } from './mesh';
export type { MeshMessage, MeshNode, MeshVerifyPayload } from './mesh';

export {
  getLoveBalance,
  getLoveTransactions,
  mintLove,
  getLoveChain,
  registerUser,
} from './love';
export type { LoveBalance, LoveTransaction, ChainEntry, ChainVerification } from './love';

export {
  computeTetrahedronHash,
  buildSBT,
  mintSBTOnChain,
  simpleHash,
  LOVESBT_ADDRESS,
  PROOF_OF_CARE_ADDRESS,
} from './sbt';

export { pinJSONToIPFS } from './ipfs';
export type { PinataResponse } from './ipfs';

export { anchorCID, getContentRoot } from './contracts';

export { getOrCreateDid } from './did';

export type {
  Profile,
  TetraVertex,
  SBT,
  Tetrahedron,
  MeshState,
  CryptoState,
  TetraKeyPair,
  Reputation,
  Preferences,
  Relations,
} from './types';

export { createSovereignStore } from './store';
export type { SovereignState, Toast, UiState } from './store';

export {
  initSovereignBridge,
  dispatchShellSpoons,
  dispatchShellPersona,
  dispatchSovereignSpoons,
  dispatchSovereignCoherence,
  dispatchSovereignPersona,
} from './bridge';
export type { BridgeCallbacks } from './bridge';
