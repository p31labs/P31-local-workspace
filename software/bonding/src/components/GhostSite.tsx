// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// GhostSite — Holographic ring invitations
//
// Big enough to see, bright enough to beckon.
// Outer ring + inner dot so each site reads clearly
// even at distance. Rotates, breathes, pulses.
// When snapped: expands, goes green, unmissable.
//
// Enhanced: 4 orbiting motes circle the ring, adding
// a magnetic attraction feel. On snap they spiral inward.
// A faint connection line links back to parentPosition.
// ═══════════════════════════════════════════════════════

import { useRef, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface GhostSiteProps {
  position: [number, number, number];
  color: string;
  isSnapped?: boolean;
  /** Parent atom position — faint line connects back */
  parentPosition?: [number, number, number];
}

// Ring sized to be clearly visible next to atoms (0.5 scale)
const RING_GEOMETRY = new THREE.TorusGeometry(0.25, 0.02, 8, 32);
// Small dot at center so the site reads even head-on
const DOT_GEOMETRY = new THREE.SphereGeometry(0.06, 12, 12);
// Orbiting motes
const MOTE_GEOMETRY = new THREE.SphereGeometry(0.02, 6, 6);
const ORBIT_COUNT = 4;
const ORBIT_RADIUS = 0.35;

export const GhostSite = memo(function GhostSite({ position, color, isSnapped, parentPosition }: GhostSiteProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const dotRef = useRef<THREE.Mesh>(null);
  const motesRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useRef(new THREE.Object3D()).current;

  // Smooth color transition via ref
  const colorRef = useRef(new THREE.Color(color));
  const targetColor = useMemo(() => new THREE.Color(isSnapped ? '#4ade80' : color), [isSnapped, color]);

  // Connection line: built imperatively to avoid JSX <line> → SVG conflict
  const lineObj = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(6); // 2 points × 3
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.06,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    return new THREE.Line(geo, mat);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((state) => {
    if (!groupRef.current || !ringRef.current || !dotRef.current) return;
    const t = state.clock.elapsedTime;

    // Smooth color lerp (0.15s feel)
    colorRef.current.lerp(targetColor, 0.08);
    const currentColor = colorRef.current;

    // Rotation: ring slowly spins + gentle wobble
    ringRef.current.rotation.y += 0.025;
    ringRef.current.rotation.x = Math.sin(t * 0.6) * 0.4;

    // Scale: expand when snapped, breathe when idle
    const breathe = 1.0 + Math.sin(t * 2.5) * 0.12;
    const targetScale = isSnapped ? 1.8 : breathe;
    const current = groupRef.current.scale.x;
    groupRef.current.scale.setScalar(current + (targetScale - current) * 0.12);

    // Ring material
    const ringMat = ringRef.current.material as THREE.MeshBasicMaterial;
    const pulse = 0.3 + Math.sin(t * 3) * 0.12;
    ringMat.opacity = isSnapped ? 0.7 + Math.sin(t * 4) * 0.15 : pulse;
    ringMat.color.copy(currentColor);

    // Dot material
    const dotMat = dotRef.current.material as THREE.MeshBasicMaterial;
    const dotPulse = 0.35 + Math.sin(t * 3 + 1) * 0.15;
    dotMat.opacity = isSnapped ? 0.9 : dotPulse;
    dotMat.color.copy(currentColor);

    // Orbiting motes
    if (motesRef.current) {
      const mesh = motesRef.current;
      // When snapped, orbit radius shrinks (spiral inward) and speed increases
      const orbitR = isSnapped ? ORBIT_RADIUS * 0.4 : ORBIT_RADIUS;
      const speed = isSnapped ? 4.0 : 1.5;

      for (let i = 0; i < ORBIT_COUNT; i++) {
        const baseAngle = (i / ORBIT_COUNT) * Math.PI * 2;
        const angle = baseAngle + t * speed;
        const r = orbitR + Math.sin(t * 2 + i) * 0.03;

        dummy.position.set(
          Math.cos(angle) * r,
          Math.sin(t * 1.2 + i * 1.5) * 0.05, // slight vertical bob
          Math.sin(angle) * r,
        );
        const moteScale = isSnapped ? 0.6 : 0.8 + Math.sin(t * 3 + i * 2) * 0.2;
        dummy.scale.setScalar(moteScale);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        mesh.setColorAt(i, currentColor);
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }

    // Connection line to parent atom
    if (parentPosition) {
      const geo = lineObj.geometry;
      const posArr = (geo.getAttribute('position') as THREE.BufferAttribute).array as Float32Array;
      posArr[0] = 0; posArr[1] = 0; posArr[2] = 0;
      posArr[3] = parentPosition[0] - position[0];
      posArr[4] = parentPosition[1] - position[1];
      posArr[5] = parentPosition[2] - position[2];
      (geo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;

      const lineMat = lineObj.material as THREE.LineBasicMaterial;
      lineMat.opacity = isSnapped ? 0.15 : 0.06 + Math.sin(t * 2) * 0.03;
      lineMat.color.copy(currentColor);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Outer ring */}
      <mesh ref={ringRef} geometry={RING_GEOMETRY}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Center dot */}
      <mesh ref={dotRef} geometry={DOT_GEOMETRY}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {/* Orbiting motes */}
      <instancedMesh
        ref={motesRef}
        args={[MOTE_GEOMETRY, undefined, ORBIT_COUNT]}
        frustumCulled={false}
      >
        <meshBasicMaterial
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>
      {/* Connection line to parent atom */}
      {parentPosition && (
        <primitive object={lineObj} />
      )}
    </group>
  );
});
