import { describe, it, expect, beforeEach } from 'vitest';
import {
  FEATURES,
  allFeatures,
  getFeature,
  featuresByType,
  searchFeatures,
  registerMarketplaceListings,
  featureStats,
} from '../src/lib/featureRegistry';

describe('featureRegistry', () => {
  beforeEach(() => {
    registerMarketplaceListings([]);
  });

  it('seeds the documented inventory', () => {
    const stats = featureStats();
    expect(stats.byType.component).toBe(14);
    expect(stats.byType.worker).toBe(14);
    expect(stats.byType.skin).toBe(4);
    expect(stats.total).toBeGreaterThan(50);
  });

  it('looks up a feature by id', () => {
    expect(getFeature('app-nav')?.name).toBe('AppNav');
    expect(getFeature('love-ledger')?.type).toBe('worker');
    expect(getFeature('nope')).toBeUndefined();
  });

  it('filters by type', () => {
    const workers = featuresByType('worker');
    expect(workers.every((f) => f.type === 'worker')).toBe(true);
    expect(workers.length).toBe(14);
  });

  it('searches by name, id, and tag', () => {
    expect(searchFeatures('ledger').length).toBeGreaterThan(0);
    expect(searchFeatures('cloudflare').every((f) => f.tags?.includes('cloudflare'))).toBe(true);
    expect(searchFeatures('zzz-no-match')).toHaveLength(0);
  });

  it('merges dynamic marketplace listings at read time', () => {
    const before = allFeatures().length;
    registerMarketplaceListings([
      {
        id: 'addon-dynamic-x',
        name: 'Dynamic Addon X',
        type: 'addon',
        category: 'economy',
        description: 'merged at runtime',
        version: '0.1.0',
        maturity: 'beta',
        status: 'active',
        usedBy: ['phos'],
        marketplace: { published: true, price: 10 },
        createdAt: 0,
        updatedAt: 0,
      },
    ]);
    const after = allFeatures();
    expect(after.length).toBe(before + 1);
    expect(getFeature('addon-dynamic-x')).toBeDefined();
    expect(featureStats().marketplace).toBeGreaterThan(0);
  });
});
