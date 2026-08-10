import { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { regularTetra } from '../math/geometry';
import { useShipStore } from '../store/shipStore';

const K4_SCALE = 8.4;
const K4_COLOR = '#00f0ff';
const K4_OPACITY = 0.6;

export default function K4Wireframe() {
  const show = useShipStore((s) => s.showK4Wireframe);
  const gl = useThree((state) => state.gl);

  const segments = useMemo(() => {
    const tetra = regularTetra(K4_SCALE);
    const verts = [
      new THREE.Vector3(...tetra.v0),
      new THREE.Vector3(...tetra.v1),
      new THREE.Vector3(...tetra.v2),
      new THREE.Vector3(...tetra.v3),
    ];
    const pairs: [THREE.Vector3, THREE.Vector3][] = [];
    for (let i = 0; i < 4; i++) {
      for (let j = i + 1; j < 4; j++) {
        pairs.push([verts[i], verts[j]]);
      }
    }
    return pairs;
  }, []);

  if (!show || !gl) return null;

  return (
    <group name="k4-wireframe">
      {segments.map(([a, b], idx) => (
        <line key={idx}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([
                a.x, a.y, a.z,
                b.x, b.y, b.z,
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={K4_COLOR}
            transparent
            opacity={K4_OPACITY}
            depthTest={true}
            depthWrite={false}
          />
        </line>
      ))}
    </group>
  );
}
