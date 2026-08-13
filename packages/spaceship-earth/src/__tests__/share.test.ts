import { describe, it, expect } from 'vitest';
import { encodeDatasetPayload, decodeDatasetPayload, parseShareParams } from '../engine/share';
import { pointsToCsv } from '../hud/ExportButton';
import type { NormalizedDataPoint } from '../engine/dataConnectors';

describe('share payload', () => {
  const points: NormalizedDataPoint[] = [
    {
      id: 'p1',
      value: 42,
      label: 'San Francisco',
      timestamp: 1710000000000,
      location: { lat: 37.62, lon: -122.38 },
    },
    {
      id: 'p2',
      value: 7,
      category: 'stable',
      label: 'Auckland',
      vector: { x: 0.1, y: 0.2, z: 0.3 },
      faceIndex: 12,
    },
  ];

  it('round-trips encodeDatasetPayload → decodeDatasetPayload', () => {
    const encoded = encodeDatasetPayload(points);
    const decoded = decodeDatasetPayload(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded).toHaveLength(2);
    expect(decoded![0]).toMatchObject({
      id: 'p1',
      value: 42,
      label: 'San Francisco',
      timestamp: 1710000000000,
      location: { lat: 37.62, lon: -122.38 },
    });
    expect(decoded![1]).toMatchObject({
      id: 'p2',
      value: 7,
      category: 'stable',
      label: 'Auckland',
      vector: { x: 0.1, y: 0.2, z: 0.3 },
      faceIndex: 12,
    });
  });

  it('omits metadata from encoded payloads', () => {
    const encoded = encodeDatasetPayload([
      { id: 'm1', label: 'x', metadata: { secret: 'nope' } },
    ]);
    expect(encoded).not.toContain('secret');
    expect(encoded).not.toContain('nope');
  });

  it('returns null for garbage input', () => {
    expect(decodeDatasetPayload('!!!not base64!!!')).toBeNull();
    expect(decodeDatasetPayload('e30=')).toBeNull(); // '{}' — not an array
    expect(decodeDatasetPayload('')).toBeNull();
  });
});

describe('parseShareParams', () => {
  it('parses a payload share link', () => {
    expect(parseShareParams('?dataset=payload:abc&name=Test&agg=last&bucky=1')).toEqual({
      payload: 'abc',
      name: 'Test',
      agg: 'last',
      bucky: true,
    });
  });

  it('parses a dataset URL share link', () => {
    expect(
      parseShareParams('?dataset=https%3A%2F%2Fexample.com%2Fdata.csv&name=S%20Foo&bucky=true'),
    ).toEqual({
      datasetUrl: 'https://example.com/data.csv',
      name: 'S Foo',
      bucky: true,
    });
  });

  it('returns null without a dataset param or on garbage', () => {
    expect(parseShareParams('?name=Test')).toBeNull();
    expect(parseShareParams('')).toBeNull();
    expect(parseShareParams('not a search')).toBeNull();
  });
});

describe('pointsToCsv', () => {
  it('emits the documented header with empty cells when absent', () => {
    const csv = pointsToCsv([
      {
        id: 'a',
        value: 5,
        category: 'x',
        label: 'Alpha',
        timestamp: 1000,
        location: { lat: 1.5, lon: -2.5 },
      },
      { id: 'b', value: 7, label: 'Beta', faceIndex: 3 },
    ]);
    expect(csv).toBe(
      'id,value,category,label,timestamp,lat,lon,faceIndex,vertexIndex\n' +
        'a,5,x,Alpha,1000,1.5,-2.5,,\n' +
        'b,7,,Beta,,,,3,',
    );
  });

  it('quotes cells containing commas', () => {
    const csv = pointsToCsv([{ id: 'a', label: 'Hello, World', value: 1 }]);
    expect(csv).toContain('"Hello, World"');
  });
});
