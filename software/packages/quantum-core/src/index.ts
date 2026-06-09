/**
 * P31 Labs - Quantum Core
 * Canonical entry point — re-exports from subdirectory modules
 *
 * Single source of truth. No duplicated implementations.
 *
 * Architecture:
 * - pqc/fips203-204.ts     → ML-KEM, ML-DSA, HybridPQC (FIPS 203/204)
 * - pqcPrimitives.ts       → SHA-512, SHAKE256, HMAC, PBKDF2, CID
 * - algorithms/             → QML, QAOA, VQE
 * - microservices/          → QuantumServiceManager, CircuitBreaker
 * - monitoring/             → QuantumSystemMonitor
 * - optimization/           → PerformanceBaseline
 * - swarm/                  → SicPovmSwarmManager, SicPovmSwarmFactory
 * - ibmQuantumBridge.ts     → IBMQuantumClient, QuantumCircuits
 */

// ===== PQC: FIPS 203 ML-KEM + FIPS 204 ML-DSA =====
export {
  MLKEM,
  MLDSA,
  HybridPQCScheme,
  type MLKEMConfig,
  type MLDSAConfig,
  type MLKEMKeyPair,
  type MLDSAKeyPair,
  type MLDSASignature,
} from "./pqc/fips203-204";

// ===== PQC Primitives: SHA-512, SHAKE256, HMAC, PBKDF2 =====
export {
  generateQuantumSafeHash,
  generateShake256Hash,
  generateQuantumSafeSeed,
  generateQuantumSafeHMAC,
  generateQuantumSafePBKDF2,
  generateQuantumSafeKDF,
  generateQuantumSafeCID,
  verifyQuantumSafeIntegrity,
} from "./pqcPrimitives";

// ===== Quantum Algorithms: QML, QAOA, VQE =====
export {
  QuantumMachineLearning,
  QuantumApproximateOptimizationAlgorithm,
  VariationalQuantumEigensolver,
} from "./algorithms/quantumAlgorithms";

// ===== Microservices: Service Manager + Circuit Breaker =====
export {
  QuantumServiceManager,
  CircuitBreaker,
  type ServiceConfig,
  type LoadBalancerConfig,
  type QuantumServiceRequest,
  type QuantumServiceResponse,
} from "./microservices/quantumServiceManager";

// ===== Monitoring: System Monitor =====
export {
  QuantumSystemMonitor,
  type SystemMetrics,
  type QuantumMetrics,
  type SecurityMetrics,
  type AlertConfig,
  type DashboardConfig,
} from "./monitoring/quantumSystemMonitor";

// ===== Optimization: Performance Baseline =====
export {
  PerformanceBaseline,
  type PerformanceMetrics,
  type BaselineConfig,
} from "./optimization/performanceBaseline";

// ===== SIC-POVM Swarm: Biological Tomography =====
export {
  SicPovmSwarmManager,
  SicPovmSwarmFactory,
  type AccessibleHealthPayload,
  type ISICAgent,
  type SicPovmConfig,
  type BiologicalStateType,
} from "./swarm/SicPovmSwarmManager";

// ===== IBM Quantum Bridge =====
export {
  IBMQuantumClient,
  QuantumCircuits,
  type QuantumJobOptions,
} from "./ibmQuantumBridge";

// ===== QAOA Cost Functions (unique to index.ts) =====
export interface QAOACostFunction {
  name: string;
  evaluate: (state: number[], target: number) => number;
  gradient: (state: number[], target: number) => number[];
}

export class CalciumHomeostasisCost implements QAOACostFunction {
  name = "minimize_fluctuation";

  evaluate(state: number[], target: number): number {
    if (state.length < 1) return 0;
    const calcium = state[0];
    const deviation = Math.abs(calcium - target);
    return deviation * deviation;
  }

  gradient(state: number[], target: number): number[] {
    if (state.length < 1) return [];
    const calcium = state[0];
    const grad = 2 * (calcium - target);
    return [grad, 0, 0];
  }
}

export class RecoveryTimeCost implements QAOACostFunction {
  name = "minimize_recovery_time";

  evaluate(state: number[], target: number): number {
    if (state.length < 3) return 0;
    const [calcium, calcitriol, pth] = state;
    const treatmentStrength = calcitriol * 100 + pth * 0.1;
    if (calcium < target) {
      return 1 / Math.max(treatmentStrength, 0.1);
    }
    return 0;
  }

  gradient(_state: number[], _target: number): number[] {
    return [0, 0, 0];
  }
}
