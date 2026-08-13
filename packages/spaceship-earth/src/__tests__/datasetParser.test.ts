import { describe, it, expect } from 'vitest';
import { parseDataset } from '../engine/datasetParser';
import { useDatasetStore } from '../store/datasetStore';
import { mapDataToFaces } from '../engine/faceMapper';
import type { NormalizedDataPoint } from '../engine/datasetTypes';

describe('parseDataset', () => {
  it('detects geo CSV and normalizes lat/lon', () => {
    const csv = 'name,lat,lon,value\nSFO,37.62,-122.38,42\nLAX,33.94,-118.41,17\n';
    const result = parseDataset(csv);
    expect(result.errors).toEqual([]);
    expect(result.schema.detectedTarget).toBe('face');
    expect(result.schema.hasLatLon).toBe(true);
    expect(result.schema.hasFaceIndex).toBe(false);
    expect(result.points).toHaveLength(2);
    expect(result.points[0]).toMatchObject({
      value: 42,
      location: { lat: 37.62, lon: -122.38 },
    });
  });

  it('detects faceIndex rows', () => {
    const json = JSON.stringify({
      data: [
        { faceIndex: 12, value: 3 },
        { faceIndex: 250, value: 9 },
      ],
    });
    const result = parseDataset(json);
    expect(result.errors).toEqual([]);
    expect(result.schema.hasFaceIndex).toBe(true);
    expect(result.schema.detectedTarget).toBe('face');
    expect(result.points[0].faceIndex).toBe(12);
  });

  it('reports parse errors instead of throwing', () => {
    const result = parseDataset('{ bad json');
    expect(result.points).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('JSON');
  });

  it('rejects unrecognised formats', () => {
    const result = parseDataset('hello world not a dataset');
    expect(result.points).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('falls back to numeric column detection on plain CSV', () => {
    const result = parseDataset('a,b\n1,2\n3,4\n');
    expect(result.schema.fields).toEqual(['a', 'b']);
    expect(result.schema.hasFaceIndex).toBe(false);
    expect(result.schema.hasVertexIndex).toBe(false);
  });
});

describe('datasetStore', () => {
  it('maps uploaded points into face render data', () => {
    const id = useDatasetStore.getState().addDataset({
      name: 'test',
      source: 'upload',
      target: 'face',
      data: [
        { lat: 37.62, lon: -122.38, value: 42, schema: { source: 'csv' } as never },
      ] as unknown as NormalizedDataPoint[],
      visible: true,
      opacity: 1,
    });
    useDatasetStore.getState().setActiveFaceDataset(id);

    const mapped = mapDataToFaces(useDatasetStore.getState().datasets[0]!.data, {
      aggregation: 'mean',
    });
    expect(Array.isArray(mapped)).toBe(true);

    useDatasetStore.getState().removeDataset(id);
    expect(useDatasetStore.getState().datasets).toHaveLength(0);
  });
});
