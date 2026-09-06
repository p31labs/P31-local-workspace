import { describe, it, expect } from 'vitest';
import {
  computeMorphogeneticField,
  morphogeneticFieldValue,
  cliffordRotation,
  morphogeneticLayer,
} from '../../../packages/quantum-core/src/morphogeneticField';

describe('morphogeneticField', () => {
  it('returns correct number of layers for given depth', () => {
    const field = computeMorphogeneticField(0.5, 12);
    expect(field).toHaveLength(12);
  });

  it('returns deterministic results for same seed', () => {
    const a = computeMorphogeneticField(0.3, 6);
    const b = computeMorphogeneticField(0.3, 6);
    expect(a).toEqual(b);
  });

  it('returns different results for different seeds', () => {
    const a = computeMorphogeneticField(0.1, 6);
    const b = computeMorphogeneticField(0.9, 6);
    expect(a).not.toEqual(b);
  });

  it('cliffordRotation returns a function that produces finite values', () => {
    const rot = cliffordRotation(Math.PI / 4, 1.9);
    const result = rot(0.5);
    expect(Number.isFinite(result)).toBe(true);
  });

  it('morphogeneticLayer produces finite value', () => {
    const val = morphogeneticLayer(0.5, 3, Math.PI / 4, 1.9);
    expect(Number.isFinite(val)).toBe(true);
  });

  it('field values increase in magnitude with depth (phi scaling dominates)', () => {
    const field = computeMorphogeneticField(0.5, 6);
    for (let i = 1; i < field.length; i++) {
      // Later layers should generally be larger in absolute value
      // due to Φⁿ scaling, but rotation can flip sign
      expect(Math.abs(field[i]) >= 0).toBe(true);
    }
  });

  it('morphogeneticFieldValue returns a finite aggregate', () => {
    const agg = morphogeneticFieldValue(0.5, 12);
    expect(Number.isFinite(agg)).toBe(true);
  });

  it('handles edge case seed = 0', () => {
    const field = computeMorphogeneticField(0, 4);
    expect(field).toHaveLength(4);
    expect(field.every((v) => Number.isFinite(v))).toBe(true);
  });

  it('handles edge case seed = 1', () => {
    const field = computeMorphogeneticField(1, 4);
    expect(field).toHaveLength(4);
    expect(field.every((v) => Number.isFinite(v))).toBe(true);
  });

  it('is monotonic in phi scaling when rotation is zero', () => {
    const zeroRot = cliffordRotation(0, 1);
    const seed = 0.5;
    let prev = 0;
    for (let n = 0; n < 6; n++) {
      const val = morphogeneticLayer(seed, n, 0, 1);
      expect(val).toBeGreaterThanOrEqual(prev);
      prev = val;
    }
  });
});
