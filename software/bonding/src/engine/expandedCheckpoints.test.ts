// src/engine/expandedCheckpoints.test.ts

import { describe, it, expect } from 'vitest';
import { expandedCheckpoints } from './expandedCheckpoints';

describe('Expanded Checkpoints Registry', () => {
  it('at least 80 checkpoints defined', () => {
    expect(expandedCheckpoints.length).toBeGreaterThanOrEqual(80);
  });

  it('all checkpoints have required fields', () => {
    expandedCheckpoints.forEach(cp => {
      expect(cp.formula).toBeDefined();
      expect(cp.displayFormula).toBeDefined();
      expect(cp.displayName).toBeDefined();
      expect(cp.category).toBeDefined();
      expect(cp.difficulty).toBeDefined();
      expect(cp.atomCount).toBeDefined();
      expect(cp.funFacts).toBeDefined();
    });
  });

  it('all checkpoints have all 4 fun fact tiers', () => {
    expandedCheckpoints.forEach(cp => {
      expect(cp.funFacts.simple).toBeTruthy();
      expect(cp.funFacts.intermediate).toBeTruthy();
      expect(cp.funFacts.scientific).toBeTruthy();
      expect(cp.funFacts.research).toBeTruthy();
    });
  });

  it('no duplicate formulas', () => {
    const formulas = expandedCheckpoints.map(cp => cp.formula);
    const uniqueFormulas = new Set(formulas);
    expect(formulas.length).toBe(uniqueFormulas.size);
  });

  it('seed difficulty checkpoints have atomCount <= 6', () => {
    const seeds = expandedCheckpoints.filter(cp => cp.difficulty === 'seed');
    seeds.forEach(seed => {
        expect(seed.atomCount).toBeLessThanOrEqual(6);
    });
  });

  it('categories are valid enum values', () => {
    const validCategories = ['gas', 'liquid', 'solid', 'acid', 'base', 'salt', 'organic', 'mineral', 'biological', 'industrial'];
    expandedCheckpoints.forEach(cp => {
      expect(validCategories).toContain(cp.category);
    });
  });

  it('displayFormula uses subscript characters when formula has digits', () => {
    const subscriptRegex = /[₀-₉]/;
    expandedCheckpoints.forEach(cp => {
      // Only formulas with digit counts (e.g. H2O, CO2) need subscripts
      if (/[A-Za-z][2-9]/.test(cp.formula)) {
        expect(subscriptRegex.test(cp.displayFormula)).toBe(true);
      }
    });
  });

  it('Posner molecule is present', () => {
    const posner = expandedCheckpoints.find(cp => cp.formula === 'Ca9O24P6');
    expect(posner).toBeDefined();
    expect(posner?.displayName).toBe('Posner Molecule');
  });

  it('all formulas are valid Hill system', () => {
    expandedCheckpoints.forEach(cp => {
        const formula = cp.formula;
        const elements = (formula.match(/[A-Z][a-z]?\d*/g) || []);
        const hasCarbon = elements.some(el => el.startsWith('C') && !el.startsWith('Ca') && !el.startsWith('Cl'));

        if (hasCarbon) {
            expect(elements[0]!.startsWith('C')).toBe(true);
            const hasHydrogen = elements.some(el => el.startsWith('H') && !el.startsWith('He'));
            if(hasHydrogen){
                expect(elements[1]!.startsWith('H')).toBe(true);
            }
        }
    });
  });
});
