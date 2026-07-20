/**
 * @file k4Binding.test.ts — Phase 2 K₄ skeleton binding.
 *
 * Validates: the ship K₄ graph is complete (4 vertices, 6 edges), planar,
 * vertex weights reflect activity, and edge health derives from relay latency
 * via RicciMath. K₄ is standard graph theory — no scientific claims.
 */
import { describe, it, expect } from 'vitest';
import {
  buildShipK4,
  meshHealth,
  meshCurvature,
  SUBSYSTEM_LABELS,
} from '../engine/k4Binding';

const activity = {
  cockpit: { activity: 0.8 },
  kids: { activity: 0.5 },
  game: { activity: 0.6 },
  ledger: { activity: 0.4 },
} as const;

describe('buildShipK4 structure', () => {
  it('produces a complete, planar K₄ (4 vertices, 6 edges)', () => {
    const g = buildShipK4(activity, 50);
    expect(g.vertexCount).toBe(4);
    expect(g.edgeCount).toBe(6);
    expect(g.isComplete()).toBe(true);
    expect(g.isPlanar()).toBe(true);
  });

  it('labels the four P31 subsystems as vertices', () => {
    const g = buildShipK4(activity, 50);
    const labels = g.vertices.map((v) => v.label).sort();
    expect(labels).toEqual(
      [SUBSYSTEM_LABELS.cockpit, SUBSYSTEM_LABELS.kids, SUBSYSTEM_LABELS.game, SUBSYSTEM_LABELS.ledger].sort(),
    );
  });

  it('adjacency matrix is symmetric and complete (no missing edges)', () => {
    const g = buildShipK4(activity, 50);
    const adj = g.adjacencyMatrix();
    expect(adj.length).toBe(4);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        expect(adj[i][j]).toBeCloseTo(adj[j][i], 6);
      }
    }
    // Every off-diagonal pair connected.
    let connected = 0;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if (i !== j && adj[i][j] > 0) connected++;
    expect(connected).toBe(12); // 6 edges × 2 directions
  });
});

describe('K₄ weights', () => {
  it('vertex weight reflects supplied activity (0..1)', () => {
    const g = buildShipK4(activity, 50);
    for (const v of g.vertices) {
      expect(v.weight).toBeGreaterThanOrEqual(0);
      expect(v.weight).toBeLessThanOrEqual(1);
    }
  });

  it('edge health is high with a healthy relay ping and low when disconnected', () => {
    const healthy = buildShipK4(activity, 30);
    const disconnected = buildShipK4(activity, 0);
    expect(meshHealth(healthy)).toBeGreaterThan(meshHealth(disconnected));
    expect(meshHealth(disconnected)).toBeLessThan(0.2);
  });

  it('meshCurvature stays within the Ricci κ range [0.5, 1.5]', () => {
    for (const ping of [0, 30, 200, 2000]) {
      const g = buildShipK4(activity, ping);
      const k = meshCurvature(g);
      expect(k).toBeGreaterThanOrEqual(0.5);
      expect(k).toBeLessThanOrEqual(1.5);
    }
  });
});
