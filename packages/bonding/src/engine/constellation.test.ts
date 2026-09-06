// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Constellation Data Engine tests
//
// Pure unit tests. No React.
// Uses Vitest.
// ═══════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  generateConstellation,
  positionStar,
  calculateBrightness,
  getDominantColor,
  findConstellationLines,
  Star,
} from './constellation';

describe('Constellation Engine', () => {
    const mockGallery = [
        { id: '1', formula: 'H2O', name: 'Water', love: 50, atoms: 3, completedAt: '2026-03-10T10:00:00Z', isDiscovery: false, elements: {H:2, O:1} as Record<string, number> },
        { id: '2', formula: 'CO2', name: 'Carbon Dioxide', love: 250, atoms: 3, completedAt: '2026-03-11T10:00:00Z', isDiscovery: true, elements: {C:1, O:2} as Record<string, number> },
    ];

  it('generateConstellation returns stars for each gallery entry', () => {
    const { stars } = generateConstellation(mockGallery);
    expect(stars.length).toBe(2);
  });

  it('star positions are normalized 0-1', () => {
      const { stars } = generateConstellation(mockGallery);
      for (const star of stars) {
          expect(star.x).toBeGreaterThanOrEqual(0);
          expect(star.x).toBeLessThanOrEqual(1);
          expect(star.y).toBeGreaterThanOrEqual(0);
          expect(star.y).toBeLessThanOrEqual(1);
      }
  });

  it('brightness scales with LOVE', () => {
      expect(calculateBrightness(50)).toBeCloseTo(0.25);
  });

  it('brightness minimum is 0.1', () => {
      expect(calculateBrightness(0)).toBe(0.1);
  });

  it('brightness caps at 1.0', () => {
      expect(calculateBrightness(300)).toBe(1.0);
  });
  
  it('discoveries get marked', () => {
      const { stars } = generateConstellation(mockGallery);
      expect(stars.find(s => s.id === '2')?.isDiscovery).toBe(true);
  });

  it('getDominantColor returns element color for H₂O (oxygen=red)', () => {
      const color = getDominantColor({H:1, O:2}); // More O than H
      expect(color).toBe('#FF0000');
  });

  it('findConstellationLines connects molecules sharing elements', () => {
      const gallery = [
          {id: '1', elements: {H:2, O:1} as Record<string,number>},
          {id: '2', elements: {C:1, O:2} as Record<string,number>},
      ];
      const stars = [{id:'1'}, {id:'2'}] as Star[];
      const lines = findConstellationLines(stars, gallery);
      expect(lines.length).toBe(0); // Only 1 shared element

      const gallery2 = [
          {id: '1', elements: {C:1, H:4} as Record<string,number>},
          {id: '2', elements: {C:2, H:6} as Record<string,number>},
      ];
       const stars2 = [{id:'1'}, {id:'2'}] as Star[];
      const lines2 = findConstellationLines(stars2, gallery2);
      expect(lines2.length).toBe(1);
  });

  it('unrelated molecules have no connection line', () => {
      const gallery = [
          {id: '1', elements: {Na:1, Cl:1} as Record<string,number>},
          {id: '2', elements: {Fe:1, S:1} as Record<string,number>},
      ];
      const stars = [{id:'1'}, {id:'2'}] as Star[];
      const lines = findConstellationLines(stars, gallery);
      expect(lines.length).toBe(0);
  });
  
  it('positionStar distributes evenly', () => {
      const pos1 = positionStar(0, 10, 0, 0, 0);
      const pos2 = positionStar(5, 10, 0, 0, 0);
      expect(pos1.x).not.toBe(pos2.x);
  });

  it('empty gallery returns empty constellation', () => {
      const { stars, lines } = generateConstellation([]);
      expect(stars).toEqual([]);
      expect(lines).toEqual([]);
  });
});
