import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useShipStore } from '../store/shipStore';
import NeoPixelFrame from './NeoPixelFrame';
import { regularTetra } from '../math/geometry';
import { useAdaptiveQuality, useShouldAnimate } from '../hooks/useAdaptiveQuality';

const DOME_RADIUS = 12;
const PORT_COUNT = 120;
const TETRA_SCALE = DOME_RADIUS * 0.55;

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

export default function OuterDome({ children }: { children?: React.ReactNode }) {
  const { spoons, coherence, dockedPorts, selectedPort } = useShipStore();
  const groupRef = useRef<THREE.Group>(null);
  const tetraRef = useRef<THREE.InstancedMesh>(null);
  const portsRef = useRef<THREE.InstancedMesh>(null);
  const time = useRef(0);
  const shouldAnimate = useShouldAnimate(spoons);
  const adaptive = useAdaptiveQuality();

  const portPositions = useMemo(() => generatePortPositions(DOME_RADIUS, PORT_COUNT), []);
  const tetraFrame = useMemo(() => regularTetra(TETRA_SCALE), []);

  const edgePairs = useMemo(
    () => [
      [0, 1] as [number, number],
      [0, 2] as [number, number],
      [0, 3] as [number, number],
      [1, 2] as [number, number],
      [1, 3] as [number, number],
      [2, 3] as [number, number],
    ],
    [],
  );

  useEffect(() => {
    const mesh = tetraRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion();
    const dir = new THREE.Vector3();
    const mid = new THREE.Vector3();

    edgePairs.forEach(([i, j], idx) => {
      const a = new THREE.Vector3(...tetraFrame[`v${i}` as 'v0']);
      const b = new THREE.Vector3(...tetraFrame[`v${j}` as 'v0']);
      dir.subVectors(b, a);
      const len = dir.length();
      mid.addVectors(a, b).multiplyScalar(0.5);
      quat.setFromUnitVectors(up, dir.normalize());
      dummy.position.copy(mid);
      dummy.quaternion.copy(quat);
      dummy.scale.set(1, len, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(idx, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [edgePairs, tetraFrame]);

  useEffect(() => {
    const mesh = portsRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const tempColor = new THREE.Color();

    portPositions.forEach((pos, i) => {
      const innerPos = pos.clone().normalize().multiplyScalar(DOME_RADIUS * 0.88);
      dummy.position.copy(innerPos);
      dummy.lookAt(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      const isDocked = dockedPorts.includes(i);
      const isSelected = selectedPort === i;
      tempColor.set(isSelected ? 0xffffff : isDocked ? 0xf59e0b : 0x88aacc);
      mesh.setColorAt(i, tempColor);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [portPositions, dockedPorts, selectedPort]);

  useFrame(({ clock }) => {
    time.current = clock.getElapsedTime();
    if (!groupRef.current || !shouldAnimate) return;

    const speed = 0.0002 * (0.5 + 0.5 * (spoons / 5));
    groupRef.current.rotation.y += speed;
  });

  return (
    <group ref={groupRef}>
      <NeoPixelFrame segmentCount={adaptive.neoPixelSegments} />

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

      <instancedMesh ref={tetraRef} args={[undefined, undefined, 6]}>
        <cylinderGeometry args={[0.035, 0.035, 1, 6, 1, false]} />
        <meshBasicMaterial
          color={0xff9944}
          transparent
          opacity={0.1 + 0.3 * coherence}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>

      <instancedMesh ref={portsRef} args={[undefined, undefined, PORT_COUNT]}>
        <tetrahedronGeometry args={[0.45, 0]} />
        <meshStandardMaterial
          color={0x88aacc}
          emissive={0x88aacc}
          emissiveIntensity={0.15}
          roughness={0.2}
          metalness={0.5}
          toneMapped={false}
        />
      </instancedMesh>

      {children}
    </group>
  );
}
