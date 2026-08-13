import { describe, it, expect } from 'vitest';
import { VERTICES, EDGES } from '@p31/shared';
import { DOME_VERTICES } from '../math/domeMap';
import {
  emitPersonalConstellation,
  personalConstellationConnector,
  PERSONAL_CONSTELLATION_NODE_COLORS,
} from '../engine/personalConstellation';
import { sourceRegistry, ensureDefaultSource } from '../engine/sourceRegistry';
import { useDatasetStore } from '../store/datasetStore';
import type { NormalizedDataPoint } from '../engine/datasetTypes';

describe('emitPersonalConstellation', () => {
  it('emits one node per shared vertex, deterministically', () => {
    const points = emitPersonalConstellation();
    const nodes = points.filter((p) => p.type === 'node');
    const edges = points.filter((p) => p.type === 'edge');

    expect(nodes).toHaveLength(VERTICES.length);
    expect(edges).toHaveLength(EDGES.length);

    const indices = nodes.map((n) => n.vertexIndex);
    expect(indices.every((i) => typeof i === 'number' && i >= 0 && i < DOME_VERTICES.length)).toBe(true);
    expect(new Set(indices).size).toBe(nodes.length);

    const ids = new Set(nodes.map((n) => n.id));
    for (const e of edges) {
      expect(ids.has(e.source)).toBe(true);
      expect(ids.has(e.target)).toBe(true);
    }
  });

  it('maps each axis to its semantic category and color', () => {
    const nodes = emitPersonalConstellation().filter((p) => p.type === 'node');
    for (const v of VERTICES) {
      const expected = { Body: 'medical', Mesh: 'family', Forge: 'project', Shield: 'legal' }[v.axis];
      const node = nodes.find((n) => n.id === v.id);
      expect(node?.metadata?.category).toBe(expected);
      expect(PERSONAL_CONSTELLATION_NODE_COLORS[expected as string]).toBeDefined();
    }
  });

  it('marks every node with a criticality scalar value and typed state', () => {
    const nodes = emitPersonalConstellation().filter((p) => p.type === 'node');
    const metas = nodes.map((n) => n.metadata);
    expect(metas.every((m) => ['primary', 'secondary', 'tertiary'].includes(m?.criticality as string))).toBe(true);
    expect(metas.every((m) => ['active', 'pending', 'resolved', 'dormant'].includes(m?.temporal as string))).toBe(true);
    expect(nodes.every((n) => typeof n.value === 'number' && n.value > 0)).toBe(true);
  });

  it('carries the edge category from the target node', () => {
    const points = emitPersonalConstellation();
    const nodes = points.filter((p) => p.type === 'node');
    const edges = points.filter((p) => p.type === 'edge');
    const categoryById = new Map(nodes.map((n) => [n.id, n.metadata?.category]));
    for (const e of edges) {
      expect(e.metadata?.category).toBe(categoryById.get(e.target as string));
    }
  });
});

describe('personalConstellationConnector', () => {
  it('is a vertex-target connector with a style guide', () => {
    expect(personalConstellationConnector.id).toBe('personal-constellation');
    expect(personalConstellationConnector.target).toBe('vertex');
    expect(personalConstellationConnector.styleGuide?.categories).toHaveProperty('family');
    expect(personalConstellationConnector.styleGuide?.categories).toHaveProperty('legal');
    expect(personalConstellationConnector.styleGuide?.categories).toHaveProperty('medical');
    expect(personalConstellationConnector.styleGuide?.categories).toHaveProperty('project');
  });

  it('fetches the same points as emitPersonalConstellation', async () => {
    const fetched = await personalConstellationConnector.fetch();
    expect(fetched).toHaveLength(emitPersonalConstellation().length);
  });
});

describe('sourceRegistry', () => {
  it('registers and loads a connector into the dataset store', async () => {
    const stub: NormalizedDataPoint[] = [
      { id: 'a', type: 'node', label: 'A', vertexIndex: 0, value: 10 },
      { id: 'b', type: 'node', label: 'B', vertexIndex: 1, value: 20 },
    ];
    sourceRegistry.register({
      id: 'test-connector',
      name: 'Test Connector',
      target: 'vertex',
      fetch: async () => stub,
    });

    const id = await sourceRegistry.load('test-connector');
    expect(id).toBeTruthy();

    const store = useDatasetStore.getState();
    const dataset = store.datasets.find((d) => d.id === id);
    expect(dataset).toBeDefined();
    expect(dataset?.name).toBe('Test Connector');
    expect(dataset?.target).toBe('vertex');
    expect(store.activeVertexDatasetId).toBe(id);

    store.removeDataset(id as string);
  });

  it('returns null for unknown connectors', async () => {
    expect(await sourceRegistry.load('nope')).toBeNull();
  });

  it('reuses an existing dataset instead of duplicating it', async () => {
    const id = await sourceRegistry.load('test-connector');
    const idAgain = await sourceRegistry.load('test-connector');
    expect(idAgain).toBe(id);
    expect(useDatasetStore.getState().datasets.filter((d) => d.connectorId === 'test-connector')).toHaveLength(1);
    useDatasetStore.getState().removeDataset(id as string);
  });

  it('exposes the built-in connectors (constellation + HDX)', () => {
    expect(sourceRegistry.get('personal-constellation')).toBeDefined();
    expect(sourceRegistry.get('hapi-food-security')?.target).toBe('face');
    expect(sourceRegistry.get('hapi-population')?.target).toBe('face');
  });

  it('ignores duplicate registrations', () => {
    const before = sourceRegistry.connectors.length;
    sourceRegistry.register({ id: 'test-connector', name: 'Dup', fetch: async () => [] });
    expect(sourceRegistry.connectors).toHaveLength(before);
  });
});

describe('ensureDefaultSource', () => {
  it('boots the Personal Constellation when nothing is active', async () => {
    const store = useDatasetStore.getState();
    store.clearAll();
    expect(store.activeVertexDatasetId).toBeNull();

    ensureDefaultSource();
    await new Promise((r) => setTimeout(r, 0));

    const after = useDatasetStore.getState();
    expect(after.activeVertexDatasetId).not.toBeNull();
    const ds = after.datasets.find((d) => d.id === after.activeVertexDatasetId);
    expect(ds?.connectorId).toBe('personal-constellation');
  });

  it('does not disturb an existing active dataset', async () => {
    const store = useDatasetStore.getState();
    ensureDefaultSource();
    await new Promise((r) => setTimeout(r, 0));
    const active = useDatasetStore.getState().activeVertexDatasetId;

    ensureDefaultSource();
    expect(useDatasetStore.getState().activeVertexDatasetId).toBe(active);
    useDatasetStore.getState().clearAll();
  });
});
