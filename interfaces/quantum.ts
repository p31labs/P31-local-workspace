/**
 * P31 Labs - Quantum Core Governance Interfaces
 * Authored by: Kilo (Quantum Architect)
 * 
 * These interfaces enforce the architectural standards, PQC compliance,
 * and cognitive accessibility requirements for all P31 Quantum modules.
 * 
 * @see WCD-KILO-QUANTUM.md for complete context
 */

/**
 * System-level governance for quantum operations
 * Ensures cognitive accessibility and classical fallback validity
 */
export interface IQuantumSystemGovernance {
  /**
   * Ensures the system architecture meets cognitive accessibility thresholds
   * @param uiComponentId - The component identifier to verify
   * @returns true if component meets accessibility standards
   */
  verifyCognitiveAccessibility(uiComponentId: string): boolean;

  /**
   * Validates that the system fallback mechanisms (circuit breakers) are operational
   * @returns Promise resolving to true if fallback is functional
   */
  validateClassicalFallback(): Promise<boolean>;

  /**
   * Logs governance actions to the immutable audit trail
   * @param actionType - The governance action performed
   * @param component - The component affected
   * @param operator - The operator/user who initiated
   */
  auditAction(actionType: string, component: string, operator: string): void;
}

/**
 * Post-Quantum Cryptography governance for IoMT devices
 * Ensures NIST compliance and secure device handshakes
 */
export interface IPQCGovernance {
  /**
   * Validates that the current cryptographic implementation is strictly NIST compliant
   * @param algorithm - The PQC algorithm to validate (ML-KEM or ML-DSA)
   * @param securityLevel - The security level (1, 3, or 5)
   * @returns true if implementation is compliant
   */
  validateNISTCompliance(algorithm: 'ML-KEM' | 'ML-DSA', securityLevel: number): boolean;

  /**
   * Ensures native memory allocated by liboqs is properly freed
   * Critical for preventing memory leaks in long-running quantum services
   * @param moduleInstance - The liboqs module instance to clean up
   */
  enforceMemoryCleanup(moduleInstance: unknown): void;

  /**
   * Checks if a connected IoMT device has completed the PQC handshake
   * @param deviceId - The device identifier to verify
   * @returns Promise resolving to true if handshake succeeded
   */
  verifyDeviceHandshake(deviceId: string): Promise<boolean>;
}

/**
 * Monitoring governance for quantum systems with clinical bounds
 * Ensures cognitive load limits and clinical safety for medical applications
 */
export interface IQuantumMonitoringGovernance {
  /**
   * Ensures that telemetry alerts never exceed the cognitive load limit
   * parameter for the current user's profile.
   * @param userId - The user identifier to check
   * @param activeAlerts - Current number of active alerts
   */
  enforceCognitiveLoadLimits(userId: string, activeAlerts: number): void;

  /**
   * Verifies that the QAOA optimization outputs are clinically safe bounds
   * Critical for hypoparathyroidism calcium optimization
   * @param optimizationResult - The QAOA optimization result to validate
   * @param clinicalProtocolId - The clinical protocol identifier
   * @returns true if result is within safe clinical bounds
   */
  validateClinicalBounds(
    optimizationResult: Record<string, unknown>,
    clinicalProtocolId: string
  ): boolean;

  /**
   * Generates the simplified health payload for the Cognitive Health Monitor
   * Converts raw telemetry into accessible UI-ready format
   * @param rawTelemetry - The raw system telemetry data
   * @param qmlPrediction - The QML prediction output
   * @returns Accessible payload for Spaceship Earth UI
   */
  generateAccessiblePayload(
    rawTelemetry: Record<string, unknown>,
    qmlPrediction: Record<string, unknown>
  ): AccessibleHealthPayload;
}

/**
 * Standardized payload format for Spaceship Earth UI consumption
 * Implements the "Traffic Light" paradigm for cognitive accessibility
 */
export interface AccessibleHealthPayload {
  status: 'OPTIMAL' | 'ATTENTION' | 'CRASH_WARNING';
  primaryMetric: number;
  metricLabel: string;
  actionableAdvice: string | null;
  pqcSecured: boolean;
}

/**
 * Cognitive accessibility thresholds configuration
 * Based on operator's AuDHD profile and medical requirements
 */
export interface CognitiveAccessibilityConfig {
  maxAlertsPerMinute: number;
  maxConcurrentModals: number;
  requireVisualConfirmation: boolean;
  enableHapticFeedback: boolean;
  fallbackTimeoutMs: number;
}

/**
 * NIST security levels for PQC algorithms
 */
export enum PQCSecurityLevel {
  LEVEL_1 = 1,  // AES-128 equivalent
  LEVEL_3 = 3,  // AES-192 equivalent
  LEVEL_5 = 5   // AES-256 equivalent
}

/**
 * Default cognitive accessibility configuration
 * Tuned for AuDHD operator profile
 */
export const DEFAULT_COGNITIVE_CONFIG: CognitiveAccessibilityConfig = {
  maxAlertsPerMinute: 3,
  maxConcurrentModals: 1,
  requireVisualConfirmation: false,
  enableHapticFeedback: true,
  fallbackTimeoutMs: 5000,
};

/**
 * Clinical protocol identifiers for hypoparathyroidism management
 */
export enum ClinicalProtocol {
  HYPOPT_CALCIUM_OPTIMIZATION = 'hypopt-calcium-v1',
  EMERGENCY_CRISIS_RESPONSE = 'emergency-crisis-v1',
  ROUTINE_TELEMETRY = 'routine-telemetry-v1',
}