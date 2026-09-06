/**
 * EigenTrust Algorithm Implementation for Decentralized Trust Computation
 *
 * Implements the EigenTrust algorithm as specified in the P31 architecture:
 *
 *   t^(k+1) = (1 - α) C^T t^(k) + α p
 *
 * Where:
 *   - C is the matrix of local trust values (c_ij)
 *   - p is the vector of pre-trusted genesis nodes
 *   - α is the bias parameter anchoring the graph to safe nodes
 *
 * This algorithm prevents Sybil attacks by iteratively computing trust vectors
 * and anchoring them to pre-trusted genesis nodes.
 */

/** Trust level tiers used for access control decisions. */
export enum TrustLevel {
  Untrusted = 'untrusted',
  Basic = 'basic',
  Trusted = 'trusted',
  High = 'high',
  Genesis = 'genesis',
}

export interface TrustVector {
  [nodeId: string]: number;
}

export interface LocalTrustMatrix {
  [trustorId: string]: {
    [trusteeId: string]: number; // c_ij: trustor's trust in trustee
  };
}

export interface EigenTrustOptions {
  /** Pre-trusted genesis nodes anchoring trust convergence. */
  genesisNodes: string[];
  /** Bias parameter [0, 1]. Higher values weight pre-trusted nodes more heavily. */
  alpha: number;
  /** Convergence threshold. Iteration stops when total delta falls below this value. */
  epsilon: number;
  /** Maximum iterations before forced convergence. */
  maxIterations: number;
}

export interface InteractionHistory {
  [interactorId: string]: {
    [targetId: string]: {
      positive: number;
      total: number;
    };
  };
}

/** Default EigenTrust algorithm parameters. All are configurable via options. */
export const DEFAULT_EIGENTRUST_PARAMS = {
  alpha: 0.2,
  epsilon: 0.0001,
  maxIterations: 100,
} as const satisfies Omit<EigenTrustOptions, 'genesisNodes'>;

/** Default threshold values for trust tier classification. All configurable. */
export const DEFAULT_TRUST_THRESHOLDS = {
  MINIMUM_TRUSTED: 0.1,
  SOULBOUND_ELIGIBLE: 0.7,
  HIGH_TRUST: 0.9,
  GENESIS_TRUST: 1.0,
} as const;

export const TRUST_THRESHOLDS = { ...DEFAULT_TRUST_THRESHOLDS };

/**
 * Validate inputs to EigenTrust computation.
 *
 * Throws descriptive errors for:
 *   - Empty local trust matrix
 *   - Empty genesis nodes array
 *   - Alpha outside [0, 1]
 *   - Non-positive epsilon
 *   - Non-positive maxIterations
 *
 * @param C - Local trust matrix
 * @param options - Configuration options (partial validation; genesisNodes checked separately)
 * @throws {Error} With a descriptive message on invalid input
 */
export function validateInput(
  C: LocalTrustMatrix,
  options: Partial<EigenTrustOptions>
): void {
  if (Object.keys(C).length === 0) {
    throw new Error('Local trust matrix must not be empty');
  }

  for (const [trustor, edges] of Object.entries(C)) {
    if (Object.keys(edges).length === 0) {
      throw new Error(`Trustor node "${trustor}" has no outgoing trust edges`);
    }
    for (const [trustee, weight] of Object.entries(edges)) {
      if (typeof weight !== 'number' || !Number.isFinite(weight) || weight < 0) {
        throw new Error(
          `Trust weight from "${trustor}" to "${trustee}" must be a non-negative finite number, got ${weight}`
        );
      }
    }
  }

  if (options.genesisNodes !== undefined && options.genesisNodes.length === 0) {
    throw new Error('Genesis nodes must not be empty — at least one pre-trusted node is required');
  }

  if (options.alpha !== undefined && (options.alpha < 0 || options.alpha > 1)) {
    throw new Error(`Alpha must be in [0, 1], got ${options.alpha}`);
  }

  if (options.epsilon !== undefined && (!Number.isFinite(options.epsilon) || options.epsilon <= 0)) {
    throw new Error(`Epsilon must be a positive finite number, got ${options.epsilon}`);
  }

  if (
    options.maxIterations !== undefined &&
    (!Number.isInteger(options.maxIterations) || options.maxIterations <= 0)
  ) {
    throw new Error(`Max iterations must be a positive integer, got ${options.maxIterations}`);
  }
}

/**
 * Normalize a trust vector so it sums to 1 (probability distribution).
 *
 * Handles the all-zero case by distributing evenly across all nodes.
 *
 * @param vector - Raw trust scores
 * @returns Normalized trust vector summing to 1
 */
export function normalizeTrustVector(vector: TrustVector): TrustVector {
  const sum = Object.values(vector).reduce((acc, val) => acc + val, 0);
  if (sum === 0) {
    const keys = Object.keys(vector);
    const evenValue = 1 / keys.length;
    return Object.fromEntries(keys.map(key => [key, evenValue]));
  }

  return Object.fromEntries(
    Object.entries(vector).map(([key, value]) => [key, value / sum])
  );
}

/**
 * Compute the EigenTrust vector iteratively.
 *
 * Iterates until convergence or maxIterations is reached:
 *
 *   t^(k+1) = (1 - α) C^T t^(k) + α p
 *
 * @param C - Local trust matrix where C[i][j] = trust i has in j
 * @param p - Pre-trusted genesis nodes vector
 * @param options - Configuration (alpha, epsilon, maxIterations, genesisNodes)
 * @returns The converged trust vector t, normalized to sum to 1
 */
export function computeEigenTrust(
  C: LocalTrustMatrix,
  p: TrustVector,
  options: EigenTrustOptions
): TrustVector {
  const { genesisNodes, alpha, epsilon, maxIterations } = options;

  if (genesisNodes.length === 0) {
    throw new Error('At least one genesis node must be specified');
  }

  let t = normalizeTrustVector(
    Object.fromEntries(
      Object.entries(p).filter(([node]) => genesisNodes.includes(node))
    )
  );

  const allNodes = new Set<string>();
  Object.keys(C).forEach(trustor => {
    allNodes.add(trustor);
    Object.keys(C[trustor]).forEach(trustee => {
      allNodes.add(trustee);
    });
  });

  allNodes.forEach(node => {
    if (!(node in t)) {
      t[node] = 0;
    }
  });

  const pNormalized = normalizeTrustVector(
    Object.fromEntries(
      Object.entries(t).filter(([node]) => genesisNodes.includes(node))
    )
  );

  allNodes.forEach(node => {
    if (!(node in pNormalized)) {
      pNormalized[node] = 0;
    }
  });

  let tPrev = { ...t };
  let tNext: TrustVector = {};

  for (let iter = 0; iter < maxIterations; iter++) {
    const cTransposeT: TrustVector = {};
    allNodes.forEach(node => {
      cTransposeT[node] = 0;
    });

    Object.keys(C).forEach(trustor => {
      const outgoing = C[trustor];
      const outgoingSum = Object.values(outgoing).reduce((s, v) => s + v, 0) || 1;
      Object.keys(outgoing).forEach(trustee => {
        const trustValue = outgoing[trustee] / outgoingSum;
        if (trustValue > 0) {
          cTransposeT[trustee] = (cTransposeT[trustee] || 0) + trustValue * tPrev[trustor];
        }
      });
    });

    tNext = {};
    allNodes.forEach(node => {
      tNext[node] = (1 - alpha) * (cTransposeT[node] || 0) + alpha * (pNormalized[node] || 0);
    });

    let diff = 0;
    allNodes.forEach(node => {
      diff += Math.abs((tNext[node] || 0) - (tPrev[node] || 0));
    });

    if (diff < epsilon) {
      break;
    }

    tPrev = { ...tNext };
  }

  return normalizeTrustVector(tNext);
}

/**
 * Intermediate result from EigenTrust computation, exposing per-edge query access.
 */
export interface EigenTrustResult {
  /** Global trust vector (normalized, sums to 1). */
  trustVector: TrustVector;
  /** Local trust matrix used for computation. */
  localMatrix: LocalTrustMatrix;
  /** Genesis nodes anchoring the computation. */
  genesisNodes: string[];
  /** Parameters used. */
  params: EigenTrustOptions;
  /** Number of iterations executed. */
  iterationCount: number;
  /** Per-edge trust scores: (from, to) → score computed from the converged vector. */
  edgeTrust: Map<string, number>;
}

/**
 * Compute EigenTrust and return a result object supporting per-edge queries.
 *
 * @param C - Local trust matrix
 * @param p - Pre-trusted genesis nodes vector
 * @param options - Configuration options
 * @returns EigenTrustResult with trustVector and edgeTrust map
 */
export function computeEigenTrustWithEdges(
  C: LocalTrustMatrix,
  p: TrustVector,
  options: EigenTrustOptions
): EigenTrustResult {
  const trustVector = computeEigenTrust(C, p, options);

  const edgeTrust = new Map<string, number>();
  for (const [from, edges] of Object.entries(C)) {
    for (const to of Object.keys(edges)) {
      const key = `${from}->${to}`;
      const trusteeScore = trustVector[to] ?? 0;
      const trustorScore = trustVector[from] ?? 0;
      const trustorNorm = trustorScore > 0 ? trustorScore : 1;
      edgeTrust.set(key, (edges[to] * trusteeScore) / trustorNorm);
    }
  }

  let iterationCount = 0;
  {
    const { alpha, epsilon, maxIterations } = options;
    let tPrev = { ...trustVector };
    let tNext: TrustVector = {};
    const allNodes = new Set(Object.keys(trustVector));
    for (let iter = 0; iter < maxIterations; iter++) {
      iterationCount = iter;
      const cTransposeT: TrustVector = {};
      allNodes.forEach(node => {
        cTransposeT[node] = 0;
      });
      Object.keys(C).forEach(trustor => {
        const outgoing = C[trustor];
        const outgoingSum = Object.values(outgoing).reduce((s, v) => s + v, 0) || 1;
        Object.keys(outgoing).forEach(trustee => {
          const trustValue = outgoing[trustee] / outgoingSum;
          if (trustValue > 0) {
            cTransposeT[trustee] = (cTransposeT[trustee] || 0) + trustValue * tPrev[trustor];
          }
        });
      });
      tNext = {};
      allNodes.forEach(node => {
        tNext[node] = (1 - alpha) * (cTransposeT[node] || 0) + alpha * (p[node] || 0);
      });
      let diff = 0;
      allNodes.forEach(node => {
        diff += Math.abs((tNext[node] || 0) - (tPrev[node] || 0));
      });
      if (diff < epsilon) {
        break;
      }
      tPrev = { ...tNext };
    }
    iterationCount += 1;
  }

  return {
    trustVector,
    localMatrix: C,
    genesisNodes: options.genesisNodes,
    params: options,
    iterationCount,
    edgeTrust,
  };
}

/**
 * Retrieve the per-edge trust score for a specific (from, to) pair.
 *
 * Returns the normalized trust flow from trustor to trustee, or undefined
 * if no such edge exists in the interaction graph.
 *
 * @param result - Result object from computeEigenTrustWithEdges
 * @param from - Trustor node ID
 * @param to - Trustee node ID
 * @returns Edge trust score in [0, 1], or undefined if no edge exists
 */
export function getEdgeTrust(result: EigenTrustResult, from: string, to: string): number | undefined {
  return result.edgeTrust.get(`${from}->${to}`);
}

/**
 * Build an EigenTrust computation from raw interaction history.
 *
 * Laplace-smooths interaction counts into a LocalTrustMatrix, then runs
 * full EigenTrust convergence. Useful as a single-call factory for
 * interaction-driven trust scoring.
 *
 * @param history - Interaction history mapping trustor → trustee → { positive, total }
 * @param genesisNodes - Pre-trusted genesis node IDs
 * @param alpha - Bias parameter (default: DEFAULT_EIGENTRUST_PARAMS.alpha)
 * @param epsilon - Convergence threshold (default: DEFAULT_EIGENTRUST_PARAMS.epsilon)
 * @param maxIterations - Maximum iterations (default: DEFAULT_EIGENTRUST_PARAMS.maxIterations)
 * @param laplaceEpsilon - Laplace smoothing constant (default: 0.001)
 * @returns EigenTrustResult with converged trust vector and edge trust map
 */
export function fromInteractionHistory(
  history: InteractionHistory,
  genesisNodes: string[],
  alpha = DEFAULT_EIGENTRUST_PARAMS.alpha,
  epsilon = DEFAULT_EIGENTRUST_PARAMS.epsilon,
  maxIterations = DEFAULT_EIGENTRUST_PARAMS.maxIterations,
  laplaceEpsilon = 0.001
): EigenTrustResult {
  const C = interactionsToTrustMatrix(history, laplaceEpsilon);
  const allNodes = new Set<string>(genesisNodes);
  Object.keys(C).forEach(trustor => {
    allNodes.add(trustor);
    Object.keys(C[trustor]).forEach(trustee => {
      allNodes.add(trustee);
    });
  });
  const p: TrustVector = {};
  allNodes.forEach(node => {
    p[node] = 0;
  });
  genesisNodes.forEach(node => {
    if (p[node] !== undefined) {
      p[node] = 1.0 / genesisNodes.length;
    }
  });
  if (Object.keys(C).length === 0) {
    const trustVector = normalizeTrustVector(
      Object.fromEntries(genesisNodes.map(n => [n, p[n] ?? 1 / genesisNodes.length]))
    );
    return {
      trustVector,
      localMatrix: C,
      genesisNodes,
      params: { genesisNodes, alpha, epsilon, maxIterations },
      iterationCount: 0,
      edgeTrust: new Map(),
    };
  }
  return computeEigenTrustWithEdges(C, p, {
    genesisNodes,
    alpha,
    epsilon,
    maxIterations,
  });
}

/**
 * Compute local trust values from interaction history.
 *
 * Uses Laplace smoothing to avoid zero trust scores:
 *
 *   c_ij = (positive + ε) / (total + 2ε)
 *
 * @param history - Raw interaction counts keyed by trustor and trustee
 * @param laplaceEpsilon - Smoothing constant (default: 0.001)
 * @returns Local trust matrix C
 */
export function interactionsToTrustMatrix(
  history: InteractionHistory,
  laplaceEpsilon = 0.001
): LocalTrustMatrix {
  const C: LocalTrustMatrix = {};

  Object.keys(history).forEach(trustor => {
    C[trustor] = {};
    Object.keys(history[trustor]).forEach(trustee => {
      const { positive, total } = history[trustor][trustee];
      C[trustor][trustee] = (positive + laplaceEpsilon) / (total + 2 * laplaceEpsilon);
    });
  });

  return C;
}

/**
 * Check if a node is eligible for Soulbound Token minting.
 *
 * @param trustVector - Computed trust vector
 * @param nodeId - Node to check
 * @returns True if the node's trust score meets the Soulbound threshold
 */
export function isSoulboundEligible(
  trustVector: TrustVector,
  nodeId: string
): boolean {
  const score = trustVector[nodeId] || 0;
  return score >= TRUST_THRESHOLDS.SOULBOUND_ELIGIBLE;
}

/**
 * Get the trust tier for a node.
 *
 * @param trustVector - Computed trust vector
 * @param nodeId - Node to classify
 * @returns TrustLevel enum value
 */
export function getTrustTier(
  trustVector: TrustVector,
  nodeId: string
): TrustLevel {
  const score = trustVector[nodeId] || 0;

  if (score >= TRUST_THRESHOLDS.GENESIS_TRUST) return TrustLevel.Genesis;
  if (score >= TRUST_THRESHOLDS.HIGH_TRUST) return TrustLevel.High;
  if (score >= TRUST_THRESHOLDS.SOULBOUND_ELIGIBLE) return TrustLevel.Trusted;
  if (score >= TRUST_THRESHOLDS.MINIMUM_TRUSTED) return TrustLevel.Basic;
  return TrustLevel.Untrusted;
}

/**
 * Trust level comparison for the middleware pattern.
 */
export function trustLevelOrder(level: TrustLevel): number {
  const order: Record<TrustLevel, number> = {
    [TrustLevel.Untrusted]: 0,
    [TrustLevel.Basic]: 1,
    [TrustLevel.Trusted]: 2,
    [TrustLevel.High]: 3,
    [TrustLevel.Genesis]: 4,
  };
  return order[level];
}

/**
 * Returns a TrustGuard middleware/handler wrapper.
 *
 * The wrapper inspects a node's trust level against a required minimum
 * and only invokes the wrapped handler if the node meets or exceeds it.
 *
 * The handler must accept at least `(nodeId: string, trustVector: TrustVector)`
 * as its first two arguments; any additional arguments pass through unchanged.
 *
 * Trusted nodes (and above) can send crisis pings, hibernate, and mint SBTs.
 *
 * @param minLevel - Minimum trust level required to pass the guard
 * @returns A handler wrapper that enforces the trust level check
 */
export function requiresTrustLevel<T extends (...args: unknown[]) => unknown>(
  minLevel: TrustLevel
): (handler: T) => (...args: Parameters<T>) => ReturnType<T> {
  return (handler: T) => {
    return (...args: Parameters<T>): ReturnType<T> => {
      const nodeId = args[0] as string;
      const trustVector = args[1] as TrustVector;
      const tier = getTrustTier(trustVector, nodeId);
      if (trustLevelOrder(tier) < trustLevelOrder(minLevel)) {
        throw new Error(
          `Node "${nodeId}" has trust level "${tier}" but requires "${minLevel}" to perform this action`
        );
      }
      return handler(...args) as ReturnType<T>;
    };
  };
}
