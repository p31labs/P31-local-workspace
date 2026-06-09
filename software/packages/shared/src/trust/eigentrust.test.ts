/**
 * Test cases for EigenTrust algorithm implementation
 */
import { describe, test, expect } from 'vitest';
import {
  computeEigenTrust,
  interactionsToTrustMatrix,
  normalizeTrustVector,
  TRUST_THRESHOLDS,
  isSoulboundEligible,
  getTrustTier
} from './eigentrust';

describe('EigenTrust Algorithm', () => {
  test('should normalize trust vector correctly', () => {
    const vector = { A: 2, B: 4, C: 6 };
    const normalized = normalizeTrustVector(vector);
    
    expect(normalized.A).toBeCloseTo(2/12);
    expect(normalized.B).toBeCloseTo(4/12);
    expect(normalized.C).toBeCloseTo(6/12);
    expect(Object.values(normalized).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });

  test('should handle zero vector', () => {
    const vector = { A: 0, B: 0, C: 0 };
    const normalized = normalizeTrustVector(vector);
    
    expect(normalized.A).toBeCloseTo(1/3);
    expect(normalized.B).toBeCloseTo(1/3);
    expect(normalized.C).toBeCloseTo(1/3);
  });

  test('should compute EigenTrust for simple network', () => {
    // Simple trust network: A trusts B, B trusts C, C trusts A
    const C = {
      A: { B: 1.0 },
      B: { C: 1.0 },
      C: { A: 1.0 }
    };
    
    // Genesis nodes: A and B are pre-trusted
    const p = { A: 0.5, B: 0.5 };
    
    const result = computeEigenTrust(C, p, { 
      genesisNodes: ['A', 'B'],
      alpha: 0.2,
      epsilon: 0.0001,
      maxIterations: 50
    });
    
    // All nodes should have some trust value
    expect(result.A).toBeGreaterThan(0);
    expect(result.B).toBeGreaterThan(0);
    expect(result.C).toBeGreaterThan(0);
    
    // Should sum to 1
    const sum = Object.values(result).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1);
  });

  test('should convert interaction history to trust matrix', () => {
    const history = {
      Alice: {
        Bob: { positive: 8, total: 10 }, // 80% positive
        Carol: { positive: 2, total: 10 } // 20% positive
      },
      Bob: {
        Alice: { positive: 5, total: 5 }, // 100% positive
        Carol: { positive: 0, total: 5 }  // 0% positive
      }
    };
    
    const C = interactionsToTrustMatrix(history);
    
    // With Laplace smoothing epsilon=0.001:
    // Alice->Bob: (8 + 0.001) / (10 + 0.002) ≈ 0.8008
    // Alice->Carol: (2 + 0.001) / (10 + 0.002) ≈ 0.2008
    // Bob->Alice: (5 + 0.001) / (5 + 0.002) ≈ 0.9996
    // Bob->Carol: (0 + 0.001) / (5 + 0.002) ≈ 0.0019
    
    expect(C.Alice.Bob).toBeCloseTo(0.8008, 3);
    expect(C.Alice.Carol).toBeCloseTo(0.2008, 3);
    expect(C.Bob.Alice).toBeCloseTo(0.9996, 3);
    expect(C.Bob.Carol).toBeCloseTo(0.0019, 3);
  });

  test('should handle genesis nodes correctly', () => {
    // Network where newcomer D joins, but genesis nodes A,B should maintain high trust
    const C = {
      A: { B: 1.0, D: 0.5 },
      B: { A: 1.0, D: 0.5 },
      C: { A: 0.5, B: 0.5 },
      D: { A: 0.5, B: 0.5 }
    };
    
    // Only A and B are genesis nodes
    const p = { A: 0.5, B: 0.5 };
    
    const result = computeEigenTrust(C, p, { 
      genesisNodes: ['A', 'B'],
      alpha: 0.2
    });
    
    // Genesis nodes A,B should have higher trust than C,D
    expect(result.A).toBeGreaterThan(result.C);
    expect(result.B).toBeGreaterThan(result.C);
    expect(result.A).toBeGreaterThan(result.D);
    expect(result.B).toBeGreaterThan(result.D);
    
    // Trust should be distributed: A+B > C+D
    const genesisTrust = result.A + result.B;
    const nonGenesisTrust = result.C + result.D;
    expect(genesisTrust).toBeGreaterThan(nonGenesisTrust);
  });

  test('should detect Soulbound eligibility', () => {
    const trustVector = {
      Alice: 0.8,
      Bob: 0.6,
      Carol: 0.4
    };
    
    expect(isSoulboundEligible(trustVector, 'Alice')).toBe(true);
    expect(isSoulboundEligible(trustVector, 'Bob')).toBe(false); // 0.6 < 0.7 threshold
    expect(isSoulboundEligible(trustVector, 'Carol')).toBe(false);
  });

  test('should determine trust tier', () => {
    const trustVector = {
      high: 0.95,
      trusted: 0.75,
      basic: 0.3,
      untrusted: 0.05
    };
    
    expect(getTrustTier(trustVector, 'high')).toBe('high');
    expect(getTrustTier(trustVector, 'trusted')).toBe('trusted');
    expect(getTrustTier(trustVector, 'basic')).toBe('basic');
    expect(getTrustTier(trustVector, 'untrusted')).toBe('untrusted');
  });

  test('should throw error if no genesis nodes provided', () => {
    const C = { A: { B: 1.0 } };
    const p = {};
    
    expect(() => computeEigenTrust(C, p, { genesisNodes: [] })).toThrow(
      'At least one genesis node must be specified'
    );
  });

  test('should converge within iteration limit', () => {
    // Larger network to test convergence
    const C = {
      A: { B: 0.9, C: 0.1 },
      B: { A: 0.5, C: 0.5, D: 0.5 },
      C: { A: 0.3, B: 0.7 },
      D: { B: 1.0 }
    };
    
    const p = { A: 1.0 };
    
    const result = computeEigenTrust(C, p, {
      genesisNodes: ['A'],
      alpha: 0.15,
      maxIterations: 50
    });
    
    // Should converge and return valid trust vector
    expect(Object.keys(result).length).toBe(4);
    expect(Object.values(result).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
    
    // Genesis node A should have highest trust
    expect(result.A).toBeGreaterThan(result.B);
    expect(result.A).toBeGreaterThan(result.C);
    expect(result.A).toBeGreaterThan(result.D);
  });
});
