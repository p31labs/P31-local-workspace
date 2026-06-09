import * as THREE from 'three';

// Tetrahedron vertices (t=0)
const TETRA_VERTICES = [
  new THREE.Vector3( 1,  1,  1),
  new THREE.Vector3( 1, -1, -1),
  new THREE.Vector3(-1,  1, -1),
  new THREE.Vector3(-1, -1,  1),
].map(v => v.normalize());

// Cuboctahedron vertices (t=1)
const CUBOCTA_VERTICES = [
  new THREE.Vector3( 1,  1,  0), new THREE.Vector3( 1, -1,  0),
  new THREE.Vector3(-1,  1,  0), new THREE.Vector3(-1, -1,  0),
  new THREE.Vector3( 1,  0,  1), new THREE.Vector3( 1,  0, -1),
  new THREE.Vector3(-1,  0,  1), new THREE.Vector3(-1,  0, -1),
  new THREE.Vector3( 0,  1,  1), new THREE.Vector3( 0,  1, -1),
  new THREE.Vector3( 0, -1,  1), new THREE.Vector3( 0, -1, -1),
].map(v => v.normalize());

/**
 * Interpolate between tetrahedron and cuboctahedron.
 * At t=0, returns 4 tetrahedron vertices.
 * At t=1, returns 12 cuboctahedron vertices.
 * Between: smoothstep interpolation with vertex count expanding at t>0.3.
 */
export function jitterbugVertices(t: number): THREE.Vector3[] {
  const clamped = Math.max(0, Math.min(1, t));

  if (clamped < 0.3) {
    // Pure tetrahedron phase — breathe the 4 vertices
    return TETRA_VERTICES.map(v => v.clone());
  }

  // Expansion phase — interpolate toward cuboctahedron
  const expandT = (clamped - 0.3) / 0.7; // normalize to 0-1
  const smooth = expandT * expandT * (3 - 2 * expandT); // smoothstep

  // First 4 vertices morph from tetra positions toward cubocta[0..3]
  const result: THREE.Vector3[] = [];
  for (let i = 0; i < 4; i++) {
    result.push(
      TETRA_VERTICES[i].clone().lerp(CUBOCTA_VERTICES[i], smooth)
    );
  }

  // Additional vertices fade in with opacity (handled in renderer)
  // Their positions interpolate from center to cubocta target
  for (let i = 4; i < 12; i++) {
    const pos = new THREE.Vector3(0, 0, 0).lerp(CUBOCTA_VERTICES[i], smooth);
    result.push(pos);
  }

  return result;
}

/**
 * Generate edges for the current vertex configuration.
 * Returns pairs of indices into the vertex array.
 */
export function jitterbugEdges(vertexCount: number): [number, number][] {
  if (vertexCount <= 4) {
    // Tetrahedron: all pairs connected
    return [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];
  }
  // Cuboctahedron: 24 edges
  // Each vertex connects to 4 neighbors
  const edges: [number, number][] = [];
  const verts = CUBOCTA_VERTICES;
  const threshold = 1.05; // edge length ≈ 1.0 for unit cuboctahedron
  for (let i = 0; i < verts.length; i++) {
    for (let j = i + 1; j < verts.length; j++) {
      if (verts[i].distanceTo(verts[j]) < threshold) {
        edges.push([i, j]);
      }
    }
  }
  return edges.slice(0, vertexCount * 2); // progressive reveal
}
