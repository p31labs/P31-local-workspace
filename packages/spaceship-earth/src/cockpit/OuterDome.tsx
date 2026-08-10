import { useMemo, useRef, useEffect, useCallback } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useShipStore } from '../store/shipStore';
import { useDataStore } from '../store/dataStore';
import NeoPixelFrame from './NeoPixelFrame';
import { regularTetra } from '../math/geometry';
import { useAdaptiveQuality, useShouldAnimate } from '../hooks/useAdaptiveQuality';
import { DOME_VERTICES, DOME_FACE_CENTROIDS, assignNodeVertices } from '../math/domeMap';
import { VERTICES } from '@p31/shared';

const DOME_RADIUS = 12;
const PORT_COUNT = 320;
const TETRA_SCALE = DOME_RADIUS * 0.55;

function generatePortPositions(count: number): THREE.Vector3[] {
  return DOME_FACE_CENTROIDS.slice(0, count).map(v => new THREE.Vector3(v[0], v[1], v[2]));
}

export default function OuterDome({ children }: { children?: React.ReactNode }) {
  const { spoons, coherence, dockedPorts, selectedPort, hoveredPort } = useShipStore();
  const setSelectedPort = useShipStore((s) => s.setSelectedPort);
  const setHoveredPort = useShipStore((s) => s.setHoveredPort);
  const setSelectedNode = useShipStore((s) => s.setSelectedNode);
  const setNodeScreenPos = useShipStore((s) => s.setNodeScreenPos);
  const setNodeVisible = useShipStore((s) => s.setNodeVisible);
  const groupRef = useRef<THREE.Group>(null);
  const tetraRef = useRef<THREE.InstancedMesh>(null);
  const portsRef = useRef<THREE.InstancedMesh>(null);
  const time = useRef(0);
  const shouldAnimate = useShouldAnimate(spoons);
  const adaptive = useAdaptiveQuality();

  const portPositions = useMemo(() => generatePortPositions(PORT_COUNT), []);
  const tetraFrame = useMemo(() => regularTetra(TETRA_SCALE), []);

  const nodePositions = useMemo(() => {
    const axisCounts: Record<'body' | 'mesh' | 'forge' | 'shield', number> = { body: 0, mesh: 0, forge: 0, shield: 0 };
    for (const v of VERTICES) {
      const key = v.axis.toLowerCase() as 'body' | 'mesh' | 'forge' | 'shield';
      axisCounts[key]++;
    }
    const vertexIndices = assignNodeVertices(axisCounts);
    return VERTICES.slice(0, 58).map((_, i) => {
      const vi = vertexIndices[i] ?? 0;
      return new THREE.Vector3(...DOME_VERTICES[vi]);
    });
  }, []);

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

  const faceData = useDataStore((s) => s.faceData);
  const hasData = faceData.length > 0;

  useEffect(() => {
    const mesh = portsRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const tempColor = new THREE.Color();

    portPositions.forEach((pos, i) => {
      dummy.position.copy(pos.clone().normalize().multiplyScalar(DOME_RADIUS * 1.02));
      dummy.lookAt(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      const dataPoint = hasData ? faceData[i] : null;

      if (selectedPort === i) tempColor.set(0xffffff);
      else if (hoveredPort === i) tempColor.set(0xffcc44);
      else if (dockedPorts.includes(i)) tempColor.set(0xf59e0b);
      else if (dataPoint && dataPoint.color) tempColor.set(dataPoint.color);
      else tempColor.set(0x88aacc);
      mesh.setColorAt(i, tempColor);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [portPositions, dockedPorts, selectedPort, hoveredPort, faceData, hasData]);

  const handlePortClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.instanceId !== undefined) {
      setSelectedNode(null);
      setSelectedPort(e.instanceId);
    }
  }, [setSelectedPort, setSelectedNode]);

  const handlePortOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (e.instanceId !== undefined) {
      setHoveredPort(e.instanceId);
      document.body.style.cursor = 'pointer';
    }
  }, [setHoveredPort]);

  const handlePortOut = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHoveredPort(null);
    document.body.style.cursor = '';
  }, [setHoveredPort]);

  useFrame(({ clock, camera, size }) => {
    time.current = clock.getElapsedTime();
    if (!groupRef.current || !shouldAnimate) return;

    const speed = 0.0002 * (0.5 + 0.5 * (spoons / 5));
    const { selectedPort, hoveredPort } = useShipStore.getState();
    if (selectedPort === null && hoveredPort === null) {
      groupRef.current.rotation.y += speed;
    }

    const selectedNode = useShipStore.getState().selectedNode;
    if (selectedNode !== null && groupRef.current && selectedNode < nodePositions.length) {
      const localPos = nodePositions[selectedNode];
      const worldPos = localPos.clone();
      groupRef.current.localToWorld(worldPos);
      const projected = worldPos.clone().project(camera);
      const x = (projected.x * 0.5 + 0.5) * size.width;
      const y = (-projected.y * 0.5 + 0.5) * size.height;
      setNodeScreenPos({ x, y });
      setNodeVisible(projected.z < 1);
    } else {
      setNodeVisible(false);
    }
  });

  return (
    <group ref={groupRef} name="outer-dome">
      <NeoPixelFrame segmentCount={adaptive.neoPixelSegments} />

      <mesh raycast={() => null}>
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

      <instancedMesh ref={tetraRef} args={[undefined, undefined, 6]} raycast={() => null}>
        <cylinderGeometry args={[0.035, 0.035, 1, 6, 1, false]} />
        <meshBasicMaterial
          color={0xff9944}
          transparent
          opacity={0.1 + 0.3 * coherence}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>

      <instancedMesh
        ref={portsRef}
        args={[undefined, undefined, PORT_COUNT]}
        onClick={handlePortClick}
        onPointerOver={handlePortOver}
        onPointerOut={handlePortOut}
      >
        <tetrahedronGeometry args={[1.8, 0]} />
        <meshBasicMaterial
          transparent
          opacity={0}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </instancedMesh>

      {children}
    </group>
  );
}
