// src/engine/elementFacts.test.ts

import { describe, test, expect } from 'vitest';
import { elementFacts } from './elementFacts';

describe('Tiered Element Facts Registry', () => {
  test('all 10 required elements have facts', () => {
    expect(elementFacts.length).toBe(10);
    const symbols = elementFacts.map(e => e.symbol);
    const required = ['H', 'C', 'N', 'O', 'P', 'Na', 'Ca', 'Cl', 'S', 'Fe'];
    required.forEach(req => {
      expect(symbols).toContain(req);
    });
  });

  test('all elements have all 4 fun fact tiers', () => {
    elementFacts.forEach(el => {
      expect(el.facts.simple).toBeTruthy();
      expect(el.facts.intermediate).toBeTruthy();
      expect(el.facts.scientific).toBeTruthy();
      expect(el.facts.research).toBeTruthy();
    });
  });

  test('all elements have discoveryStory, bodyConnection, and cosmicOrigin', () => {
    elementFacts.forEach(el => {
      expect(el.discoveryStory).toBeTruthy();
      expect(el.bodyConnection).toBeTruthy();
      expect(el.cosmicOrigin).toBeTruthy();
    });
  });

  test('simple facts are under 80 characters', () => {
    elementFacts.forEach(el => {
      expect(el.facts.simple.length).toBeLessThan(80);
    });
  });

  test('no duplicate content between tiers', () => {
    elementFacts.forEach(el => {
      const set = new Set([
        el.facts.simple,
        el.facts.intermediate,
        el.facts.scientific,
        el.facts.research
      ]);
      expect(set.size).toBe(4);
    });
  });
});
