/**
 * @file __tests__/observatory.test.ts — Observatory Data Engine Tests
 * 
 * Validates barycentric determinism, dominant axis, hash spread, geodesic edge counts,
 * node color mapping, axis/bus/state coverage.
 */

import { describe, it, expect } from 'vitest';
import {
  VERTICES,
  EDGES,
  AXES,
  AXIS_ORDER,
  STATE_GLOW,
  BUS_CSS,
  hashStr,
  baryToPosition,
  getDominantAxis,
  getGraphNodeColor,
  geodesicEdgeCount,
  type NodeInfo,
  type AxisKey,
} from '@p31/shared';

describe('Observatory Data Engine', () => {
  describe('Graph Data Integrity', () => {
    it('has 58 vertices across 4 axes', () => {
      expect(VERTICES).toHaveLength(58);
      const axisCounts = VERTICES.reduce((acc, v) => {
        acc[v.axis] = (acc[v.axis] || 0) + 1;
        return acc;
      }, {} as Record<AxisKey, number>);
      expect(axisCounts.Body).toBe(12);
      expect(axisCounts.Mesh).toBe(9);
      expect(axisCounts.Forge).toBe(20);
      expect(axisCounts.Shield).toBe(17);
    });

    it('has 55 edges with valid source/target refs', () => {
      expect(EDGES).toHaveLength(55);
      const nodeIds = new Set(VERTICES.map((v) => v.id));
      EDGES.forEach((edge) => {
        expect(nodeIds.has(edge.source), `Edge source "${edge.source}" must exist in VERTICES`).toBe(true);
        expect(nodeIds.has(edge.target), `Edge target "${edge.target}" must exist in VERTICES`).toBe(true);
      });
    });

    it('all vertices have unique IDs', () => {
      const ids = VERTICES.map((v) => v.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('all vertices have valid axis/state/bus fields', () => {
      VERTICES.forEach((node) => {
        expect(AXIS_ORDER).toContain(node.axis);
        expect(STATE_GLOW[node.state]).toBeDefined();
        expect(BUS_CSS[node.bus]).toBeDefined();
      });
    });
  });

  describe('Barycentric Layout', () => {
    it('baryToPosition produces deterministic positions', () => {
      const node = VERTICES.find((v) => v.id === 'spoon-budget')!;
      const pos1 = baryToPosition(node, 9);
      const pos2 = baryToPosition(node, 9);
      expect(pos1).toEqual(pos2);
    });

    it('baryToPosition scales to shell radius', () => {
      const node = VERTICES.find((v) => v.id === 'love-econ')!;
      const pos = baryToPosition(node, 12);
      const distance = Math.sqrt(pos[0] ** 2 + pos[1] ** 2 + pos[2] ** 2);
      expect(distance).toBeCloseTo(12, 1); // within 10% tolerance
    });

    it('different nodes have different positions', () => {
      const node1 = VERTICES.find((v) => v.id === 'audhd')!;
      const node2 = VERTICES.find((v) => v.id === 'bonding-game')!;
      const pos1 = baryToPosition(node1, 9);
      const pos2 = baryToPosition(node2, 9);
      expect(pos1).not.toEqual(pos2);
    });
  });

  describe('Hash Spread Determinism', () => {
    it('hashStr produces consistent 0..1 values', () => {
      const hash1 = hashStr('test-node-id');
      const hash2 = hashStr('test-node-id');
      expect(hash1).toBe(hash2);
      expect(hash1).toBeGreaterThanOrEqual(0);
      expect(hash1).toBeLessThanOrEqual(1);
    });

    it('different strings produce different hashes', () => {
      const hash1 = hashStr('spoon-budget');
      const hash2 = hashStr('love-econ');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Dominant Axis', () => {
    it('getDominantAxis returns node axis', () => {
      const node = VERTICES.find((v) => v.id === 'cloudflare')!;
      expect(getDominantAxis(node)).toBe('Forge');
    });
  });

  describe('Node Color', () => {
    it('getGraphNodeColor returns axis RGB array', () => {
      const node = VERTICES.find((v) => v.id === 'court-mar12')!;
      const color = getGraphNodeColor(node);
      expect(Array.isArray(color)).toBe(true);
      expect(color).toHaveLength(3);
      expect(color[0]).toBe(255); // R
      expect(color[1]).toBe(68);  // G
      expect(color[2]).toBe(102); // B
    });
  });

  describe('Geodesic Shell Math', () => {
    it('geodesicEdgeCount scales with detail', () => {
      expect(geodesicEdgeCount(1)).toBe(60); // 1V
      expect(geodesicEdgeCount(2)).toBe(120); // 2V (heuristic)
    });
  });

  describe('Axis Configuration', () => {
    it('AXES defines 4 axes with colors', () => {
      expect(Object.keys(AXES)).toHaveLength(4);
      expect(AXES.Body.color).toBe(0xff9944);
      expect(AXES.Mesh.color).toBe(0x44aaff);
      expect(AXES.Forge.color).toBe(0x44ffaa);
      expect(AXES.Shield.color).toBe(0xff4466);
    });
  });

  describe('State Glow Mapping', () => {
    it('STATE_GLOW has entries for all states', () => {
      const states = new Set(VERTICES.map((v) => v.state));
      states.forEach((state) => {
        expect(STATE_GLOW[state], `STATE_GLOW must have entry for "${state}"`).toBeDefined();
      });
    });

    it('crisis states have higher intensity + scale', () => {
      expect(STATE_GLOW.crisis.intensity).toBeGreaterThan(STATE_GLOW.operational.intensity);
      expect(STATE_GLOW.crisis.scale).toBeGreaterThan(STATE_GLOW.operational.scale);
      expect(STATE_GLOW.countdown.scale).toBeGreaterThanOrEqual(1.5);
    });
  });

  describe('Bus CSS', () => {
    it('BUS_CSS defines 3 bus colors', () => {
      expect(BUS_CSS.vital).toBe('#ff6633');
      expect(BUS_CSS.ac).toBe('#33aacc');
      expect(BUS_CSS.dc).toBe('#cccc44');
    });
  });
});
