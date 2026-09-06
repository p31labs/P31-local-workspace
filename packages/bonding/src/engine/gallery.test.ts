// @vitest-environment jsdom
// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Gallery module tests
//
// Pure unit tests. No React. No game imports.
// Uses Vitest. Mocks localStorage.
// ═══════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  GalleryEntry,
  saveToGallery,
  getGallery,
  getGalleryByMode,
  getGalleryCount,
  getTotalLove,
  hasBuiltFormula,
  getUniqueFormulas,
  clearGallery,
} from './gallery';

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

function makeEntry(overrides: Partial<GalleryEntry> = {}): GalleryEntry {
  return {
    id: 'test-id',
    formula: 'H2O',
    displayFormula: 'H₂O',
    name: 'Water',
    atoms: 3,
    love: 10,
    achievements: ['first_water'],
    mode: 'seed',
    playerName: 'Will',
    completedAt: new Date('2026-02-27T12:00:00Z').toISOString(),
    isDiscovery: false,
    ...overrides,
  };
}

describe('Gallery', () => {
  beforeEach(() => {
    mockStorage['bonding_gallery'] = '';
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
  });

  it('saveToGallery adds entry with all fields', () => {
    const entry = makeEntry();
    saveToGallery(entry);

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'bonding_gallery',
      JSON.stringify([entry])
    );
  });

  it('getGallery returns newest first', () => {
    const e1 = makeEntry({ id: '1', completedAt: new Date('2026-02-27T10:00:00Z').toISOString() });
    const e2 = makeEntry({ id: '2', completedAt: new Date('2026-02-27T12:00:00Z').toISOString() });
    const e3 = makeEntry({ id: '3', completedAt: new Date('2026-02-27T11:00:00Z').toISOString() });

    mockStorage['bonding_gallery'] = JSON.stringify([e1, e2, e3]);
    const gallery = getGallery();

    expect(gallery).toHaveLength(3);
    expect(gallery[0]?.id).toBe('2');
    expect(gallery[1]?.id).toBe('3');
    expect(gallery[2]?.id).toBe('1');
  });

  it('getGalleryByMode filters correctly', () => {
    const e1 = makeEntry({ id: '1', mode: 'seed' });
    const e2 = makeEntry({ id: '2', mode: 'sprout' });
    const e3 = makeEntry({ id: '3', mode: 'seed' });

    mockStorage['bonding_gallery'] = JSON.stringify([e1, e2, e3]);
    const seed = getGalleryByMode('seed');

    expect(seed).toHaveLength(2);
    expect(seed.map(e => e.id)).toEqual(['1', '3']);
  });

  it('getGalleryCount returns correct count', () => {
    const e1 = makeEntry({ id: '1' });
    const e2 = makeEntry({ id: '2' });

    mockStorage['bonding_gallery'] = JSON.stringify([e1, e2]);
    expect(getGalleryCount()).toBe(2);
  });

  it('getTotalLove sums across all entries', () => {
    const e1 = makeEntry({ id: '1', love: 5 });
    const e2 = makeEntry({ id: '2', love: 15 });

    mockStorage['bonding_gallery'] = JSON.stringify([e1, e2]);
    expect(getTotalLove()).toBe(20);
  });

  it('hasBuiltFormula returns true for existing formula', () => {
    const e1 = makeEntry({ id: '1', formula: 'H2O' });
    const e2 = makeEntry({ id: '2', formula: 'CO2' });

    mockStorage['bonding_gallery'] = JSON.stringify([e1, e2]);
    expect(hasBuiltFormula('H2O')).toBe(true);
    expect(hasBuiltFormula('CO2')).toBe(true);
  });

  it('hasBuiltFormula returns false for new formula', () => {
    const e1 = makeEntry({ id: '1', formula: 'H2O' });
    mockStorage['bonding_gallery'] = JSON.stringify([e1]);
    expect(hasBuiltFormula('CH4')).toBe(false);
  });

  it('getUniqueFormulas deduplicates', () => {
    const e1 = makeEntry({ id: '1', formula: 'H2O' });
    const e2 = makeEntry({ id: '2', formula: 'H2O' });
    const e3 = makeEntry({ id: '3', formula: 'CO2' });

    mockStorage['bonding_gallery'] = JSON.stringify([e1, e2, e3]);
    const unique = getUniqueFormulas();

    expect(unique).toEqual(expect.arrayContaining(['H2O', 'CO2']));
    expect(unique).toHaveLength(2);
  });

  it('gallery trims to 500 entries when exceeded', () => {
    const entries: GalleryEntry[] = [];
    for (let i = 0; i < 502; i++) {
      entries.push(makeEntry({ id: `id-${i}`, formula: `H2O-${i}` }));
    }
    mockStorage['bonding_gallery'] = JSON.stringify(entries);

    // Trigger trim by saving another entry
    saveToGallery(makeEntry({ id: 'new', formula: 'new' }));

    const stored = JSON.parse(mockStorage['bonding_gallery']);
    expect(stored).toHaveLength(500);
    expect(stored[stored.length - 1]?.formula).toBe('new');
  });

  it('clearGallery empties storage', () => {
    mockStorage['bonding_gallery'] = JSON.stringify([makeEntry()]);
    clearGallery();

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('bonding_gallery');
  });

  it('saveToGallery handles missing optional fields', () => {
    const entry: GalleryEntry = {
      id: 'test',
      formula: 'H2O',
      displayFormula: 'H₂O',
      name: 'Water',
      atoms: 3,
      love: 10,
      achievements: [],
      mode: 'seed',
      playerName: 'Will',
      completedAt: new Date().toISOString(),
      isDiscovery: false,
    };
    saveToGallery(entry);

    expect(mockLocalStorage.setItem).toHaveBeenCalled();
  });

  it('getGallery returns empty array when no entries', () => {
    mockStorage['bonding_gallery'] = '';
    const gallery = getGallery();
    expect(gallery).toEqual([]);
  });
});