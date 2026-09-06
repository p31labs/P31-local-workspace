/**
 * P31 Labs - Quantum Core (software/)
 * Thin wrapper re-exporting canonical implementations from packages/quantum-core,
 * plus additional modules unique to this workspace.
 */

export * from '../../packages/quantum-core/src/index.js';

// ===== Additional modules unique to software/packages/quantum-core =====
export {
  MLKEM,
  MLDSA,
  HybridPQCScheme,
  type MLKEMConfig,
  type MLDSAConfig,
  type MLKEMKeyPair,
  type MLDSAKeyPair,
  type MLDSASignature,
} from './pqc/fips203-204.js';

export {
  generateQuantumSafeHash,
  generateShake256Hash,
  generateQuantumSafeSeed,
  generateQuantumSafeHMAC,
  generateQuantumSafePBKDF2,
  generateQuantumSafeKDF,
  generateQuantumSafeCID,
  verifyQuantumSafeIntegrity,
} from './pqcPrimitives.js';

export {
  QuantumMachineLearning,
  QuantumApproximateOptimizationAlgorithm,
  VariationalQuantumEigensolver,
} from './algorithms/quantumAlgorithms.js';

export {
  QuantumServiceManager,
  CircuitBreaker,
  type ServiceConfig,
  type LoadBalancerConfig,
  type QuantumServiceRequest,
  type QuantumServiceResponse,
} from './microservices/quantumServiceManager.js';

export {
  QuantumSystemMonitor,
  type SystemMetrics,
  type QuantumMetrics,
  type SecurityMetrics,
  type AlertConfig,
  type DashboardConfig,
} from './monitoring/quantumSystemMonitor.js';

export {
  PerformanceBaseline,
  type PerformanceMetrics,
  type BaselineConfig,
} from './optimization/performanceBaseline.js';

export {
  SicPovmSwarmManager,
  SicPovmSwarmFactory,
  type AccessibleHealthPayload,
  type ISICAgent,
  type SicPovmConfig,
  type BiologicalStateType,
} from './swarm/SicPovmSwarmManager.js';

export {
  IBMQuantumClient,
  QuantumCircuits,
  type QuantumJobOptions,
} from './ibmQuantumBridge.js';
