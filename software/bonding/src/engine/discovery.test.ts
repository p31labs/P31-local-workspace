// @vitest-environment jsdom
// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Discovery system tests
//
// Pure unit tests. No React. No game imports.
// Uses Vitest. Mocks localStorage.
// ═══════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isKnownMolecule,
  isDiscovery,
  validateDiscoveryName,
  getSavedDiscoveries,
  saveDiscovery,
  lookupDiscovery,
} from './discovery';

// Mock localStorage
const mockStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('Discovery', () => {
  beforeEach(() => {
    mockStorage['bonding_discoveries'] = '';
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
  });

  it('isKnownMolecule returns true for H2O', () => {
    expect(isKnownMolecule('H2O')).toBe(true);
  });

  it('isKnownMolecule returns true for Ca9O24P6', () => {
    expect(isKnownMolecule('Ca9O24P6')).toBe(true);
  });

  it('isKnownMolecule returns false for random formula', () => {
    expect(isKnownMolecule('XeF4')).toBe(false);
  });

  it('isDiscovery returns true for unknown formula', () => {
    expect(isDiscovery('XeF4')).toBe(true);
  });

  it('isDiscovery returns false for H2O', () => {
    expect(isDiscovery('H2O')).toBe(false);
  });

  it('validateDiscoveryName accepts "Bash\'s Molecule"', () => {
    const result = validateDiscoveryName("Bash's Molecule");
    expect(result.valid).toBe(true);
  });

  it('validateDiscoveryName rejects empty string', () => {
    const result = validateDiscoveryName('');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Name must be at least 2 characters');
  });

  it('validateDiscoveryName rejects string over 30 chars', () => {
    const longName = 'A'.repeat(31);
    const result = validateDiscoveryName(longName);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Name must be at most 30 characters');
  });

  it('saveDiscovery persists to localStorage', () => {
    saveDiscovery('XeF4', 'Bash\'s Molecule', 'Will');

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'bonding_discoveries',
      expect.stringContaining('XeF4')
    );
  });

  it('lookupDiscovery returns name for saved discovery', () => {
    mockStorage['bonding_discoveries'] = JSON.stringify([{
      formula: 'XeF4',
      name: "Bash's Molecule",
      discoveredBy: 'Will',
      discoveredAt: new Date().toISOString(),
    }]);
    const name = lookupDiscovery('XeF4');
    expect(name).toBe("Bash's Molecule");
  });

  it('lookupDiscovery returns null for unknown formula', () => {
    mockStorage['bonding_discoveries'] = JSON.stringify([]);
    const name = lookupDiscovery('H2O');
    expect(name).toBe(null);
  });

  it('getSavedDiscoveries returns all saved discoveries', () => {
    const d1 = {
      formula: 'XeF4',
      name: "Bash's Molecule",
      discoveredBy: 'Will',
      discoveredAt: new Date().toISOString(),
    };
    const d2 = {
      formula: 'CH5',
      name: 'Will\'s Gas',
      discoveredBy: 'Will',
      discoveredAt: new Date().toISOString(),
    };
    mockStorage['bonding_discoveries'] = JSON.stringify([d1, d2]);
    const discoveries = getSavedDiscoveries();
    expect(discoveries).toHaveLength(2);
    expect(discoveries[0]?.formula).toBe('XeF4');
    expect(discoveries[1]?.formula).toBe('CH5');
  });

  it('saveDiscovery replaces existing formula', () => {
    saveDiscovery('XeF4', 'First', 'Will');
    saveDiscovery('XeF4', 'Second', 'Will');

    const stored = JSON.parse(mockStorage['bonding_discoveries'] ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('Second');
  });

  it('saveDiscovery trims name', () => {
    saveDiscovery('XeF4', '  Trimmed  ', 'Will');
    const stored = JSON.parse(mockStorage['bonding_discoveries'] ?? '[]');
    expect(stored[0].name).toBe('Trimmed');
  });
});