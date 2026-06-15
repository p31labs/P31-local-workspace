import { useEffect, useState, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { ArtifactNode } from './ArtifactNode';
import type { ArtifactData } from './ArtifactNode';

const STAGE_ORDER = ['SEED', 'SPROUT', 'SAPLING', 'BLOOM', 'FRUIT'] as const;
const STAGE_RING_RADIUS: Record<string, number> = {
  SEED: 2.5,
  SPROUT: 4,
  SAPLING: 5.5,
  BLOOM: 7,
  FRUIT: 8.5,
};

interface GradingIndex {
  meta: {
    spoon_level: number;
    depressed_artifacts: number;
    entanglement_pairs: number;
    total_artifacts: number;
  };
  artifacts: Array<{
    name: string;
    stage: string;
    overall: number;
    weakest: string[];
    depressed: boolean;
    scores: Record<string, number>;
  }>;
}

interface SpoonState {
  level: number;
}

function SpoonGaugeRing({ level, maxLevel = 5 }: { level: number; maxLevel?: number }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const color = level >= 4 ? '#22d3ee' : level >= 2 ? '#fbbf24' : '#F44336';

  const geometry = useMemo(() => new THREE.RingGeometry(0.3, 0.38, 64), []);

  useFrame(({ clock }) => {
    if (ringRef.current) {
      ringRef.current.rotation.x = Math.PI / 2;
      ringRef.current.rotation.z = clock.getElapsedTime() * 0.2;
    }
  });

  return (
    <group position={[0, 3.5, 0]}>
      <mesh ref={ringRef} geometry={geometry}>
        <meshBasicMaterial color={color} transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      <Text
        position={[0, -0.5, 0]}
        fontSize={0.15}
        color="#d8d6d0"
        anchorX="center"
        anchorY="top"
      >
        {`SPOONS: ${level}/${maxLevel}`}
      </Text>
    </group>
  );
}

export function MaturityDashboard() {
  const [gradingData, setGradingData] = useState<GradingIndex | null>(null);
  const [spoonLevel, setSpoonLevel] = useState<number>(4);
  const [entanglements, setEntanglements] = useState<Array<[string, string]>>([]);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [gradingRes, spoonRes, entRes] = await Promise.all([
          fetch('/grading-index.json'),
          fetch('/spoon-state.json'),
          fetch('/jitterbug-entanglements.json').catch(() => null),
        ]);

        if (cancelled) return;

        if (gradingRes.ok) {
          const json: GradingIndex = await gradingRes.json();
          setGradingData(json);
          setSpoonLevel(json.meta.spoon_level);
        }

        if (spoonRes.ok) {
          const json: SpoonState = await spoonRes.json();
          setSpoonLevel(json.level);
        }

        if (entRes && entRes.ok) {
          const json = await entRes.json();
          if (Array.isArray(json.entanglements)) {
            setEntanglements(json.entanglements);
          }
        }
      } catch {
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const coreRadius = 0.6;

  const nodesByStage = useMemo(() => {
    if (!gradingData) return new Map<string, ArtifactData[]>();
    const map = new Map<string, ArtifactData[]>();
    for (const stage of STAGE_ORDER) map.set(stage, []);
    for (const a of gradingData.artifacts) {
      const list = map.get(a.stage);
      if (list) list.push(a);
    }
    return map;
  }, [gradingData]);

  const artifactPositions = useMemo(() => {
    const positions = new Map<string, THREE.Vector3>();
    for (const [stage, artifacts] of nodesByStage) {
      const radius = STAGE_RING_RADIUS[stage] ?? 3;
      const count = artifacts.length;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        positions.set(artifacts[i].name, new THREE.Vector3(x, 0, z));
      }
    }
    return positions;
  }, [nodesByStage]);

  const averageScore = useMemo(() => {
    if (!gradingData || gradingData.artifacts.length === 0) return 0;
    const sum = gradingData.artifacts.reduce((acc, a) => acc + a.overall, 0);
    return sum / gradingData.artifacts.length;
  }, [gradingData]);

  const coreColor = averageScore >= 4 ? '#22d3ee' : averageScore >= 2 ? '#fbbf24' : '#F44336';

  const coreGeometry = useMemo(() => new THREE.SphereGeometry(1, 32, 32), []);
  const coreMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: coreColor,
    emissive: coreColor,
    emissiveIntensity: 0.8,
    roughness: 0.1,
    metalness: 0.9,
  }), [coreColor]);

  const glowGeometry = useMemo(() => new THREE.SphereGeometry(1, 16, 16), []);
  const glowMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: coreColor,
    transparent: true,
    opacity: 0.15,
    side: THREE.BackSide,
  }), [coreColor]);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.2;
    }
  });

  if (!gradingData) return null;

  return (
    <>
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minDistance={3}
        maxDistance={25}
        autoRotate={false}
      />
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1.0} color={0x22d3ee} />
      <pointLight position={[-10, -5, -10]} intensity={0.5} color={0x7A27FF} />

      <group ref={groupRef}>
        <mesh geometry={coreGeometry} material={coreMaterial} scale={[coreRadius, coreRadius, coreRadius]} />
        <mesh geometry={glowGeometry} material={glowMaterial} scale={[coreRadius * 1.8, coreRadius * 1.8, coreRadius * 1.8]} />

        <Text
          position={[0, coreRadius + 0.4, 0]}
          fontSize={0.15}
          color="#d8d6d0"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {`Avg: ${averageScore.toFixed(2)}`}
        </Text>

        <SpoonGaugeRing level={spoonLevel} />

        {Array.from(nodesByStage.entries()).map(([stage, artifacts]) => (
          artifacts.map((a) => {
            const pos = artifactPositions.get(a.name);
            if (!pos) return null;
            return (
              <ArtifactNode key={a.name} data={a} position={pos} />
            );
          })
        ))}
      </group>
    </>
  );
}

export default MaturityDashboard;
