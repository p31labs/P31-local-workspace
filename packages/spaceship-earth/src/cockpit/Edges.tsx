import { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useShipStore } from '../store/shipStore';

export default function Edges() {
  const { nodePositions, coherence, spoons } = useShipStore();

  const geometry = useMemo(() => {
    const positions: number[] = [];

    for (let i = 0; i < nodePositions.length; i++) {
      for (let j = i + 1; j < nodePositions.length; j++) {
        const a = new THREE.Vector3(...nodePositions[i]);
        const b = new THREE.Vector3(...nodePositions[j]);
        if (a.distanceTo(b) < 2.5) {
          const mid = a.clone().add(b).multiplyScalar(0.5);
          mid.add(mid.clone().normalize().multiplyScalar(0.5));

          const points: THREE.Vector3[] = [];
          for (let t = 0; t <= 1; t += 0.05) {
            points.push(
              new THREE.Vector3()
                .copy(a).multiplyScalar((1 - t) * (1 - t))
                .add(mid.clone().multiplyScalar(2 * (1 - t) * t))
                .add(b.clone().multiplyScalar(t * t)),
            );
          }

          // Convert curve to line segments
          for (let k = 0; k < points.length - 1; k++) {
            positions.push(points[k].x, points[k].y, points[k].z);
            positions.push(points[k + 1].x, points[k + 1].y, points[k + 1].z);
          }
        }
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geom;
  }, [nodePositions]);

  // Dispose the imperative buffer when it is rebuilt (nodePositions change) or
  // the edge layer unmounts.
  useEffect(() => () => {
    geometry.dispose();
  }, [geometry]);

  const opacity = 0.08 + 0.18 * coherence * (spoons / 5);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial
        color={0x44aaff}
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  );
}
