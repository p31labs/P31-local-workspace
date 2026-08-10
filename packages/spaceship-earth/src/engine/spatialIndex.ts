/**
 * @file engine/spatialIndex.ts — Spatial indexing for fast nearest-face lookup
 *
 * For 320 faces, brute-force is <1ms and fine.
 * For 1280+ faces, use a grid-based spatial index for O(log N) lookups.
 */

import { DOME_FACE_CENTROIDS } from '../math/domeMap';

interface SpatialGrid {
  cellSize: number;
  grid: Map<string, number[]>;
}

function buildSpatialGrid(centroids: ReadonlyArray<readonly [number, number, number]>, cellSize = 0.5): SpatialGrid {
  const grid = new Map<string, number[]>();

  for (let i = 0; i < centroids.length; i++) {
    const [x, y, z] = centroids[i];
    const cx = Math.floor(x / cellSize);
    const cy = Math.floor(y / cellSize);
    const cz = Math.floor(z / cellSize);
    const key = `${cx},${cy},${cz}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key)!.push(i);
  }

  return { cellSize, grid };
}

const SPATIAL_INDEX = buildSpatialGrid(DOME_FACE_CENTROIDS);

export function findNearestFaceFast(x: number, y: number, z: number): number {
  const { cellSize, grid } = SPATIAL_INDEX;

  const cx = Math.floor(x / cellSize);
  const cy = Math.floor(y / cellSize);
  const cz = Math.floor(z / cellSize);

  let minDist = Infinity;
  let nearest = 0;

  // Search expanding radius of cells
  for (let dx = -2; dx <= 2; dx++) {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dz = -2; dz <= 2; dz++) {
        const key = `${cx + dx},${cy + dy},${cz + dz}`;
        const cell = grid.get(key);
        if (!cell) continue;

        for (const idx of cell) {
          const c = DOME_FACE_CENTROIDS[idx];
          const ddx = x - c[0];
          const ddy = y - c[1];
          const ddz = z - c[2];
          const dist = ddx * ddx + ddy * ddy + ddz * ddz;
          if (dist < minDist) {
            minDist = dist;
            nearest = idx;
          }
        }
      }
    }
  }

  return nearest;
}
