// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Growth Rings Engine tests
//
// Pure unit tests. No React.
// Uses Vitest.
// ═══════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  calculateTier,
  getGrowthProfile,
  getElementsForTier,
  adaptFunFact,
  isFeatureAvailable,
  tierFromAge,
} from './growthRings';

describe('Growth Rings Engine', () => {
  it('calculateTier 7-year-old → seed', () => {
    const dob = new Date('2019-02-27T12:00:00Z');
    const now = new Date('2026-02-27T12:00:00Z');
    expect(calculateTier(dob, now)).toBe('seed');
  });
  
  it('calculateTier 10-year-old → sprout', () => {
      const dob = new Date('2016-02-27T12:00:00Z');
      const now = new Date('2026-02-27T12:00:00Z');
      expect(calculateTier(dob, now)).toBe('sprout');
  });

  it('calculateTier 15-year-old → sapling', () => {
      expect(tierFromAge(15)).toBe('sapling');
  });

  it('calculateTier 20-year-old → canopy', () => {
      expect(tierFromAge(20)).toBe('canopy');
  });

  it('calculateTier 30-year-old → forest', () => {
      expect(tierFromAge(30)).toBe('forest');
  });

  it('getGrowthProfile returns all fields', () => {
      const profile = getGrowthProfile(new Date());
      expect(profile.tier).toBeDefined();
      expect(profile.age).toBeDefined();
      expect(profile.features).toBeDefined();
  });

  it('getElementsForTier seed → [H, O]', () => {
      expect(getElementsForTier('seed')).toEqual(['H', 'O']);
  });

  it('getElementsForTier sprout → [H, C, N, O]', () => {
      expect(getElementsForTier('sprout')).toEqual(['H', 'C', 'N', 'O']);
  });

  it('getElementsForTier sapling → all 10', () => {
      expect(getElementsForTier('sapling').length).toBe(10);
  });

  it('isFeatureAvailable textInput seed → false', () => {
      expect(isFeatureAvailable('textInput', 'seed')).toBe(false);
  });

  it('isFeatureAvailable textInput sprout → true', () => {
      expect(isFeatureAvailable('textInput', 'sprout')).toBe(true);
  });
  
  it('isFeatureAvailable reactions canopy → true', () => {
      expect(isFeatureAvailable('reactions', 'canopy')).toBe(true);
  });
  
  it('isFeatureAvailable moduleCreation forest → true', () => {
      expect(isFeatureAvailable('moduleCreation', 'forest')).toBe(true);
  });

  it('adaptFunFact shortens for seed tier', () => {
      const fact = "This is a fact. It has two sentences.";
      expect(adaptFunFact(fact, 'seed')).toBe("This is a fact");
  });
  
  it('tierFromAge boundary: 9 → seed, 10 → sprout', () => {
      expect(tierFromAge(9)).toBe('seed');
      expect(tierFromAge(10)).toBe('sprout');
  });
  
  it('tierFromAge boundary: 13 → sprout, 14 → sapling', () => {
      expect(tierFromAge(13)).toBe('sprout');
      expect(tierFromAge(14)).toBe('sapling');
  });
});
