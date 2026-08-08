import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useShipStore } from '../store/shipStore';
import NeoPixelFrame from './NeoPixelFrame';
import { regularTetra } from '../math/geometry';

const DOME_RADIUS = 12;
const PORT_COUNT = 120;

function generatePortPositions(radius: number, count: number): THREE.Vector3[] {
  const geo = new THREE.IcosahedronGeometry(radius, 3);
  const pos = geo.getAttribute('position');
  const idx = geo.getIndex();
  if (!idx) return [];

  const verts: THREE.Vector3[] = [];
  for (let i = 0; i < pos.count; i++) {
    verts.push(new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)));
  }

  const centroids: THREE.Vector3[] = [];
  for (let i = 0; i < idx.count; i += 3) {
    const a = idx.getX(i);
    const b = idx.getX(i + 1);
    const c = idx.getX(i + 2);
    const centroid = new THREE.Vector3()
      .add(verts[a])
      .add(verts[b])
      .add(verts[c])
      .multiplyScalar(1 / 3);
    centroids.push(centroid);
  }

  centroids.sort((a, b) => a.length() - b.length());
  return centroids.slice(0, count);
}

export default function OuterDome() {
  const { spoons, coherence, dockedPorts, selectedPort } = useShipStore();
  const groupRef = useRef<THREE.Group>(null);
  const time = useRef(0);

  const portPositions = useMemo(() => generatePortPositions(DOME_RADIUS, PORT_COUNT), []);
  const tetraFrame = useMemo(() => regularTetra(DOME_RADIUS * 0.55), []);

  useFrame(({ clock }) => {
    time.current = clock.getElapsedTime();
    if (!groupRef.current) return;

    const speed = 0.0002 * (0.5 + 0.5 * (spoons / 5));
    groupRef.current.rotation.y += speed;
  });

  return (
    <group ref={groupRef}>
      <NeoPixelFrame />

      <mesh>
        <icosahedronGeometry args={[DOME_RADIUS * 0.975, 2]} />
        <meshPhysicalMaterial
          color={0xaaccdd}
          transparent
          opacity={0.35}
          roughness={0.15}
          metalness={0.05}
          ior={1.31}
          transmission={0.3}
          thickness={0.5}
          clearcoat={0.2}
          clearcoatRoughness={0.1}
          attenuationColor={new THREE.Color(0.5, 0.8, 1.0)}
          attenuationDistance={1.0}
          dispersion={0.025}
          side={THREE.DoubleSide}
          depthWrite={false}
          envMapIntensity={1.5}
          toneMapped={false}
        />
      </mesh>

      {/* K4 tetrahedron tensegrity frame — the bones */}
      <group>
        {([[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]] as [number, number][]).map(([i, j], idx) => {
          const a = new THREE.Vector3(...tetraFrame[`v${i}` as 'v0']);
          const b = new THREE.Vector3(...tetraFrame[`v${j}` as 'v0']);
          const mid = a.clone().add(b).multiplyScalar(0.5);
          const dir = b.clone().sub(a);
          const len = dir.length();
          const quat = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            dir.clone().normalize()
          );
          const breathe = 0.7 + 0.3 * Math.sin(time.current * 0.9 + idx * 1.2);
          return (
            <mesh key={idx} position={mid} quaternion={quat}>
              <cylinderGeometry args={[0.035, 0.035, len, 6, 1]} />
              <meshBasicMaterial
                color={0xff9944}
                transparent
                opacity={0.1 + 0.3 * breathe * coherence}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          );
        })}
      </group>

      {portPositions.map((pos, i) => {
        const isDocked = dockedPorts.includes(i);
        const isSelected = selectedPort === i;

        const innerPos = pos.clone().normalize().multiplyScalar(DOME_RADIUS * 0.88);

        let color: number, emissive: number, emissiveIntensity: number, scale: number;
        if (isSelected) {
          color = 0xffffff;
          emissive = 0xffffff;
          emissiveIntensity = 1.0 + 0.2 * Math.sin(time.current * 3);
          scale = 1.0 + 0.08 * Math.sin(time.current * 3);
        } else if (isDocked) {
          color = 0xf59e0b;
          emissive = 0xf59e0b;
          emissiveIntensity = 0.6;
          scale = 1.0;
        } else {
          color = 0x88aacc;
          emissive = 0x88aacc;
          emissiveIntensity = 0.15;
          scale = 1.0;
        }

        return (
          <mesh
            key={i}
            position={innerPos}
            lookAt={[0, 0, 0]}
            scale={scale}
            onClick={(e) => {
              e.stopPropagation();
              useShipStore.getState().setSelectedPort(selectedPort === i ? null : i);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'auto';
            }}
          >
            <tetrahedronGeometry args={[0.45, 0]} />
            <meshStandardMaterial
              color={color}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
              roughness={0.2}
              metalness={0.5}
              toneMapped={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}
