/**
 * EigenTrust Algorithm Implementation for Decentralized Trust Computation
 * 
 * Implements the modified EigenTrust algorithm as specified in the BROS architecture:
 * t^(k+1) = (1 - a)C^T t^(k) + ap
 * 
 * Where:
 * - C is the matrix of local trust values (c_ij)
 * - p is the vector of pre-trusted genesis nodes
 * - a is the bias parameter anchoring the graph to safe nodes
 * 
 * This algorithm prevents Sybil attacks by iteratively computing trust vectors
 * and anchoring them to pre-trusted genesis nodes (P31 clinical architects).
 */

export interface TrustVector {
  [nodeId: string]: number;
}

export interface LocalTrustMatrix {
  [trustorId: string]: {
    [trusteeId: string]: number; // c_ij: trustor's trust in trustee
  };
}

export interface EigenTrustOptions {
  /** Pre-trusted genesis nodes (P31 clinical architects) */
  genesisNodes: string[];
  /** Bias parameter (typically 0.1-0.3) */
  alpha?: number;
  /** Convergence threshold */
  epsilon?: number;
  /** Maximum iterations */
  maxIterations?: number;
}

/**
 * Normalize a trust vector so it sums to 1 (probability distribution)
 */
export function normalizeTrustVector(vector: TrustVector): TrustVector {
  const sum = Object.values(vector).reduce((acc, val) => acc + val, 0);
  if (sum === 0) {
    // If all zeros, distribute evenly
    const keys = Object.keys(vector);
    const evenValue = 1 / keys.length;
    return Object.fromEntries(keys.map(key => [key, evenValue]));
  }
  
  return Object.fromEntries(
    Object.entries(vector).map(([key, value]) => [key, value / sum])
  );
}

/**
 * Compute the EigenTrust vector iteratively
 * 
 * @param C Local trust matrix where C[i][j] = trust i has in j
 * @param p Pre-trusted genesis nodes vector
 * @param options Configuration options
 * @returns The converged trust vector t
 */
export function computeEigenTrust(
  C: LocalTrustMatrix,
  p: TrustVector,
  options: EigenTrustOptions
): TrustVector {
  const {
    genesisNodes,
    alpha = 0.2,
    epsilon = 0.0001,
    maxIterations = 100
  } = options;

  if (genesisNodes.length === 0) {
    throw new Error('At least one genesis node must be specified');
  }

  // Initialize trust vector from genesis nodes
  let t = normalizeTrustVector(
    Object.fromEntries(
      Object.entries(p).filter(([node]) => genesisNodes.includes(node))
    )
  );
  
  // Get all nodes from the trust matrix
  const allNodes = new Set<string>();
  Object.keys(C).forEach(trustor => {
    allNodes.add(trustor);
    Object.keys(C[trustor]).forEach(trustee => {
      allNodes.add(trustee);
    });
  });
  
  // Ensure all nodes are in the trust vector
  allNodes.forEach(node => {
    if (!(node in t)) {
      t[node] = 0;
    }
  });

  // Create normalized genesis vector (p)
  const pNormalized = normalizeTrustVector(
    Object.fromEntries(
      Object.entries(t).filter(([node]) => genesisNodes.includes(node))
    )
  );
  
  // Ensure all nodes in pNormalized (non-genesis get zero)
  allNodes.forEach(node => {
    if (!(node in pNormalized)) {
      pNormalized[node] = 0;
    }
  });

  // Iterative computation: t^(k+1) = (1 - α)C^T t^(k) + αp
  let tPrev = { ...t };
  let tNext: TrustVector = {};
  let iterationCount = 0;
  
  for (let iter = 0; iter < maxIterations; iter++) {
    iterationCount = iter;
    
    // Compute C^T * t_prev
    const cTransposeT: TrustVector = {};
    
    // Initialize all nodes to zero
    allNodes.forEach(node => {
      cTransposeT[node] = 0;
    });
    
    // Matrix-vector multiplication: C^T * t
    // For each trustee j: sum over i (C[i][j] * t[i])
    Object.keys(C).forEach(trustor => {
      Object.keys(C[trustor]).forEach(trustee => {
        const trustValue = C[trustor][trustee];
        if (trustValue > 0) {
          cTransposeT[trustee] = (cTransposeT[trustee] || 0) + trustValue * tPrev[trustor];
        }
      });
    });
    
    // Apply the EigenTrust formula: t_next = (1-α) * (C^T * t) + α * p
    tNext = {};
    allNodes.forEach(node => {
      tNext[node] = (1 - alpha) * (cTransposeT[node] || 0) + alpha * (pNormalized[node] || 0);
    });
    
    // Check for convergence
    let diff = 0;
    allNodes.forEach(node => {
      diff += Math.abs((tNext[node] || 0) - (tPrev[node] || 0));
    });
    
    if (diff < epsilon) {
      // Converged
      break;
    }
    
    tPrev = { ...tNext };
  }

  // Return normalized result
  return normalizeTrustVector(tNext);
}

/**
 * Compute local trust values from interaction history
 * 
 * In practice, c_ij could be based on:
 * - Successful message exchanges
 * - Positive feedback ratings
 * - Resource sharing ratios
 * - etc.
 */
export interface InteractionHistory {
  [interactorId: string]: {
    [targetId: string]: {
      positive: number;
      total: number;
    };
  };
}

/**
 * Convert interaction history to local trust matrix
 * c_ij = positive_interactions / total_interactions (Laplace smoothed)
 */
export function interactionsToTrustMatrix(
  history: InteractionHistory,
  epsilon = 0.001
): LocalTrustMatrix {
  const C: LocalTrustMatrix = {};
  
  Object.keys(history).forEach(trustor => {
    C[trustor] = {};
    Object.keys(history[trustor]).forEach(trustee => {
      const { positive, total } = history[trustor][trustee];
      // Laplace smoothing to avoid zeros: (positive + ε) / (total + 2ε)
      C[trustor][trustee] = (positive + epsilon) / (total + 2 * epsilon);
    });
  });
  
  return C;
}

/**
 * Trust score thresholds for Soulbound Token minting
 */
export const TRUST_THRESHOLDS = {
  /** Minimum trust score to be considered trusted */
  MINIMUM_TRUSTED: 0.1,
  /** Minimum trust score for Soulbound Token consideration */
  SOULBOUND_ELIGIBLE: 0.7,
  /** High trust threshold */
  HIGH_TRUST: 0.9
};

/**
 * Check if a node is eligible for Soulbound Token minting
 */
export function isSoulboundEligible(
  trustVector: TrustVector,
  nodeId: string
): boolean {
  const score = trustVector[nodeId] || 0;
  return score >= TRUST_THRESHOLDS.SOULBOUND_ELIGIBLE;
}

/**
 * Get trust tier for a node
 */
export function getTrustTier(
  trustVector: TrustVector,
  nodeId: string
): 'untrusted' | 'basic' | 'trusted' | 'high' {
  const score = trustVector[nodeId] || 0;
  
  if (score >= TRUST_THRESHOLDS.HIGH_TRUST) return 'high';
  if (score >= TRUST_THRESHOLDS.SOULBOUND_ELIGIBLE) return 'trusted';
  if (score >= TRUST_THRESHOLDS.MINIMUM_TRUSTED) return 'basic';
  return 'untrusted';
}
