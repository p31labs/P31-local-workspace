import { describe, it, expect } from 'vitest';
import { mapDataToEdges, mergeEdgeStyle } from '../engine/faceMapper';
import type { NormalizedDataPoint, EdgeData, DatasetStyleGuide } from '../engine/dataConnectors';
import { DOME_VERTICES } from '../math/domeMap';

const node = (id: string, vertexIndex: number, meta: Record<string, unknown> = {}): NormalizedDataPoint => ({
  id,
  type: 'node',
  vertexIndex,
  label: id,
  metadata: meta,
});

describe('mapDataToEdges', () => {
  const points: NormalizedDataPoint[] = [
    node('will', 0, { category: 'family', criticality: 'primary', temporal: 'active' }),
    node('bash', 1, { category: 'family', criticality: 'primary', temporal: 'active' }),
    node('court', 2, { category: 'legal', criticality: 'primary', temporal: 'active' }),
    {
      id: 'will-bash',
      type: 'edge',
      source: 'will',
      target: 'bash',
      label: 'Father-Son',
      metadata: { category: 'family', criticality: 'primary', temporal: 'active', weight: 1.0 },
    },
    {
      id: 'will-court',
      type: 'edge',
      source: 'will',
      target: 'court',
      label: 'Custody Case',
      metadata: { category: 'legal', criticality: 'primary', temporal: 'active', weight: 0.8 },
    },
  ];

  it('maps explicit edges to a 3D geodesic path on the dome', () => {
    const edges = mapDataToEdges(points);
    expect(edges).toHaveLength(2);

    const willBash = edges.find((e) => e.source === 'will' && e.target === 'bash')!;
    expect(willBash.vertices.length).toBeGreaterThanOrEqual(2);
    const [first, last] = [willBash.vertices[0], willBash.vertices[willBash.vertices.length - 1]];
    expect(first).toEqual([...DOME_VERTICES[0]]);
    expect(last).toEqual([...DOME_VERTICES[1]]);
  });

  it('derives implicit edges from node connections', () => {
    const pts = [node('a', 0), node('b', 1), { ...node('a', 0), connections: ['b'] }];
    const edges = mapDataToEdges(pts);
    expect(edges.some((e) => e.source === 'a' && e.target === 'b')).toBe(true);
  });

  it('skips edges whose endpoints are not mapped nodes', () => {
    const pts = [
      node('will', 0),
      {
        id: 'ghost-edge',
        type: 'edge',
        source: 'will',
        target: 'nobody',
        label: '',
        metadata: { category: 'family' },
      },
    ];
    expect(mapDataToEdges(pts)).toHaveLength(0);
  });

  it('deduplicates reciprocal edges', () => {
    const pts: NormalizedDataPoint[] = [
      node('a', 0),
      node('b', 1),
      { id: 'ab', type: 'edge', source: 'a', target: 'b', label: '', metadata: {} },
      { id: 'ba', type: 'edge', source: 'b', target: 'a', label: '', metadata: {} },
    ];
    expect(mapDataToEdges(pts)).toHaveLength(1);
  });

  it('applies temporal override + criticality multiplier to opacity and thickness', () => {
    const styleGuide: DatasetStyleGuide = {
      categories: {
        legal: { color: '#dc143c', thickness: 2.5, opacity: 1 },
      },
      temporalOverrides: {
        pending: { opacity: 0.6, dasharray: '5,5' },
      },
      criticalityMultiplier: { primary: 1, secondary: 0.7, tertiary: 0.5 },
    };

    const pts: NormalizedDataPoint[] = [
      node('will', 0, { category: 'legal', criticality: 'secondary', temporal: 'pending' }),
      node('ssa', 1, { category: 'legal', criticality: 'secondary', temporal: 'pending' }),
      {
        id: 'e',
        type: 'edge',
        source: 'will',
        target: 'ssa',
        label: '',
        metadata: { category: 'legal', criticality: 'secondary', temporal: 'pending' },
      },
    ];

    const edges = mapDataToEdges(pts, styleGuide);
    expect(edges).toHaveLength(1);
    const e = edges[0];
    expect(e.style.color).toBe('#dc143c');
    expect(e.style.thickness).toBeCloseTo(2.5 * 0.7, 5);
    expect(e.style.opacity).toBeCloseTo(0.6, 5);
    expect(e.style.dasharray).toBe('5,5');
  });

  it('falls back to defaults when no style guide is provided', () => {
    const pts: NormalizedDataPoint[] = [
      node('a', 0),
      node('b', 1),
      { id: 'ab', type: 'edge', source: 'a', target: 'b', label: '', metadata: {} },
    ];
    const edges = mapDataToEdges(pts);
    expect(edges[0].style.color).toBe('#22d3ee');
    expect(edges[0].style.thickness).toBeGreaterThan(0);
    expect(edges[0].style.opacity).toBeGreaterThan(0);
  });
});

describe('mergeEdgeStyle', () => {
  it('merges category base with temporal and criticality', () => {
    const guide: DatasetStyleGuide = {
      categories: { family: { color: '#ff6b35', thickness: 3, glow: true } },
      temporalOverrides: { pending: { opacity: 0.4 } },
      criticalityMultiplier: { primary: 1, secondary: 0.7 },
    };
    const style = mergeEdgeStyle('family', 'secondary', 'pending', guide);
    expect(style.color).toBe('#ff6b35');
    expect(style.thickness).toBeCloseTo(2.1, 5);
    expect(style.opacity).toBeCloseTo(0.32, 5);
    expect(style.glow).toBe(true);
  });

  it('returns defaults when no guide given', () => {
    const style = mergeEdgeStyle('other', 'tertiary', 'active');
    expect(style.color).toBe('#22d3ee');
    expect(style.animation).toBe('none');
    expect(style.glow).toBe(false);
  });
});
