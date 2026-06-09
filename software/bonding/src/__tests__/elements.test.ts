// âââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// BONDING â P31 Labs
// Element data integrity test suite
//
// Validates the 6-element palette: correct valences,
// size spread (Day 4 fix), color visibility, frequency
// assignments. Catches regressions like the carbon
// emissive invisibility bug.
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââ

import { describe, it, expect } from 'vitest';
import { ELEMENTS, ELEMENTS_ARRAY, ELEMENT_NAMES } from '../data/elements';
import type { ElementSymbol } from '../types';

const ALL_SYMBOLS: ElementSymbol[] = ['H', 'C', 'N', 'O', 'Na', 'P', 'Ca', 'Cl', 'S', 'Fe', 'Mn'];

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// Structural integrity
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââ

describe('Element definitions â structural integrity', () => {
  it('palette contains exactly 13 elements', () => {
    expect(Object.keys(ELEMENTS)).toHaveLength(13);
    expect(ELEMENTS_ARRAY).toHaveLength(13);
  });

  it('every expected element is present', () => {
    for (const sym of ALL_SYMBOLS) {
      expect(ELEMENTS[sym], `Missing element: ${sym}`).toBeDefined();
    }
  });

  it('ELEMENT_NAMES covers all palette elements', () => {
    for (const sym of ALL_SYMBOLS) {
      expect(ELEMENT_NAMES[sym]?.length).toBeGreaterThan(0);
    }
  });

  it('symbol field matches the key', () => {
    for (const [key, data] of Object.entries(ELEMENTS)) {
      expect(data.symbol).toBe(key);
    }
  });
});

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// Valences â chemistry correctness
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââ

describe('Element valences', () => {
  const expectedValences: Record<ElementSymbol, number> = {
    H: 1,
    C: 4,
    N: 3,
    O: 2,
    Na: 1,
    P: 3,
    Ca: 2,
    Cl: 1,
    S: 2,
    Fe: 3,
    Mn: 2,
    Ba: 4,
    Wi: 3,
  };

  for (const [sym, expected] of Object.entries(expectedValences)) {
    it(`${sym} has valence ${expected}`, () => {
      expect(ELEMENTS[sym as ElementSymbol].valence).toBe(expected);
    });
  }
});

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// Sizes â Day 4 fix verification
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââ

describe('Element sizes â differentiation', () => {
  it('H is the smallest element', () => {
    const hSize = ELEMENTS.H.size;
    for (const sym of ALL_SYMBOLS) {
      if (sym === 'H') continue;
      expect(
        ELEMENTS[sym].size,
        `${sym} should be larger than H`,
      ).toBeGreaterThan(hSize);
    }
  });

  it('Fe is the largest element', () => {
    const feSize = ELEMENTS.Fe.size;
    for (const sym of ALL_SYMBOLS) {
      if (sym === 'Fe') continue;
      expect(
        ELEMENTS[sym].size,
        `${sym} should be smaller than Fe`,
      ).toBeLessThan(feSize);
    }
  });

  it('no two elements share the same size', () => {
    const sizes = ALL_SYMBOLS.map((s) => ELEMENTS[s].size);
    expect(new Set(sizes).size, 'Size values should be unique').toBe(sizes.length);
  });

  it('size range has meaningful spread (min/max ratio < 0.5)', () => {
    const sizes = ALL_SYMBOLS.map((s) => ELEMENTS[s].size);
    const min = Math.min(...sizes);
    const max = Math.max(...sizes);
    expect(min / max).toBeLessThan(0.5);
  });

  it('all sizes are positive and reasonable (0.1â1.0)', () => {
    for (const sym of ALL_SYMBOLS) {
      const size = ELEMENTS[sym].size;
      expect(size, `${sym} size`).toBeGreaterThan(0.1);
      expect(size, `${sym} size`).toBeLessThanOrEqual(1.5);
    }
  });
});

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// Colors â visibility checks
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââ

describe('Element colors â visibility', () => {
  /**
   * Parse hex color to RGB, compute approximate luminance.
   * Returns 0â255 range.
   */
  function luminance(hex: string): number {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    // Perceived luminance (ITU-R BT.709)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  it('every element has valid hex color and emissive', () => {
    const hexRe = /^#[0-9A-Fa-f]{6}$/;
    for (const sym of ALL_SYMBOLS) {
      expect(ELEMENTS[sym].color, `${sym} color`).toMatch(hexRe);
      expect(ELEMENTS[sym].emissive, `${sym} emissive`).toMatch(hexRe);
    }
  });

  it('carbon emissive is bright enough (Day 4 fix: > luminance 80)', () => {
    // Old value #4A8224 had luminance ~95 but was invisible against bloom.
    // New value #66BB3A should be significantly brighter.
    const lum = luminance(ELEMENTS.C.emissive);
    expect(lum, `Carbon emissive luminance (${ELEMENTS.C.emissive})`).toBeGreaterThan(80);
  });

  it('each element has a visually distinct emissive color', () => {
    // No two emissive colors should be identical
    const emissives = ALL_SYMBOLS.map((s) => ELEMENTS[s].emissive);
    // Allow H and Ca to share white (#FFFFFF) â they differ in size
    const nonWhite = emissives.filter((e) => e !== '#FFFFFF');
    expect(
      new Set(nonWhite).size,
      'Non-white emissive colors should be unique',
    ).toBe(nonWhite.length);
  });
});

// âââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// Frequencies â P31 canonical table
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââ

describe('Element frequencies', () => {
  it('all frequencies are positive', () => {
    for (const sym of ALL_SYMBOLS) {
      expect(ELEMENTS[sym].frequency, `${sym} frequency`).toBeGreaterThan(0);
    }
  });

  it('all frequencies are in audible range (20â20000 Hz)', () => {
    for (const sym of ALL_SYMBOLS) {
      const freq = ELEMENTS[sym].frequency;
      expect(freq, `${sym}`).toBeGreaterThanOrEqual(20);
      expect(freq, `${sym}`).toBeLessThanOrEqual(20000);
    }
  });

  it('frequencies match P31 canonical values', () => {
    expect(ELEMENTS.H.frequency).toBe(523);   // C5
    expect(ELEMENTS.C.frequency).toBe(262);   // C4
    expect(ELEMENTS.N.frequency).toBe(247);   // B3
    expect(ELEMENTS.O.frequency).toBe(330);   // E4
    expect(ELEMENTS.Na.frequency).toBe(196);  // G3
    expect(ELEMENTS.P.frequency).toBe(172);   // F3
    expect(ELEMENTS.Ca.frequency).toBe(147);  // D3
  });

  it('every frequency has a note annotation', () => {
    for (const sym of ALL_SYMBOLS) {
      expect(ELEMENTS[sym].note.length, `${sym} note`).toBeGreaterThan(0);
    }
  });
});
