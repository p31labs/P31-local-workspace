// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Freestyle Mode Engine tests
//
// Pure unit tests. No React.
// Uses Vitest.
// ═══════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  getFreestyleConfig,
  isFreestyleAvailable,
  scoreFreestyle,
  generateChallenge,
} from './freestyle';

describe('Freestyle Mode Engine', () => {
  it('getFreestyleConfig returns correct defaults', () => {
    const config = getFreestyleConfig();
    expect(config.hasTarget).toBe(false);
    expect(config.turnBased).toBe(false);
    expect(config.timeLimit).toBeNull();
  });

  it('getFreestyleConfig accepts timeLimit', () => {
    const config = getFreestyleConfig(60000);
    expect(config.timeLimit).toBe(60000);
  });

  it('isFreestyleAvailable seed → false', () => {
    expect(isFreestyleAvailable('seed')).toBe(false);
  });

  it('isFreestyleAvailable sprout → false', () => {
    expect(isFreestyleAvailable('sprout')).toBe(false);
  });

  it('isFreestyleAvailable sapling → true', () => {
    expect(isFreestyleAvailable('sapling')).toBe(true);
  });
  
  it('scoreFreestyle 2 H atoms = 6 base LOVE (3 per atom)', () => {
      const result = scoreFreestyle([{element: 'H'}, {element: 'H'}], 0, false);
      expect(result.baseLove).toBe(6);
  });
  
  it('scoreFreestyle applies unique element bonus', () => {
      const result = scoreFreestyle([{element: 'H'}, {element: 'O'}], 0, false);
      const bonus = result.bonuses.find(b => b.name === 'Element Variety');
      expect(bonus?.love).toBe(10); // 2 * 5
  });

  it('scoreFreestyle applies size bonus at 10 atoms', () => {
      const atoms = Array(10).fill({element: 'C'});
      const result = scoreFreestyle(atoms, 0, false);
      const bonus = result.bonuses.find(b => b.name === 'Big Molecule');
      expect(bonus?.love).toBe(10);
  });
  
  it('scoreFreestyle applies size bonus at 20 atoms', () => {
      const atoms = Array(20).fill({element: 'C'});
      const result = scoreFreestyle(atoms, 0, false);
      const bonus = result.bonuses.find(b => b.name === 'Large Molecule');
      expect(bonus?.love).toBe(25);
  });

  it('scoreFreestyle applies discovery bonus', () => {
      const result = scoreFreestyle([], 0, true);
      const bonus = result.bonuses.find(b => b.name === 'New Discovery');
      expect(bonus?.love).toBe(25);
  });

  it('scoreFreestyle stability multiplier at 100% doubles base', () => {
      const result = scoreFreestyle([{element: 'H'}, {element: 'H'}], 100, false);
      expect(result.baseLove).toBe(12); // 6 * 2
  });
  
  it('scoreFreestyle stability multiplier at 0% = 1x', () => {
      const result = scoreFreestyle([{element: 'H'}, {element: 'H'}], 0, false);
      expect(result.baseLove).toBe(6); // 6 * 1
  });

  it('generateChallenge returns description and timeLimit', () => {
      const challenge = generateChallenge();
      expect(challenge.description.length).toBeGreaterThan(0);
      expect(challenge.timeLimit).toBeGreaterThan(0);
  });

  it('generateChallenge bonusLove is positive', () => {
      const challenge = generateChallenge();
      expect(challenge.bonusLove).toBeGreaterThan(0);
  });
});
