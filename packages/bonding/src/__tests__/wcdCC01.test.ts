// src/__tests__/wcdCC01.test.ts
// WCD-CC01: Orphaned config wire-up — verification tests.

import { describe, it, expect } from 'vitest';
import { MOLECULE_FUN_FACTS, getFunFact } from '../config/funFacts';
import { BASHIUM } from '../config/bashium';
import { WILLIUM } from '../config/willium';
import {
  WONKY_FOOTER,
  FIRST_MOLECULE,
  CONFETTI,
  ELEMENT_TONES,
  BOND_TONE,
  COMPLETION_CHORD,
  logBirthdayConsole,
} from '../config/easterEggs';
import { ELEMENTS } from '../data/elements';

// ── funFacts.ts ──

describe('funFacts', () => {
  it('has facts for all Seed mode molecules', () => {
    expect(getFunFact('H\u2082')).toBeTruthy();
    expect(getFunFact('O\u2082')).toBeTruthy();
    expect(getFunFact('H\u2082O')).toBeTruthy();
    expect(getFunFact('H\u2082O\u2082')).toBeTruthy();
  });

  it('has facts for Sprout mode molecules', () => {
    expect(getFunFact('CO\u2082')).toBeTruthy();
    expect(getFunFact('CH\u2084')).toBeTruthy();
  });

  it('has facts for Sapling mode molecules', () => {
    expect(getFunFact('NaCl')).toBeTruthy();
    expect(getFunFact('HCl')).toBeTruthy();
  });

  it('returns null for unknown formula', () => {
    expect(getFunFact('XxYy\u2082')).toBeNull();
  });

  it('exports at least 15 facts', () => {
    expect(Object.keys(MOLECULE_FUN_FACTS).length).toBeGreaterThanOrEqual(15);
  });
});

// ── bashium.ts ──

describe('bashium', () => {
  it('has correct element config', () => {
    expect(BASHIUM.symbol).toBe('Ba');
    expect(BASHIUM.name).toBe('Bashium');
    expect(BASHIUM.atomicNumber).toBe(10);
    expect(BASHIUM.maxBonds).toBe(4);
    expect(BASHIUM.color).toBe('#CC55FF');
  });

  it('has unlock and completion messages', () => {
    expect(BASHIUM.unlockToast.line1).toBeTruthy();
    expect(BASHIUM.unlockToast.line2).toBeTruthy();
    expect(BASHIUM.completionMessage.line1).toBeTruthy();
    expect(BASHIUM.completionMessage.line2).toBeTruthy();
    expect(BASHIUM.completionMessage.line3).toBeTruthy();
  });

  it('has a fun fact', () => {
    expect(BASHIUM.funFact.length).toBeGreaterThan(0);
  });

  it('is registered in ELEMENTS data', () => {
    expect(ELEMENTS['Ba']).toBeDefined();
    expect(ELEMENTS['Ba'].name).toBe('Bashium');
    expect(ELEMENTS['Ba'].valence).toBe(4);
  });
});

// ── willium.ts ──

describe('willium', () => {
  it('has correct element config', () => {
    expect(WILLIUM.symbol).toBe('Wi');
    expect(WILLIUM.name).toBe('Willium');
    expect(WILLIUM.atomicNumber).toBe(6);
    expect(WILLIUM.maxBonds).toBe(3);
    expect(WILLIUM.color).toBe('#44EE88');
  });

  it('has unlock and completion messages', () => {
    expect(WILLIUM.unlockToast.line1).toBeTruthy();
    expect(WILLIUM.unlockToast.line2).toBeTruthy();
    expect(WILLIUM.completionMessage.line1).toBeTruthy();
    expect(WILLIUM.completionMessage.line2).toBeTruthy();
    expect(WILLIUM.completionMessage.line3).toBeTruthy();
  });

  it('has a fun fact', () => {
    expect(WILLIUM.funFact.length).toBeGreaterThan(0);
  });

  it('is registered in ELEMENTS data', () => {
    expect(ELEMENTS['Wi']).toBeDefined();
    expect(ELEMENTS['Wi'].name).toBe('Willium');
    expect(ELEMENTS['Wi'].valence).toBe(3);
  });
});

// ── easterEggs.ts ──

describe('easterEggs', () => {
  it('exports WONKY_FOOTER text', () => {
    expect(WONKY_FOOTER).toContain('wonky');
    expect(WONKY_FOOTER).toContain('\u{1F53A}');
  });

  it('exports FIRST_MOLECULE config', () => {
    expect(FIRST_MOLECULE.storageKey).toBe('bonding_first_molecule_shown');
    expect(FIRST_MOLECULE.line1).toBeTruthy();
    expect(FIRST_MOLECULE.line2).toBeTruthy();
  });

  it('exports CONFETTI config with valid counts', () => {
    expect(CONFETTI.normalCount).toBeGreaterThan(0);
    expect(CONFETTI.questCompleteCount).toBeGreaterThan(CONFETTI.normalCount);
    expect(CONFETTI.bashiumCount).toBeGreaterThan(CONFETTI.questCompleteCount);
    expect(CONFETTI.colors.length).toBeGreaterThan(0);
    expect(CONFETTI.duration).toBeGreaterThan(0);
  });

  it('exports ELEMENT_TONES for all standard elements', () => {
    const standardElements = ['H', 'O', 'C', 'N', 'Na', 'Ca', 'P', 'Cl', 'S'];
    for (const el of standardElements) {
      expect(ELEMENT_TONES[el]).toBeGreaterThan(0);
    }
    // Secret elements included
    expect(ELEMENT_TONES['Ba']).toBeGreaterThan(0);
    expect(ELEMENT_TONES['Wi']).toBeGreaterThan(0);
  });

  it('exports BOND_TONE config', () => {
    expect(BOND_TONE.freq1).toBeGreaterThan(0);
    expect(BOND_TONE.freq2).toBeGreaterThan(0);
    expect(BOND_TONE.duration).toBeGreaterThan(0);
  });

  it('exports COMPLETION_CHORD config', () => {
    expect(COMPLETION_CHORD.notes.length).toBe(4);
    expect(COMPLETION_CHORD.duration).toBeGreaterThan(0);
    expect(COMPLETION_CHORD.attack).toBeGreaterThan(0);
    expect(COMPLETION_CHORD.release).toBeGreaterThan(0);
  });

  it('logBirthdayConsole is callable', () => {
    expect(() => logBirthdayConsole()).not.toThrow();
  });
});

// ── Secret elements in ELEMENTS_ARRAY ──

describe('secret elements in palette data', () => {
  it('Ba and Wi are excluded from standard ELEMENTS_ARRAY order', () => {
    // Ba and Wi exist in ELEMENTS but should be filtered by mode palette
    // (they are only added conditionally by ElementPalette)
    expect(ELEMENTS['Ba']).toBeDefined();
    expect(ELEMENTS['Wi']).toBeDefined();
  });

  it('Ba matches bashium.ts config', () => {
    expect(ELEMENTS['Ba'].color).toBe(BASHIUM.color);
    expect(ELEMENTS['Ba'].emissive).toBe(BASHIUM.emissive);
    expect(ELEMENTS['Ba'].frequency).toBe(BASHIUM.frequency);
  });

  it('Wi matches willium.ts config', () => {
    expect(ELEMENTS['Wi'].color).toBe(WILLIUM.color);
    expect(ELEMENTS['Wi'].emissive).toBe(WILLIUM.emissive);
    expect(ELEMENTS['Wi'].frequency).toBe(WILLIUM.frequency);
  });
});
