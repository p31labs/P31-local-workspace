import { describe, it, expect, beforeEach } from 'vitest';
import { useDatasetStore } from '../store/datasetStore';
import type { NormalizedDataPoint, Dataset } from '../engine/datasetTypes';
import type { FaceData, VertexData, EdgeData } from '../engine/dataConnectors';

function seedLoadedDataset(overrides: Partial<Dataset> = {}): string {
  const id = useDatasetStore.getState().addDataset({
    name: 'seed',
    source: 'upload',
    target: 'both',
    data: [
      { id: 'a', label: 'a', value: 1 },
      { id: 'b', label: 'b', value: 2 },
    ] as unknown as NormalizedDataPoint[],
    visible: true,
    opacity: 1,
  });
  useDatasetStore.getState().updateDataset(id, {
    status: 'ready',
    faceData: [{ faceIndex: 0, value: 1 } as FaceData],
    vertexData: [{ id: 'a', value: 1 } as VertexData],
    edgeData: [{ source: 'a', target: 'b' } as EdgeData],
    faceFrames: [[{ faceIndex: 0, value: 1 } as FaceData]],
    timestamps: [1, 2],
    ...overrides,
  });
  return id;
}

beforeEach(() => {
  const state = useDatasetStore.getState();
  for (const d of state.datasets) state.removeDataset(d.id);
});

describe('datasetStore.unloadDataset', () => {
  it('drops derived render data and timeline frames, keeping raw points', () => {
    const id = seedLoadedDataset();
    useDatasetStore.getState().unloadDataset(id);

    const ds = useDatasetStore.getState().datasets.find((d) => d.id === id);
    expect(ds).toBeDefined();
    expect(ds!.status).toBe('idle');
    expect(ds!.faceData).toBeUndefined();
    expect(ds!.vertexData).toBeUndefined();
    expect(ds!.edgeData).toBeUndefined();
    expect(ds!.faceFrames).toBeUndefined();
    expect(ds!.vertexFrames).toBeUndefined();
    expect(ds!.edgeFrames).toBeUndefined();
    expect(ds!.timestamps).toBeUndefined();
    expect(ds!.data).toHaveLength(2); // raw points survive for reload
  });

  it('deactivates a dataset that is the active face layer', () => {
    const id = seedLoadedDataset();
    useDatasetStore.getState().setActiveFaceDataset(id);
    expect(useDatasetStore.getState().activeFaceDatasetId).toBe(id);

    useDatasetStore.getState().unloadDataset(id);
    expect(useDatasetStore.getState().activeFaceDatasetId).toBeNull();
  });

  it('deactivates a dataset that is the active vertex layer', () => {
    const id = seedLoadedDataset();
    useDatasetStore.getState().setActiveVertexDataset(id);
    expect(useDatasetStore.getState().activeVertexDatasetId).toBe(id);

    useDatasetStore.getState().unloadDataset(id);
    expect(useDatasetStore.getState().activeVertexDatasetId).toBeNull();
  });

  it('is a no-op for unknown ids', () => {
    const id = seedLoadedDataset();
    useDatasetStore.getState().unloadDataset('missing');
    const ds = useDatasetStore.getState().datasets.find((d) => d.id === id);
    expect(ds!.status).toBe('ready'); // untouched
  });

  it('removeDataset releases derived data before dropping the record', () => {
    const id = seedLoadedDataset();
    useDatasetStore.getState().setActiveFaceDataset(id);
    useDatasetStore.getState().removeDataset(id);
    expect(useDatasetStore.getState().datasets).toHaveLength(0);
    expect(useDatasetStore.getState().activeFaceDatasetId).toBeNull();
  });

  it('clearAll unloads every dataset', () => {
    seedLoadedDataset();
    seedLoadedDataset();
    const store = useDatasetStore.getState();
    store.setActiveFaceDataset(store.datasets[0]!.id);
    useDatasetStore.getState().clearAll();
    expect(useDatasetStore.getState().datasets).toHaveLength(0);
    expect(useDatasetStore.getState().activeFaceDatasetId).toBeNull();
  });
});
