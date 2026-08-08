import { useEffect, useMemo, useRef, type Ref } from 'react';
import * as THREE from 'three';

interface InstancedEdgesProps {
  segments: [THREE.Vector3, THREE.Vector3][];
  color: string;
  colors?: string[];
  radius?: number;
  opacity?: number;
  additive?: boolean;
  toneMapped?: boolean;
  materialRef?: Ref<THREE.MeshBasicMaterial>;
}

export default function InstancedEdges({
  segments,
  color,
  colors,
  radius = 0.022,
  opacity = 1,
  additive = true,
  toneMapped = false,
  materialRef,
}: InstancedEdgesProps) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const v1 = useMemo(() => new THREE.Vector3(), []);
  const v2 = useMemo(() => new THREE.Vector3(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const mid = useMemo(() => new THREE.Vector3(), []);
  const quat = useMemo(() => new THREE.Quaternion(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    segments.forEach(([a, b], i) => {
      v1.copy(a);
      v2.copy(b);
      dir.subVectors(v2, v1);
      const len = dir.length();
      if (len === 0) return;
      mid.addVectors(v1, v2).multiplyScalar(0.5);
      quat.setFromUnitVectors(up, dir.normalize());
      dummy.position.copy(mid);
      dummy.quaternion.copy(quat);
      dummy.scale.set(1, len, 1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    if (colors) {
      const c = new THREE.Color();
      segments.forEach((_, i) => {
        c.set(colors[i] ?? color);
        m.setColorAt(i, c);
      });
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
  }, [segments, colors, color, up, dummy, v1, v2, dir, mid, quat]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, Math.max(segments.length, 1)]}>
      <cylinderGeometry args={[radius, radius, 1, 6, 1, false]} />
      <meshBasicMaterial
        ref={materialRef}
        color={color}
        transparent={opacity < 1 || !!materialRef}
        opacity={opacity}
        blending={additive ? THREE.AdditiveBlending : THREE.NormalBlending}
        depthWrite={false}
        toneMapped={toneMapped}
      />
    </instancedMesh>
  );
}
