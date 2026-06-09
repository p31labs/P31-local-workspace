/**
 * Guardrails Unit Tests
 * Run with: cd /home/p31/andromeda/software/workers && npx vitest run
 */

import { describe, it, expect } from 'vitest';
import {
  getCurrentSafetyLevel,
  throttleFrequency,
  isActionPermitted,
  calculateCurrentLevel
} from '../src/guardrails.js';

describe('Guardrails Core', () => {
  describe('getCurrentSafetyLevel', () => {
    it('returns LEVEL_0 (0) for spoons >= 8', () => {
      expect(getCurrentSafetyLevel(8)).toBe(0);
    });

    it('returns LEVEL_4 (4) for spoons = 0', () => {
      expect(getCurrentSafetyLevel(0)).toBe(4);
    });
  });

  describe('throttleFrequency', () => {
    it('returns 3000ms for base 1000ms at LEVEL_2', () => {
      expect(throttleFrequency(1000, 2)).toBe(3000);
    });
  });

  describe('isActionPermitted', () => {
    it('rejects risk score 5 at LEVEL_1', () => {
      expect(isActionPermitted(5, 1)).toBe(false);
    });
  });

  describe('Hysteresis (3 consecutive readings)', () => {
    it('does NOT change level on first reading crossing threshold', () => {
      const result = calculateCurrentLevel(4, 0, { pendingLevel: null, count: 0 }, 3);
      expect(result.changed).toBe(false);
      expect(result.level).toBe(0); // Still at LEVEL_0
      expect(result.pendingLevel).toBe(2); // LEVEL_2 for spoons=4
      expect(result.hysteresisCount).toBe(1);
    });

    it('does NOT change level on second consecutive reading', () => {
      const result = calculateCurrentLevel(4, 0, { pendingLevel: 2, count: 1 }, 3);
      expect(result.changed).toBe(false);
      expect(result.level).toBe(0);
      expect(result.hysteresisCount).toBe(2);
    });

    it('changes level on THIRD consecutive reading (3/3)', () => {
      const result = calculateCurrentLevel(4, 0, { pendingLevel: 2, count: 2 }, 3);
      expect(result.changed).toBe(true);
      expect(result.level).toBe(2); // Now transitions to LEVEL_2
      expect(result.hysteresisCount).toBe(3);
    });

    it('oscillation at threshold stays stable (no flapping)', () => {
      // Start at LEVEL_0 (spoons=8)
      let state = { pendingLevel: null, count: 0 };
      let currentLevel = 0;

      // Oscillate around threshold (spoons 7, 8, 7, 8...)
      for (let i = 0; i < 10; i++) {
        const spoons = i % 2 === 0 ? 7 : 8; // Oscillate
        const result = calculateCurrentLevel(spoons, currentLevel, state, 3);
        currentLevel = result.level;
        state = { pendingLevel: result.pendingLevel, count: result.hysteresisCount };
      }

      // Should remain at LEVEL_0 (never gets 3 consecutive readings at LEVEL_1)
      expect(currentLevel).toBe(0);
    });
  });
});
