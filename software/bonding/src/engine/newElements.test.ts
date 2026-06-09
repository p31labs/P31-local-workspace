// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// New elements tests
//
// Pure unit tests. No React. No game imports.
// Uses Vitest.
// ═══════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  CHLORINE,
  SULFUR,
  IRON,
  NEW_ELEMENTS,
  NEW_MOLECULES,
  MODE_ELEMENTS,
} from './newElements';
import type { ElementSymbol } from '../types';

describe('New Elements', () => {
  it('Cl has maxBonds 1', () => {
    expect(CHLORINE.valence).toBe(1);
  });

  it('S has maxBonds 2', () => {
    expect(SULFUR.valence).toBe(2);
  });

  it('Fe has maxBonds 3', () => {
    expect(IRON.valence).toBe(3);
  });

  it('All new elements have required fields', () => {
    for (const el of NEW_ELEMENTS) {
      expect(el.symbol).toBeDefined();
      expect(el.name).toBeDefined();
      expect(el.valence).toBeDefined();
      expect(el.color).toBeDefined();
      expect(el.emissive).toBeDefined();
      expect(el.frequency).toBeDefined();
      expect(el.note).toBeDefined();
      expect(el.size).toBeDefined();
      expect(el.funFact).toBeDefined();
    }
  });

  it('All new elements have funFact', () => {
    for (const el of NEW_ELEMENTS) {
      expect(typeof el.funFact).toBe('string');
      expect(el.funFact.length).toBeGreaterThan(0);
    }
  });

  it('All new elements have valid frequency > 0', () => {
    for (const el of NEW_ELEMENTS) {
      expect(typeof el.frequency).toBe('number');
      expect(el.frequency).toBeGreaterThan(0);
    }
  });

  it('ClNa checkpoint has displayName Salt', () => {
    const entry = NEW_MOLECULES.find(m => m.formula === 'ClNa');
    expect(entry).toBeDefined();
    expect(entry?.displayName).toBe('Salt');
    expect(entry?.displayFormula).toBe('NaCl');
  });

  it('Fe2O3 checkpoint has displayName Rust', () => {
    const entry = NEW_MOLECULES.find(m => m.formula === 'Fe2O3');
    expect(entry).toBeDefined();
    expect(entry?.displayName).toBe('Rust');
    expect(entry?.displayFormula).toBe('Fe₂O₃');
  });

  it('No duplicate symbols with existing elements', () => {
    const existing: ElementSymbol[] = ['H', 'C', 'N', 'O', 'Na', 'P', 'Ca'];
    const newSymbols = NEW_ELEMENTS.map(e => e.symbol);
    for (const sym of newSymbols) {
      expect(existing).not.toContain(sym);
    }
  });

  it('Mode assignments include all 10 elements for sapling', () => {
    const sapling = MODE_ELEMENTS.sapling;
    expect(sapling).toHaveLength(10);
    expect(sapling).toContain('H');
    expect(sapling).toContain('C');
    expect(sapling).toContain('N');
    expect(sapling).toContain('O');
    expect(sapling).toContain('P');
    expect(sapling).toContain('Na');
    expect(sapling).toContain('Ca');
    expect(sapling).toContain('Cl');
    expect(sapling).toContain('S');
    expect(sapling).toContain('Fe');
  });

  it('Seed mode unchanged', () => {
    const seed = MODE_ELEMENTS.seed;
    expect(seed).toEqual(['H', 'O']);
  });

  it('Sprout mode unchanged', () => {
    const sprout = MODE_ELEMENTS.sprout;
    expect(sprout).toEqual(['H', 'C', 'N', 'O']);
  });

  it('All new molecules have required fields', () => {
    for (const m of NEW_MOLECULES) {
      expect(m.formula).toBeDefined();
      expect(m.displayName).toBeDefined();
      expect(m.displayFormula).toBeDefined();
      expect(m.elements).toBeDefined();
      expect(Object.keys(m.elements).length).toBeGreaterThan(0);
    }
  });

  it('New molecules include expected formulas', () => {
    const formulas = NEW_MOLECULES.map(m => m.formula);
    expect(formulas).toContain('ClNa');
    expect(formulas).toContain('ClH');
    expect(formulas).toContain('H2S');
    expect(formulas).toContain('O2S');
    expect(formulas).toContain('Fe2O3');
    expect(formulas).toContain('FeS');
  });
});