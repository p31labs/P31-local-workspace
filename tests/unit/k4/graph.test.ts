import { describe, it, expect } from 'vitest';
import { K4Graph } from '../../../k4-worker/src/engine/graph';

describe('K4Graph', () => {
  it('creates 4 vertices', () => {
    const g = new K4Graph();
    expect(g.vertexCount).toBe(4);
  });

  it('creates 6 edges', () => {
    const g = new K4Graph();
    expect(g.edgeCount).toBe(6);
  });

  it('is complete', () => {
    const g = new K4Graph();
    expect(g.isComplete()).toBe(true);
  });

  it('is planar', () => {
    const g = new K4Graph();
    expect(g.isPlanar()).toBe(true);
  });

  it('getVertex returns correct vertex', () => {
    const g = new K4Graph();
    const v = g.getVertex(1);
    expect(v).toBeDefined();
    expect(v!.label).toBe('Apex');
  });

  it('getVertex returns undefined for invalid id', () => {
    const g = new K4Graph();
    expect(g.getVertex(99)).toBeUndefined();
  });

  it('getEdge returns correct edge', () => {
    const g = new K4Graph();
    const e = g.getEdge(1, 2);
    expect(e).toBeDefined();
    expect(e!.label).toBe('Hub ↔ NP');
  });

  it('getEdge handles reversed order', () => {
    const g = new K4Graph();
    const e = g.getEdge(2, 1);
    expect(e).toBeDefined();
  });

  it('adjacencyMatrix is 4x4 symmetric', () => {
    const g = new K4Graph();
    const mat = g.adjacencyMatrix();
    expect(mat).toHaveLength(4);
    for (const row of mat) {
      expect(row).toHaveLength(4);
    }
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        expect(mat[i][j]).toBe(mat[j][i]);
      }
    }
  });

  it('shortestPath between adjacent vertices', () => {
    const g = new K4Graph();
    const path = g.shortestPath(1, 2);
    expect(path).toEqual([1, 2]);
  });

  it('shortestPath same vertex', () => {
    const g = new K4Graph();
    expect(g.shortestPath(1, 1)).toEqual([1]);
  });

  it('all vertices connected (diameter = 1)', () => {
    const g = new K4Graph();
    for (let i = 1; i <= 4; i++) {
      for (let j = i + 1; j <= 4; j++) {
        const path = g.shortestPath(i, j);
        expect(path.length).toBe(2);
        expect(path[0]).toBe(i);
        expect(path[path.length - 1]).toBe(j);
      }
    }
  });
});
