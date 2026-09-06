/**
 * @file featureRegistry.ts — Query + merge layer over the unified Feature registry.
 *
 * Merges the static FEATURES seed (components/workers/surfaces/skins/add-ons)
 * with dynamic marketplace listings at read time. Single access point for any
 * panel that needs to enumerate or look up mesh capabilities.
 */

import { FEATURES, Feature, FeatureType } from '../data/features';

export * from '../data/features';

let dynamicListings: Feature[] = [];

/** Merge marketplace listings fetched from the Marketplace Worker at runtime. */
export function registerMarketplaceListings(listings: Feature[]): void {
  dynamicListings = listings;
}

export function allFeatures(): Feature[] {
  return [...FEATURES, ...dynamicListings];
}

export function getFeature(id: string): Feature | undefined {
  return allFeatures().find((f) => f.id === id);
}

export function featuresByType(type: FeatureType): Feature[] {
  return allFeatures().filter((f) => f.type === type);
}

export function searchFeatures(query: string): Feature[] {
  const q = query.trim().toLowerCase();
  if (!q) return allFeatures();
  return allFeatures().filter(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      f.id.toLowerCase().includes(q) ||
      f.description.toLowerCase().includes(q) ||
      (f.tags ?? []).some((t) => t.includes(q)),
  );
}

export function featureStats() {
  const all = allFeatures();
  const byType = {} as Record<FeatureType, number>;
  for (const f of all) byType[f.type] = (byType[f.type] ?? 0) + 1;
  const marketplace = all.filter((f) => f.marketplace?.published).length;
  return { total: all.length, byType, marketplace };
}
