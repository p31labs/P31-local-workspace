/**
 * @file PosnerMolecule.tsx — 3D Ca9(PO4)6 Posner Cluster Visualizer
 * Glass quantum-field rendering. Spoon-reactive destabilization.
 * CWP-JITTERBUG-14: Post-Inertial Shield (Posner)
 */
import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, MeshTransmissionMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

interface PosnerMoleculeProps {
  spoons: number;
  calcium?: number;
}

// Ca9(PO4)6: 9 calcium vertices + 6 phosphate vertices arranged in C3 symmetry
function buildPosnerPositions(): { ca: THREE.Vector3[]; po4: THREE.Vector3[] } {
  const ca: THREE.Vector3[] = [];
  const po4: THREE.Vector3[] = [];

  // 3 Ca triples arranged in C3 symmetry, two rings + center
  const r1 = 1.1, r2 = 0.55;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    // upper ring
    ca.push(new THREE.Vector3(r1 * Math.cos(a), 0.6, r1 * Math.sin(a)));
    // lower ring (rotated 60°)
    ca.push(new THREE.Vector3(r1 * Math.cos(a + Math.PI / 3), -0.6, r1 * Math.sin(a + Math.PI / 3)));
    // inner channel
    ca.push(new THREE.Vector3(r2 * Math.cos(a + Math.PI / 6), 0.0, r2 * Math.sin(a + Math.PI / 6)));
  }

  // 6 PO4 tetrahedra: alternating above/below midplane
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const y = (i % 2 === 0 ? 1 : -1) * 1.0;
    po4.push(new THREE.Vector3(1.6 * Math.cos(a), y, 1.6 * Math.sin(a)));
  }

  return { ca, po4 };
}

export function PosnerMolecule({ spoons, calcium }: PosnerMoleculeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { ca, po4 } = useMemo(() => buildPosnerPositions(), []);

  const bondGeos = useMemo(() =>
    ca.slice(0, 6).map((caPos, i) => {
      const geo = new THREE.BufferGeometry().setFromPoints([caPos, po4[i % 6]]);
      return geo;
    }),
  [ca, po4]);

  useEffect(() => () => { bondGeos.forEach(g => g.dispose()); }, [bondGeos]);

  const isLow = spoons <= 4;
  const isCritical = calcium !== undefined && calcium < 8.0;

  const caColor  = isCritical ? '#EF4444' : '#cda852';
  const po4Color = '#9B59B6';
  const starSpeed = isLow ? 3 : 1;

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * (isLow ? 0.4 : 0.15);
    if (isLow) {
      groupRef.current.rotation.x += delta * 0.08;
    }
  });

  return (
    <group>
      <Stars radius={80} depth={40} count={4000} factor={3} saturation={0} fade speed={starSpeed} />

      <group ref={groupRef}>
        {/* Ca2+ ions — amber glass orbs */}
        {ca.map((pos, i) => (
          <Float key={`ca-${i}`} speed={isLow ? 5 : 1.5} floatIntensity={isLow ? 0.8 : 0.3} position={pos}>
            <mesh>
              <sphereGeometry args={[0.13, 20, 20]} />
              <MeshTransmissionMaterial
                backside
                thickness={0.4}
                roughness={0.05}
                transmission={1}
                ior={1.4}
                chromaticAberration={isCritical ? 0.6 : 0.2}
                color={caColor}
                transparent
              />
            </mesh>
            {/* Inner glow */}
            <mesh>
              <sphereGeometry args={[0.07, 12, 12]} />
              <meshBasicMaterial color={caColor} toneMapped={false} blending={THREE.AdditiveBlending} />
            </mesh>
          </Float>
        ))}

        {/* PO4³⁻ ions — violet glass tetrahedra */}
        {po4.map((pos, i) => (
          <Float key={`po4-${i}`} speed={isLow ? 4 : 1} floatIntensity={0.2} position={pos}>
            <mesh rotation={[Math.PI / 4, (i / 6) * Math.PI * 2, 0]}>
              <tetrahedronGeometry args={[0.18, 0]} />
              <MeshTransmissionMaterial
                backside
                thickness={0.3}
                roughness={0.08}
                transmission={1}
                ior={1.3}
                chromaticAberration={0.15}
                color={po4Color}
                transparent
              />
            </mesh>
            <mesh rotation={[Math.PI / 4, (i / 6) * Math.PI * 2, 0]}>
              <tetrahedronGeometry args={[0.09, 0]} />
              <meshBasicMaterial color={po4Color} toneMapped={false} blending={THREE.AdditiveBlending} />
            </mesh>
          </Float>
        ))}

        {/* Bond lines Ca → PO4 */}
        {bondGeos.map((geo, i) => (
          <line key={`bond-${i}`}>
            <primitive attach="geometry" object={geo} />
            <lineBasicMaterial
              color={caColor}
              transparent
              opacity={isLow ? 0.5 : 0.2}
              blending={THREE.AdditiveBlending}
            />
          </line>
        ))}
      </group>
    </group>
  );
}

export default PosnerMolecule;
