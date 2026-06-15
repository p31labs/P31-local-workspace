import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';

const STAGE_COLORS: Record<string, string> = {
  SEED: '#8B7355',
  SPROUT: '#4CAF50',
  SAPLING: '#2196F3',
  BLOOM: '#FF9800',
  FRUIT: '#F44336',
};

export interface ArtifactData {
  name: string;
  stage: string;
  overall: number;
  weakest: string[];
  depressed: boolean;
  scores: Record<string, number>;
}

interface ArtifactNodeProps {
  data: ArtifactData;
  position: THREE.Vector3;
}

export function ArtifactNode({ data, position }: ArtifactNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [selected, setSelected] = useState(false);

  const color = STAGE_COLORS[data.stage] ?? '#8B7355';
  const radius = THREE.MathUtils.clamp(0.1 + (data.overall / 5) * 0.4, 0.1, 0.5);

  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.3,
    roughness: 0.4,
    metalness: 0.6,
  }), [color]);

  const geometry = useMemo(() => new THREE.SphereGeometry(1, 24, 24), []);

  const haloGeometry = useMemo(() => new THREE.RingGeometry(0.12, 0.15, 32), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    if (data.depressed && meshRef.current) {
      const pulse = 1 + 0.15 * Math.sin(t * 4);
      meshRef.current.scale.setScalar(pulse);
      if (ringRef.current) {
        ringRef.current.rotation.x = Math.PI / 2;
        ringRef.current.rotation.z = t * 0.5;
      }
    }
    meshRef.current.position.y += 0.005 * Math.sin(t * 0.8 + position.x);
  });

  const tooltipText = `${data.name}
Stage: ${data.stage}
Score: ${data.overall.toFixed(2)}
Weakest: ${data.weakest.join(', ')}`;

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        scale={[radius, radius, radius]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => setSelected(!selected)}
      />
      {data.depressed && (
        <mesh ref={ringRef} geometry={haloGeometry}>
          <meshBasicMaterial color="#F44336" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}
      <Text
        position={[0, radius + 0.3, 0]}
        fontSize={0.08}
        color={color}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {data.name}
      </Text>
      {(hovered || selected) && (
        <Html position={[0, radius + 0.6, 0]} center distanceFactor={8}>
          <div style={{
            background: 'rgba(5,5,5,0.92)',
            border: `1px solid ${color}`,
            borderRadius: 8,
            padding: '6px 10px',
            color: '#d8d6d0',
            fontSize: 10,
            fontFamily: 'monospace',
            whiteSpace: 'pre',
            pointerEvents: 'none',
            lineHeight: 1.5,
          }}>
            {tooltipText}
          </div>
        </Html>
      )}
    </group>
  );
}

export default ArtifactNode;
