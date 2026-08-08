/**
 * @file cockpit/GraphEdges.tsx — P31 Graph Edges (55 Typed Relationships)
 * 
 * Typed relationship lines: treats/requires/includes/uses/monitors/litigates.
 * Color-coded by relationship type.
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { EDGES, VERTICES, baryToPosition } from '@p31/shared';

export default function GraphEdges() {
  const edgeLines = useMemo(() => {
    const nodePositions = new Map(
      VERTICES.map((v) => [v.id, baryToPosition(v, 9)])
    );

    return EDGES.map((edge) => {
      const start = nodePositions.get(edge.source);
      const end = nodePositions.get(edge.target);

      if (!start || !end) return null;

      // Color by relationship type
      let color = '#888888';
      switch (edge.relationship) {
        case 'treats':
        case 'supports':
          color = '#ff8844'; // warm (care)
          break;
        case 'requires':
        case 'depends-on':
          color = '#44aaff'; // cool (dependency)
          break;
        case 'includes':
        case 'uses':
          color = '#44ffaa'; // teal (system)
          break;
        case 'monitors':
        case 'litigates':
        case 'blocks':
          color = '#ff4466'; // red (shield)
          break;
      }

      return {
        key: `${edge.source}-${edge.target}`,
        points: [
          new THREE.Vector3(...start),
          new THREE.Vector3(...end),
        ],
        color,
      };
    }).filter(Boolean);
  }, []);

  return (
    <group name="graph-edges">
      {edgeLines.map((edge) => (
        <line key={edge!.key}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([
                ...edge!.points[0].toArray(),
                ...edge!.points[1].toArray(),
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={edge!.color}
            transparent
            opacity={0.25}
            depthWrite={false}
          />
        </line>
      ))}
    </group>
  );
}
