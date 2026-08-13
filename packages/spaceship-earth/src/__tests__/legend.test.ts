import { describe, it, expect } from 'vitest';
import { buildGradientStops, formatLegendLabel, collectLegendCategories } from '../hud/Legend';
import { defaultColorScale } from '../engine/faceMapper';
import type { FaceData } from '../engine/dataConnectors';

describe('buildGradientStops', () => {
  it('returns the requested number of rgb() stops', () => {
    const stops = buildGradientStops(0, 100, 24);
    expect(stops).toHaveLength(24);
    for (const s of stops) {
      expect(s).toMatch(/^rgb\(\d{1,3},\d{1,3},\d{1,3}\)$/);
    }
  });

  it('defaults to 24 stops', () => {
    expect(buildGradientStops(0, 100)).toHaveLength(24);
  });

  it('matches the dome color scale at both endpoints', () => {
    const min = 0;
    const max = 100;
    const stops = buildGradientStops(min, max, 8);
    expect(stops[0]).toBe(defaultColorScale(min, min, max));
    expect(stops[stops.length - 1]).toBe(defaultColorScale(max, min, max));
  });

  it('is red-channel monotonic, mirroring the dome ramp', () => {
    const stops = buildGradientStops(0, 100, 24);
    const reds = stops.map((s) => {
      const m = /^rgb\((\d{1,3}),(\d{1,3}),(\d{1,3})\)$/.exec(s);
      if (!m) throw new Error(`unexpected stop: ${s}`);
      return Number(m[1]);
    });
    for (let i = 1; i < reds.length; i++) {
      expect(reds[i]).toBeGreaterThanOrEqual(reds[i - 1]);
    }
  });

  it('handles min === max as a solid color', () => {
    const stops = buildGradientStops(7, 7, 5);
    expect(stops).toHaveLength(5);
    expect(new Set(stops).size).toBe(1);
    expect(stops[0]).toBe(defaultColorScale(7, 7, 7));
  });

  it('returns an empty array for count <= 0', () => {
    expect(buildGradientStops(0, 1, 0)).toEqual([]);
  });
});

describe('formatLegendLabel', () => {
  it('keeps integers clean', () => {
    expect(formatLegendLabel(42)).toBe('42');
    expect(formatLegendLabel(0)).toBe('0');
    expect(formatLegendLabel(-17)).toBe('-17');
  });

  it('rounds floats to 2 decimals', () => {
    expect(formatLegendLabel(3.14159)).toBe('3.14');
    expect(formatLegendLabel(-0.5)).toBe('-0.50');
  });

  it('switches to scientific notation for extreme magnitudes', () => {
    expect(formatLegendLabel(1000)).toBe('1.00e+3');
    expect(formatLegendLabel(0.001)).toBe('1.00e-3');
  });

  it('renders non-finite values as a dash', () => {
    expect(formatLegendLabel(NaN)).toBe('\u2013');
    expect(formatLegendLabel(Infinity)).toBe('\u2013');
  });
});

describe('collectLegendCategories', () => {
  it('deduplicates categories preserving first-seen order', () => {
    const data: FaceData[] = [
      { faceIndex: 0, value: 1, color: '#22d3ee', label: '', category: 'crisis' },
      { faceIndex: 1, value: 2, color: '#22d3ee', label: '', category: 'stable' },
      { faceIndex: 2, value: 3, color: '#22d3ee', label: '', category: 'crisis' },
    ];
    expect(collectLegendCategories(data)).toEqual(['crisis', 'stable']);
  });

  it('skips faces without a category', () => {
    const data: FaceData[] = [
      { faceIndex: 0, value: 1, color: '#22d3ee', label: '' },
      { faceIndex: 1, value: 2, color: '#22d3ee', label: '', category: 'warning' },
    ];
    expect(collectLegendCategories(data)).toEqual(['warning']);
  });

  it('returns an empty array for empty input', () => {
    expect(collectLegendCategories([])).toEqual([]);
  });
});
