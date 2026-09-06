import { describe, test, expect } from 'vitest';
import {
  parseRelationships,
  relationshipsToTrustMatrix,
  genesisTrustVector,
  computePassportTrust,
  computeTrustWithPassthrough,
  trustScoresForDads,
  DEFAULT_RELATIONSHIP_WEIGHTS,
} from './passport-trust';
import type { CogPassRelationship } from './passport-trust';

describe('parseRelationships', () => {
  test('should parse valid relationship array', () => {
    const raw = [
      { id: 'alice', name: 'Alice', type: 'family', trust: 0.95 },
      { id: 'bob', name: 'Bob', type: 'professional', trust: 0.6 },
    ];
    const result = parseRelationships(raw);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('alice');
    expect(result[1].type).toBe('professional');
  });

  test('should filter out invalid entries', () => {
    const raw = [
      { id: 'alice', type: 'family', trust: 0.9 },
      { id: '', type: 'family' },
      { id: 'carol', type: 'family', trust: 1.5 },
      null,
      'string',
      42,
    ];
    const result = parseRelationships(raw);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('alice');
  });

  test('should accept unknown types (maps to other weight)', () => {
    const raw = [
      { id: 'bob', type: 'unknown' },
    ];
    const result = parseRelationships(raw);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('unknown');
  });

  test('should return empty array for non-array input', () => {
    expect(parseRelationships(null)).toEqual([]);
    expect(parseRelationships(undefined)).toEqual([]);
    expect(parseRelationships('foo')).toEqual([]);
    expect(parseRelationships({})).toEqual([]);
  });
});

describe('relationshipsToTrustMatrix', () => {
  test('should create edges with default weights', () => {
    const relations: CogPassRelationship[] = [
      { id: 'alice', type: 'family' },
      { id: 'bob', type: 'professional' },
      { id: 'carol', type: 'peer' },
    ];
    const C = relationshipsToTrustMatrix(relations, 'self');
    expect(C.self.alice).toBe(DEFAULT_RELATIONSHIP_WEIGHTS.family);
    expect(C.self.bob).toBe(DEFAULT_RELATIONSHIP_WEIGHTS.professional);
    expect(C.self.carol).toBe(DEFAULT_RELATIONSHIP_WEIGHTS.peer);
  });

  test('should use explicit trust value when provided', () => {
    const relations: CogPassRelationship[] = [
      { id: 'alice', type: 'family', trust: 0.99 },
    ];
    const C = relationshipsToTrustMatrix(relations, 'self');
    expect(C.self.alice).toBe(0.99);
  });

  test('should respect weight overrides', () => {
    const relations: CogPassRelationship[] = [
      { id: 'alice', type: 'family' },
    ];
    const C = relationshipsToTrustMatrix(relations, 'self', { family: 0.8 });
    expect(C.self.alice).toBe(0.8);
  });

  test('should handle empty relations', () => {
    const C = relationshipsToTrustMatrix([], 'self');
    expect(C.self).toEqual({});
  });
});

describe('genesisTrustVector', () => {
  test('should include self when in genesis list', () => {
    const relations: CogPassRelationship[] = [
      { id: 'alice', type: 'family' },
    ];
    const p = genesisTrustVector(['self', 'alice'], relations, 'self');
    expect(p.self).toBe(1);
    expect(p.alice).toBe(1);
  });

  test('should fall back to self when no genesis match', () => {
    const relations: CogPassRelationship[] = [
      { id: 'alice', type: 'family' },
    ];
    const p = genesisTrustVector(['bob'], relations, 'self');
    expect(p.self).toBe(1);
    expect(Object.keys(p).length).toBe(1);
  });
});

describe('computePassportTrust', () => {
  test('should compute trust for a simple family graph', () => {
    const relations: CogPassRelationship[] = [
      { id: 'sj', type: 'family', trust: 0.95 },
      { id: 'wj', type: 'family', trust: 0.95 },
      { id: 'dr_chen', type: 'clinical', trust: 0.8 },
    ];
    const result = computePassportTrust(relations, {
      selfId: 'self',
      genesisNodes: ['self'],
    });
    const sum = Object.values(result).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1);
    expect(result.self).toBeGreaterThan(0);
    expect(result.sj).toBeGreaterThan(0);
    expect(result.wj).toBeGreaterThan(0);
    expect(result.dr_chen).toBeGreaterThan(0);
  });

  test('should give genesis nodes higher trust', () => {
    const relations: CogPassRelationship[] = [
      { id: 'alice', type: 'family', trust: 0.9 },
      { id: 'bob', type: 'peer', trust: 0.5 },
    ];
    const result = computePassportTrust(relations, {
      selfId: 'self',
      genesisNodes: ['self', 'alice'],
      alpha: 0.3,
    });
    expect(result.self).toBeGreaterThan(result.bob);
    expect(result.alice).toBeGreaterThan(result.bob);
  });
});

describe('computeTrustWithPassthrough', () => {
  test('should incorporate passthrough edges', () => {
    const relations: CogPassRelationship[] = [
      { id: 'alice', type: 'family', trust: 0.9 },
    ];
    const passthrough = [
      { trustorId: 'alice', trusteeId: 'bob', weight: 0.7 },
    ];
    const result = computeTrustWithPassthrough(relations, passthrough, {
      selfId: 'self',
      genesisNodes: ['self'],
    });
    expect(Object.keys(result)).toContain('bob');
  });
});

describe('trustScoresForDads', () => {
  test('should map trust vector to score map', () => {
    const relations: CogPassRelationship[] = [
      { id: 'alice', type: 'family' },
      { id: 'bob', type: 'professional' },
    ];
    const trustVector = { self: 0.6, alice: 0.3 };
    const scores = trustScoresForDads(trustVector, relations);
    expect(scores.get('self')).toBe(0.6);
    expect(scores.get('alice')).toBe(0.3);
    expect(scores.get('bob')).toBe(DEFAULT_RELATIONSHIP_WEIGHTS.professional);
  });
});
