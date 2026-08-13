/**
 * @file engine/sourceRegistry.ts — Universal source registry + loader
 *
 * Every data source lives here: built-in connectors (personal constellation),
 * HDX HAPI sources (Phase 4), and future uploads/URLs. The dome/pipeline only
 * ever asks the registry for a connector by id and loads it through the
 * canonical dataset store — nothing is hardwired.
 */

import type { DataConnector } from './dataConnectors';
import { useDatasetStore } from '../store/datasetStore';
import { personalConstellationConnector } from './personalConstellation';
import { createHapiConnector } from './hapiConnector';

export interface SourceRegistry {
  connectors: DataConnector[];
  get(id: string): DataConnector | undefined;
  register(connector: DataConnector): void;
  /** Fetch a connector's data, register it as a dataset, and activate it. */
  load(id: string): Promise<string | null>;
}

const builtInConnectors: DataConnector[] = [
  personalConstellationConnector,
  createHapiConnector('food-security'),
  createHapiConnector('population'),
];

export const sourceRegistry: SourceRegistry = {
  connectors: [...builtInConnectors],

  get: (id) => sourceRegistry.connectors.find((c) => c.id === id),

  register: (connector) => {
    if (!sourceRegistry.get(connector.id)) {
      sourceRegistry.connectors.push(connector);
    }
  },

  load: async (id) => {
    const connector = sourceRegistry.get(id);
    if (!connector) return null;

    const store = useDatasetStore.getState();
    const existing = store.datasets.find((d) => d.connectorId === id);
    if (existing) {
      if (connector.target !== 'face') store.setActiveVertexDataset(existing.id);
      if (connector.target !== 'vertex') store.setActiveFaceDataset(existing.id);
      return existing.id;
    }

    const points = await connector.fetch();

    const dsId = store.addDataset({
      name: connector.name,
      source: 'local',
      connectorId: connector.id,
      target: connector.target ?? 'both',
      data: points,
      styleGuide: connector.styleGuide,
      visible: true,
      opacity: 1,
    });

    if (connector.target !== 'face') store.setActiveVertexDataset(dsId);
    if (connector.target !== 'vertex') store.setActiveFaceDataset(dsId);
    return dsId;
  },
};

/**
 * Boot hook: activates the Personal Constellation when nothing is active yet,
 * so the dome never boots blank. `load()` reuses an already-loaded dataset, so
 * repeated calls (e.g. React StrictMode) never add duplicates.
 */
export function ensureDefaultSource(): void {
  const store = useDatasetStore.getState();
  if (store.activeFaceDatasetId || store.activeVertexDatasetId) return;
  void sourceRegistry.load('personal-constellation');
}
