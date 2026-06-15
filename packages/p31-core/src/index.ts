export {
  LARMOR_CONSTANTS,
  COHERENCE_THRESHOLDS,
  calculateLarmorFrequency,
  evaluateSecondOrderCoherence,
  trackSynapticScaling,
} from './SomaticBodyEngine';

export {
  verifyGraphAsymmetricKey,
  calculateRsaKeyPair,
  evaluateWyeDeltaImbalance,
  initializeIsostaticStorage,
} from './ProtocolNetworkEngine';
export type { Graph } from './ProtocolNetworkEngine';

export {
  FINE_STRUCTURE_ALPHA,
  WORKING_MEMORY_CAPACITY,
  projectSO6ToSO3,
  evaluateTyrannyInstability,
  getWorkingMemoryChannels,
} from './PhenomenologicalSelfEngine';

export {
  evaluateTelemetryThreshold,
  reduceSpoons,
  regenerateSpoons,
} from './CognitivePacingEngine';
export type { SpoonLedger, InterfaceParameters } from './CognitivePacingEngine';

export { useSovereignData } from './hooks/useSovereignData';
export type { VaultItem } from './hooks/useSovereignData';
