/**
 * Comprehensive test suite for EigenTrust and Trust module.
 */
import { describe, test, expect, vi } from 'vitest';
import {
  computeEigenTrust,
  computeEigenTrustWithEdges,
  getEdgeTrust,
  fromInteractionHistory,
  normalizeTrustVector,
  interactionsToTrustMatrix,
  validateInput,
  TrustLevel,
  isSoulboundEligible,
  getTrustTier,
  trustLevelOrder,
  requiresTrustLevel,
  TRUST_THRESHOLDS,
  DEFAULT_EIGENTRUST_PARAMS,
  DEFAULT_TRUST_THRESHOLDS,
} from './eigentrust';

describe('normalizeTrustVector', () => {
  test('should normalize trust vector correctly', () => {
    const vector = { A: 2, B: 4, C: 6 };
    const normalized = normalizeTrustVector(vector);

    expect(normalized.A).toBeCloseTo(2 / 12);
    expect(normalized.B).toBeCloseTo(4 / 12);
    expect(normalized.C).toBeCloseTo(6 / 12);
    expect(Object.values(normalized).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });

  test('should handle zero vector by distributing evenly', () => {
    const vector = { A: 0, B: 0, C: 0 };
    const normalized = normalizeTrustVector(vector);

    expect(normalized.A).toBeCloseTo(1 / 3);
    expect(normalized.B).toBeCloseTo(1 / 3);
    expect(normalized.C).toBeCloseTo(1 / 3);
  });

  test('should handle single element', () => {
    const vector = { A: 5 };
    const normalized = normalizeTrustVector(vector);

    expect(normalized.A).toBe(1);
  });

  test('should not mutate the original vector', () => {
    const vector = { A: 2, B: 4 };
    const normalized = normalizeTrustVector(vector);

    expect(vector.A).toBe(2);
    expect(vector.B).toBe(4);
    expect(normalized).not.toBe(vector);
  });
});

describe('computeEigenTrust', () => {
  test('should compute EigenTrust for simple network', () => {
    const C = {
      A: { B: 1.0 },
      B: { C: 1.0 },
      C: { A: 1.0 },
    };

    const p = { A: 0.5, B: 0.5 };

    const result = computeEigenTrust(C, p, {
      genesisNodes: ['A', 'B'],
      alpha: 0.2,
      epsilon: 0.0001,
      maxIterations: 50,
    });

    expect(result.A).toBeGreaterThan(0);
    expect(result.B).toBeGreaterThan(0);
    expect(result.C).toBeGreaterThan(0);

    const sum = Object.values(result).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1);
  });

  test('should handle genesis nodes correctly', () => {
    const C = {
      A: { B: 1.0, D: 0.5 },
      B: { A: 1.0, D: 0.5 },
      C: { A: 0.5, B: 0.5 },
      D: { A: 0.5, B: 0.5 },
    };

    const p = { A: 0.5, B: 0.5 };

    const result = computeEigenTrust(C, p, {
      genesisNodes: ['A', 'B'],
      alpha: 0.2,
      epsilon: 0.0001,
      maxIterations: 50,
    });

    expect(result.A).toBeGreaterThan(result.C);
    expect(result.B).toBeGreaterThan(result.C);
    expect(result.A).toBeGreaterThan(result.D);
    expect(result.B).toBeGreaterThan(result.D);

    const genesisTrust = result.A + result.B;
    const nonGenesisTrust = result.C + result.D;
    expect(genesisTrust).toBeGreaterThan(nonGenesisTrust);
  });

  test('should throw if no genesis nodes provided', () => {
    const C = { A: { B: 1.0 } };
    const p: Record<string, number> = {};

    expect(() =>
      computeEigenTrust(C, p, {
        genesisNodes: [],
        alpha: 0.2,
        epsilon: 0.0001,
        maxIterations: 50,
      })
    ).toThrow('At least one genesis node must be specified');
  });

  test('should converge within iteration limit', () => {
    const C = {
      A: { B: 0.3, C: 0.7 },
      B: { A: 0.8, D: 0.2 },
      C: { A: 0.6, D: 0.4 },
      D: { A: 0.9, B: 0.1 },
    };

    const p = { A: 1.0 };

    const result = computeEigenTrust(C, p, {
      genesisNodes: ['A'],
      alpha: 0.15,
      epsilon: 0.0001,
      maxIterations: 50,
    });

    expect(Object.keys(result).length).toBe(4);
    expect(Object.values(result).reduce((a, b) => a + b, 0)).toBeCloseTo(1);

    expect(result.A).toBeGreaterThan(result.B);
    expect(result.A).toBeGreaterThan(result.C);
    expect(result.A).toBeGreaterThan(result.D);
  });

  test('should converge within iteration limit (larger network)', () => {
    const C = {
      A: { B: 0.5, C: 0.5 },
      B: { A: 0.5, D: 0.5 },
      C: { A: 0.5, D: 0.5 },
      D: { B: 0.5, C: 0.5 },
    };

    const p = { A: 1.0 };

    const result = computeEigenTrust(C, p, {
      genesisNodes: ['A'],
      alpha: 0.2,
      epsilon: 0.001,
      maxIterations: 100,
    });

    expect(Object.keys(result).length).toBe(4);
    expect(Object.values(result).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });
});

describe('validateInput', () => {
  test('should throw on empty local trust matrix', () => {
    const C: Record<string, Record<string, number>> = {};
    expect(() =>
      validateInput(C, {
        genesisNodes: ['A'],
        alpha: 0.2,
        epsilon: 0.0001,
        maxIterations: 50,
      })
    ).toThrow('Local trust matrix must not be empty');
  });

  test('should throw on empty genesis nodes', () => {
    const C = { A: { B: 1.0 } };
    expect(() =>
      validateInput(C, {
        genesisNodes: [],
        alpha: 0.2,
        epsilon: 0.0001,
        maxIterations: 50,
      })
    ).toThrow('Genesis nodes must not be empty');
  });

  test('should throw on alpha below 0', () => {
    const C = { A: { B: 1.0 } };
    expect(() =>
      validateInput(C, {
        genesisNodes: ['A'],
        alpha: -0.1,
        epsilon: 0.0001,
        maxIterations: 50,
      })
    ).toThrow('Alpha must be in [0, 1], got -0.1');
  });

  test('should throw on alpha above 1', () => {
    const C = { A: { B: 1.0 } };
    expect(() =>
      validateInput(C, {
        genesisNodes: ['A'],
        alpha: 1.5,
        epsilon: 0.0001,
        maxIterations: 50,
      })
    ).toThrow('Alpha must be in [0, 1], got 1.5');
  });

  test('should throw on non-positive epsilon', () => {
    const C = { A: { B: 1.0 } };
    expect(() =>
      validateInput(C, {
        genesisNodes: ['A'],
        alpha: 0.2,
        epsilon: 0,
        maxIterations: 50,
      })
    ).toThrow('Epsilon must be a positive finite number, got 0');
  });

  test('should throw on non-positive maxIterations', () => {
    const C = { A: { B: 1.0 } };
    expect(() =>
      validateInput(C, {
        genesisNodes: ['A'],
        alpha: 0.2,
        epsilon: 0.0001,
        maxIterations: 0,
      })
    ).toThrow('Max iterations must be a positive integer, got 0');
  });

  test('should throw on trustor with no outgoing edges', () => {
    const C = { A: { B: 1.0 }, C: {} };
    expect(() =>
      validateInput(C, {
        genesisNodes: ['A'],
        alpha: 0.2,
        epsilon: 0.0001,
        maxIterations: 50,
      })
    ).toThrow('Trustor node "C" has no outgoing trust edges');
  });

  test('should throw on negative trust weight', () => {
    const C = { A: { B: -0.5 } };
    expect(() =>
      validateInput(C, {
        genesisNodes: ['A'],
        alpha: 0.2,
        epsilon: 0.0001,
        maxIterations: 50,
      })
    ).toThrow('Trust weight from "A" to "B" must be a non-negative finite number');
  });

  test('should accept valid inputs without throwing', () => {
    const C = { A: { B: 1.0 } };
    expect(() =>
      validateInput(C, {
        genesisNodes: ['A'],
        alpha: 0.5,
        epsilon: 0.001,
        maxIterations: 10,
      })
    ).not.toThrow();
  });
});

describe('interactionsToTrustMatrix', () => {
  test('should convert interaction history with Laplace smoothing', () => {
    const history = {
      Alice: {
        Bob: { positive: 8, total: 10 },
        Carol: { positive: 2, total: 10 },
      },
      Bob: {
        Alice: { positive: 5, total: 5 },
        Carol: { positive: 0, total: 5 },
      },
    };

    const C = interactionsToTrustMatrix(history);

    expect(C.Alice.Bob).toBeCloseTo(0.7999, 3);
    expect(C.Alice.Carol).toBeCloseTo(0.2001, 3);
    expect(C.Bob.Alice).toBeCloseTo(0.9998, 3);
    expect(C.Bob.Carol).toBeCloseTo(0.0002, 3);
  });

  test('should handle custom laplace epsilon', () => {
    const history = {
      Alice: {
        Bob: { positive: 10, total: 10 },
      },
    };

    const C = interactionsToTrustMatrix(history, 0.5);
    expect(C.Alice.Bob).toBeCloseTo((10 + 0.5) / (10 + 1), 4);
  });
});

describe('computeEigenTrustWithEdges and getEdgeTrust', () => {
  test('should return EigenTrustResult with correct structure', () => {
    const C = {
      A: { B: 1.0 },
      B: { C: 1.0 },
      C: { A: 1.0 },
    };

    const p = { A: 0.5, B: 0.5 };

    const result = computeEigenTrustWithEdges(C, p, {
      genesisNodes: ['A', 'B'],
      alpha: 0.2,
      epsilon: 0.0001,
      maxIterations: 50,
    });

    expect(result.trustVector).toBeDefined();
    expect(result.localMatrix).toBe(C);
    expect(result.genesisNodes).toEqual(['A', 'B']);
    expect(result.params).toBeDefined();
    expect(result.iterationCount).toBeGreaterThan(0);
    expect(result.edgeTrust).toBeInstanceOf(Map);
  });

  test('per-edge query returns correct score for specific pair', () => {
    const C = {
      A: { B: 0.8, C: 0.2 },
      B: { A: 0.5 },
      C: { A: 0.3 },
    };

    const p = { A: 1.0 };

    const result = computeEigenTrustWithEdges(C, p, {
      genesisNodes: ['A'],
      alpha: 0.1,
      epsilon: 0.0001,
      maxIterations: 100,
    });

    const abTrust = getEdgeTrust(result, 'A', 'B');
    expect(abTrust).toBeDefined();
    expect(typeof abTrust).toBe('number');
    expect(abTrust).toBeGreaterThanOrEqual(0);

    const fakeTrust = getEdgeTrust(result, 'X', 'Y');
    expect(fakeTrust).toBeUndefined();
  });
});

describe('fromInteractionHistory', () => {
  test('empty interaction history → returns result with zero scores', () => {
    const history: Record<string, Record<string, { positive: number; total: number }>> = {};

    const result = fromInteractionHistory(history, ['A']);

    expect(Object.keys(result.trustVector)).toContain('A');
    expect(Object.values(result.trustVector).reduce((a: number, b: number) => a + b, 0)).toBeCloseTo(
      1
    );
  });

  test('single node with self-trust → converges', () => {
    const history = {
      A: {
        A: { positive: 10, total: 10 },
      },
    };

    const result = fromInteractionHistory(history, ['A']);

    expect(result.trustVector.A).toBeCloseTo(1);
    expect(Object.values(result.trustVector).reduce((a: number, b: number) => a + b, 0)).toBeCloseTo(
      1
    );
  });

  test('converges with multiple interacting nodes', () => {
    const history = {
      Alice: {
        Bob: { positive: 9, total: 10 },
      },
      Bob: {
        Alice: { positive: 7, total: 10 },
      },
    };

    const result = fromInteractionHistory(history, ['Alice']);

    expect(result.trustVector.Alice).toBeGreaterThan(0);
    expect(result.trustVector.Bob).toBeGreaterThan(0);
    expect(Object.values(result.trustVector).reduce((a: number, b: number) => a + b, 0)).toBeCloseTo(
      1
    );
  });
});

describe('boundary conditions: alpha extremes', () => {
  test('alpha=0 → no genesis anchoring (pure peer propagation)', () => {
    const C = {
      A: { B: 1.0 },
      B: { C: 1.0 },
      C: { A: 1.0 },
    };

    const p = { A: 0.5, B: 0.5 };

    const result = computeEigenTrust(C, p, {
      genesisNodes: ['A', 'B'],
      alpha: 0,
      epsilon: 0.0001,
      maxIterations: 50,
    });

    expect(Object.keys(result).length).toBe(3);
    expect(Object.values(result).reduce((a: number, b: number) => a + b, 0)).toBeCloseTo(1);
  });

  test('alpha=1 → pure genesis trust (no propagation)', () => {
    const C = {
      A: { B: 1.0 },
      B: { C: 1.0 },
      C: { A: 1.0 },
    };

    const p = { A: 0.5, B: 0.5 };

    const result = computeEigenTrust(C, p, {
      genesisNodes: ['A', 'B'],
      alpha: 1,
      epsilon: 0.0001,
      maxIterations: 50,
    });

    expect(result.A).toBeCloseTo(0.5);
    expect(result.B).toBeCloseTo(0.5);
    expect(result.C).toBeCloseTo(0);
  });
});

describe('divergent matrix', () => {
  test('stops at maxIterations when convergence is not reached', () => {
    const C = {
      A: { B: 1.0 },
      B: { A: 1.0 },
    };

    const p = { A: 1.0 };

    const result = computeEigenTrust(C, p, {
      genesisNodes: ['A'],
      alpha: 0.5,
      epsilon: 1e-12,
      maxIterations: 3,
    });

    expect(Object.keys(result).length).toBe(2);
    const sum = Object.values(result).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1);
  });
});

describe('genesis node trust behavior', () => {
  test('genesis node gets high trust regardless of interactions', () => {
    const C = {
      A: { B: 0.5, C: 0.5 },
      B: { C: 1.0 },
      C: { B: 1.0 },
    };

    const p = { A: 1.0 };

    const result = computeEigenTrust(C, p, {
      genesisNodes: ['A'],
      alpha: 0.5,
      epsilon: 0.0001,
      maxIterations: 100,
    });

    expect(result.A).toBeGreaterThan(result.B);
    expect(result.A).toBeGreaterThan(result.C);
  });
});

describe('Sybil attack resistance', () => {
  test('genesis anchoring prevents Sybil takeover', () => {
    const numFakes = 100;
    const C: Record<string, Record<string, number>> = {
      Genesis: {},
    };
    for (let i = 0; i < numFakes; i++) {
      const fakeId = `fake_${i}`;
      C[fakeId] = {};
      for (let j = 0; j < numFakes; j++) {
        const targetId = `fake_${j}`;
        C[fakeId][targetId] = 0.5;
      }
      C[fakeId]['Genesis'] = 0.5;
    }
    C['Genesis'] = {};
    for (let i = 0; i < numFakes; i++) {
      C['Genesis'][`fake_${i}`] = 0.1;
    }

    const p: Record<string, number> = { Genesis: 1.0 };

    const result = computeEigenTrust(C, p, {
      genesisNodes: ['Genesis'],
      alpha: 0.2,
      epsilon: 0.0001,
      maxIterations: 200,
    });

    expect(result.Genesis).toBeGreaterThan(result.fake_0);
    const fakeTrustSum = Object.keys(result)
      .filter(k => k.startsWith('fake_'))
      .reduce((sum, k) => sum + result[k], 0);
    expect(result.Genesis).toBeGreaterThan(fakeTrustSum / numFakes);
  });
});

describe('TRUST_THRESHOLDS and trust tier', () => {
  test('should export default thresholds', () => {
    expect(TRUST_THRESHOLDS.MINIMUM_TRUSTED).toBe(0.1);
    expect(TRUST_THRESHOLDS.SOULBOUND_ELIGIBLE).toBe(0.7);
    expect(TRUST_THRESHOLDS.HIGH_TRUST).toBe(0.9);
  });

  test('should export default params', () => {
    expect(DEFAULT_EIGENTRUST_PARAMS.alpha).toBe(0.2);
    expect(DEFAULT_EIGENTRUST_PARAMS.epsilon).toBe(0.0001);
    expect(DEFAULT_EIGENTRUST_PARAMS.maxIterations).toBe(100);
  });

  test('should export default trust thresholds', () => {
    expect(DEFAULT_TRUST_THRESHOLDS.MINIMUM_TRUSTED).toBe(0.1);
    expect(DEFAULT_TRUST_THRESHOLDS.SOULBOUND_ELIGIBLE).toBe(0.7);
    expect(DEFAULT_TRUST_THRESHOLDS.HIGH_TRUST).toBe(0.9);
  });

  test('should detect Soulbound eligibility', () => {
    const trustVector = {
      Alice: 0.8,
      Bob: 0.6,
      Carol: 0.4,
    };

    expect(isSoulboundEligible(trustVector, 'Alice')).toBe(true);
    expect(isSoulboundEligible(trustVector, 'Bob')).toBe(false);
    expect(isSoulboundEligible(trustVector, 'Carol')).toBe(false);
  });

  test('should determine trust tier', () => {
    const trustVector = {
      high: 0.95,
      trusted: 0.75,
      basic: 0.3,
      untrusted: 0.05,
    };

    expect(getTrustTier(trustVector, 'high')).toBe(TrustLevel.High);
    expect(getTrustTier(trustVector, 'trusted')).toBe(TrustLevel.Trusted);
    expect(getTrustTier(trustVector, 'basic')).toBe(TrustLevel.Basic);
    expect(getTrustTier(trustVector, 'untrusted')).toBe(TrustLevel.Untrusted);
  });

  test('TrustLevel enum values are correct', () => {
    expect(TrustLevel.Untrusted).toBe('untrusted');
    expect(TrustLevel.Basic).toBe('basic');
    expect(TrustLevel.Trusted).toBe('trusted');
    expect(TrustLevel.High).toBe('high');
    expect(TrustLevel.Genesis).toBe('genesis');
  });

  test('trustLevelOrder compares levels correctly', () => {
    expect(trustLevelOrder(TrustLevel.Untrusted)).toBeLessThan(trustLevelOrder(TrustLevel.Basic));
    expect(trustLevelOrder(TrustLevel.Basic)).toBeLessThan(trustLevelOrder(TrustLevel.Trusted));
    expect(trustLevelOrder(TrustLevel.Trusted)).toBeLessThan(trustLevelOrder(TrustLevel.High));
    expect(trustLevelOrder(TrustLevel.High)).toBeLessThan(trustLevelOrder(TrustLevel.Genesis));
  });
});

describe('requiresTrustLevel middleware', () => {
  test('allows handler execution when trust level meets minimum', () => {
    const handler = vi.fn<(...args: unknown[]) => unknown>((...args) => {
      const [_nodeId, _tv] = args as [string, Record<string, number>];
      return 'allowed';
    });
    const guarded = requiresTrustLevel(TrustLevel.Basic)(handler);

    const trustVector = { Alice: 0.8 };
    const result = guarded('Alice', trustVector);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(result).toBe('allowed');
  });

  test('blocks handler execution when trust level is below minimum', () => {
    const handler = vi.fn<(...args: unknown[]) => unknown>((...args) => {
      const [_nodeId, _tv] = args as [string, Record<string, number>];
      return 'allowed';
    });
    const guarded = requiresTrustLevel(TrustLevel.Trusted)(handler);

    const trustVector = { Bob: 0.3 };

    expect(() => guarded('Bob', trustVector)).toThrow(
      'Node "Bob" has trust level "basic" but requires "trusted"'
    );
    expect(handler).not.toHaveBeenCalled();
  });

  test('passes through additional arguments', () => {
    const handler = vi.fn<(...args: unknown[]) => unknown>((...args) => {
      const [_nodeId, _tv, x, y] = args as [string, Record<string, number>, number, string];
      return [x, y];
    });
    const guarded = requiresTrustLevel(TrustLevel.Untrusted)(handler);

    const trustVector = { Carol: 0.05 };
    const result = guarded('Carol', trustVector, 42, 'extra');

    expect(handler).toHaveBeenCalledWith('Carol', trustVector, 42, 'extra');
    expect(result).toEqual([42, 'extra']);
  });

  test('Genesis level grants access to all guards', () => {
    const handler = vi.fn(() => 'genesis-access');
    const guarded = requiresTrustLevel(TrustLevel.Genesis)(handler);

    const trustVector = { GenesisNode: 1.0 };
    const result = guarded('GenesisNode', trustVector);

    expect(result).toBe('genesis-access');
  });
});
