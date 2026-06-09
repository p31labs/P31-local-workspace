/**
 * @file proofOfCare.ts — Proof of Care (PoC) Engine
 * 
 * L.O.V.E. Protocol mathematical implementation:
 *   Care_Score = Σ(T_prox × Q_res) + Tasks_verified
 * 
 * Features:
 * - Time-weighted proximity calculation (T_prox)
 * - Quality resonance multiplier (Q_res) from HRV at 0.1 Hz
 * - 24-hour decay function
 * - Green Coherence multiplier (1.5x to 2.5x)
 * - Growth Ring phase calculation
 * - Cryptographic task signing via Web Crypto API
 * 
 * CWP-JITTERBUG-12: Proof of Care (PoC) UI Engine
 */

export interface ProximityEvent {
  peerId: string;
  timestamp: number;
  rssi: number;           // dBm, closer = higher (e.g., -40 to -90)
  ulpAccuracy: number;    // meters
}

export interface TaskRecord {
  id: string;
  type: 'meal' | 'transport' | 'medication' | 'companionship' | 'logistics';
  timestamp: number;
  signature: string;       // Hex signature from crypto.subtle
  verified: boolean;
}

export interface PoCState {
  proximityEvents: ProximityEvent[];
  tasks: TaskRecord[];
  lastCalculation: number;
  
  // Input metrics
  currentHRV: number;       // ms (Heart Rate Variability)
  currentHR: number;        // beats per minute
  respirationRate: number;  // breaths per minute
  
  // Derived values
  careScore: number;
  greenCoherenceMultiplier: number;
  growthRingPhase: 'trust' | 'apprenticeship' | 'sovereignty';
  proximityScore: number;
  taskScore: number;
}

interface DecayConfig {
  halfLifeMs: number;      // Time for score to halve
  minFloor: number;         // Minimum decay floor
}

/**
 * Default decay configuration: 24-hour half-life
 */
const DEFAULT_DECAY_CONFIG: DecayConfig = {
  halfLifeMs: 24 * 60 * 60 * 1000, // 24 hours
  minFloor: 0.1,
};

/**
 * Calculate time-weighted proximity score (T_prox)
 * Uses UWB + BLE RSSI polling within 5m radius
 * 
 * @param events - Array of proximity events
 * @param now - Current timestamp (default: Date.now())
 * @returns T_prox value 0-1
 */
export function calculateProximityScore(
  events: ProximityEvent[],
  now: number = Date.now()
): number {
  if (events.length === 0) return 0;

  const RECENT_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours
  const RECENT_EVENTS = events.filter(e => now - e.timestamp < RECENT_THRESHOLD_MS);
  
  if (RECENT_EVENTS.length === 0) return 0;

  // Weight: stronger RSSI = closer = higher score
  // RSSI typically ranges -40 (close) to -90 (far)
  const weightedSum = RECENT_EVENTS.reduce((sum, event) => {
    // Normalize RSSI to 0-1 (closer = higher)
    const rssiNorm = Math.max(0, Math.min(1, (event.rssi + 90) / 50));
    // Weight by recency (exponential decay)
    const timeWeight = Math.exp(-(now - event.timestamp) / (6 * 60 * 60 * 1000)); // 6hr decay
    // Weight by proximity accuracy (closer = more reliable)
    const accuracyWeight = Math.max(0.5, 1 - (event.ulpAccuracy / 5)); // 5m max
    return sum + (rssiNorm * timeWeight * accuracyWeight);
  }, 0);

  // Normalize by number of events, cap at 1
  return Math.min(1, weightedSum / Math.max(1, Math.sqrt(RECENT_EVENTS.length)));
}

/**
 * Calculate quality resonance multiplier (Q_res)
 * Based on HRV synchronization at 0.1 Hz (coherent breathing)
 * 
 * @param hrv - Heart Rate Variability in ms (RMSSD)
 * @param hr - Heart rate in BPM
 * @param respirationRate - Breaths per minute
 * @returns Q_res multiplier 0.5-2.0
 */
export function calculateQualityResonance(
  hrv: number,
  hr: number,
  respirationRate: number
): number {
  // Optimal HRV range: 20-80ms (typical for healthy adults)
  const hrvNorm = Math.max(0, Math.min(1, (hrv - 10) / 70));
  
  // Optimal HR range: 60-80 BPM
  const hrNorm = Math.max(0, Math.min(1, 1 - Math.abs(hr - 70) / 30));
  
  // 0.1 Hz coherent breathing = 6 breaths/min
  const targetRespiration = 6;
  const respirationNorm = Math.max(0, 1 - Math.abs(respirationRate - targetRespiration) / 4);
  
  // Combined coherence score 0-1
  const coherenceScore = (hrvNorm * 0.5) + (hrNorm * 0.3) + (respirationNorm * 0.2);
  
  // Map to 0.5-2.0 multiplier range
  return 0.5 + (coherenceScore * 1.5);
}

/**
 * Calculate Green Coherence multiplier (1.5x to 2.5x)
 * Applied when HRV achieves synchronized respiration/cardiac output at exactly 0.1 Hz
 * 
 * @param hrv - Heart Rate Variability in ms
 * @param respirationRate - Breaths per minute
 * @returns Multiplier 1.0-2.5
 */
export function calculateGreenCoherenceMultiplier(
  hrv: number,
  respirationRate: number
): number {
  // Check for 0.1 Hz coherence (6 breaths/min ± 0.5)
  const isCoherent = Math.abs(respirationRate - 6) <= 0.5;
  
  if (!isCoherent) {
    return 1.0; // No multiplier if not coherent
  }
  
  // HRV-based coherence strength (higher = stronger)
  const hrvStrength = Math.min(1, hrv / 60); // Cap at 60ms
  
  // Map to 1.5x-2.5x range
  return 1.5 + (hrvStrength * 1.0);
}

/**
 * Apply 24-hour exponential decay function
 * Score degrades aggressively every 24 hours
 * 
 * @param baseScore - Raw score before decay
 * @param lastUpdate - Timestamp of last score update
 * @param now - Current timestamp
 * @param config - Decay configuration
 * @returns Decayed score
 */
export function applyDecay(
  baseScore: number,
  lastUpdate: number,
  now: number = Date.now(),
  config: DecayConfig = DEFAULT_DECAY_CONFIG
): number {
  const elapsedMs = now - lastUpdate;
  const halfLives = elapsedMs / config.halfLifeMs;
  const decayFactor = Math.pow(0.5, halfLives);
  
  // Apply decay with minimum floor
  return config.minFloor + (baseScore - config.minFloor) * decayFactor;
}

/**
 * Calculate Growth Ring phase based on age
 * 
 * @param age - Age in years
 * @returns Growth Ring phase
 */
export function calculateGrowthRing(age: number): 'trust' | 'apprenticeship' | 'sovereignty' {
  if (age < 13) return 'trust';
  if (age < 18) return 'apprenticeship';
  return 'sovereignty';
}

/**
 * Get governance weight by Growth Ring
 * 
 * @param phase - Growth Ring phase
 * @returns Governance weight 0-100
 */
export function getGrowthRingWeight(phase: 'trust' | 'apprenticeship' | 'sovereignty'): number {
  switch (phase) {
    case 'trust': return 0;
    case 'apprenticeship': return 10;
    case 'sovereignty': return 100;
  }
}

/**
 * Cryptographically sign a task record using Web Crypto API
 * 
 * @param task - Task record to sign
 * @param privateKey - CryptoKey for signing
 * @returns Hex signature string
 */
export async function signTask(
  task: Omit<TaskRecord, 'signature' | 'verified'>,
  privateKey: CryptoKey
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${task.id}:${task.type}:${task.timestamp}`);
  
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    data
  );
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a task signature
 * 
 * @param task - Task record with signature
 * * @param publicKey - CryptoKey for verification
 * @returns True if signature valid
 */
export async function verifyTaskSignature(
  task: TaskRecord,
  publicKey: CryptoKey
): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${task.id}:${task.type}:${task.timestamp}`);
  
  const signatureBytes = Uint8Array.from(
    task.signature.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
  );
  
  try {
    return await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      publicKey,
      signatureBytes,
      data
    );
  } catch {
    return false;
  }
}

/**
 * Generate ECDSA key pair for task signing
 * 
 * @returns KeyPair { privateKey, publicKey }
 */
export async function generateTaskKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign', 'verify']
  );
}

/**
 * Complete PoC calculation combining all factors
 * 
 * @param state - Current PoC state
 * @param now - Current timestamp
 * @returns Updated PoCState with calculated scores
 */
export function calculateCareScore(state: PoCState, now: number = Date.now()): PoCState {
  // Calculate T_prox (proximity score with decay)
  const rawProximityScore = calculateProximityScore(state.proximityEvents, now);
  const proximityScore = applyDecay(
    rawProximityScore,
    state.lastCalculation,
    now
  );
  
  // Calculate Q_res (quality resonance)
  const qualityResonance = calculateQualityResonance(
    state.currentHRV,
    state.currentHR,
    state.respirationRate
  );
  
  // Calculate Green Coherence multiplier
  const greenCoherence = calculateGreenCoherenceMultiplier(
    state.currentHRV,
    state.respirationRate
  );
  
  // Calculate task score (verified tasks)
  const verifiedTasks = state.tasks.filter(t => t.verified);
  const taskScore = verifiedTasks.length;
  
  // Final Care Score: (T_prox × Q_res × GreenCoherence) + Tasks
  const careScore = (proximityScore * qualityResonance * greenCoherence) + taskScore;
  
  return {
    ...state,
    lastCalculation: now,
    careScore: Math.round(careScore * 100) / 100,
    greenCoherenceMultiplier: Math.round(greenCoherence * 100) / 100,
    proximityScore: Math.round(proximityScore * 100) / 100,
    taskScore,
    // Growth ring requires external age input
  };
}

/**
 * Default empty PoC state
 */
export function createEmptyPoCState(): PoCState {
  return {
    proximityEvents: [],
    tasks: [],
    lastCalculation: Date.now(),
    currentHRV: 0,
    currentHR: 0,
    respirationRate: 0,
    careScore: 0,
    greenCoherenceMultiplier: 1.0,
    growthRingPhase: 'trust',
    proximityScore: 0,
    taskScore: 0,
  };
}