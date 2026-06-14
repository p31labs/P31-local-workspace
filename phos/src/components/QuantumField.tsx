import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

const COUNT = 150;

interface ParticleFieldProps {
  spoonLevel: number;
  decoherence: number;
  superpositionMode: boolean;
  onEntanglementUpdate?: (count: number) => void;
}

const ParticleField = ({ spoonLevel, decoherence, superpositionMode, onEntanglementUpdate }: ParticleFieldProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const ghostsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 18;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 12;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    return arr;
  }, []);

  const velocities = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 0.3;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    }
    return arr;
  }, []);

  const colors = useMemo(() => {
    const cols = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      cols[i * 3] = 0.2 + Math.random() * 0.5;
      cols[i * 3 + 1] = 0.3 + Math.random() * 0.5;
      cols[i * 3 + 2] = 0.5 + Math.random() * 0.5;
    }
    return cols;
  }, []);

  const ghostPositions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3] = positions[i * 3] + (Math.random() - 0.5) * 3;
      arr[i * 3 + 1] = positions[i * 3 + 1] + (Math.random() - 0.5) * 3;
      arr[i * 3 + 2] = positions[i * 3 + 2] + (Math.random() - 0.5) * 3;
    }
    return arr;
  }, [positions]);

  const [entanglements, setEntanglements] = useState<Map<number, number>>(new Map());
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const positionsRef = useRef(positions);

  useEffect(() => {
    onEntanglementUpdate?.(Math.floor(entanglements.size / 2));
  }, [entanglements, onEntanglementUpdate]);

  const handleParticleClick = useCallback((index: number) => {
    setSelectedIdx(prev => {
      if (prev === null) return index;
      if (prev === index) return null;
      setEntanglements(prevMap => {
        const next = new Map(prevMap);
        next.set(prev, index);
        next.set(index, prev);
        return next;
      });
      return null;
    });
  }, []);

  useFrame((state, delta) => {
    const speedFactor = 0.3 + (spoonLevel / 5) * 1.2;

    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3;

      velocities[ix] += (Math.random() - 0.5) * 0.02 * speedFactor;
      velocities[ix + 1] += (Math.random() - 0.5) * 0.02 * speedFactor;
      velocities[ix + 2] += (Math.random() - 0.5) * 0.02 * speedFactor;

      const drag = 1 - decoherence * 0.15;
      velocities[ix] *= drag;
      velocities[ix + 1] *= drag;
      velocities[ix + 2] *= drag;

      const maxVel = 1.0;
      for (let j = 0; j < 3; j++) {
        velocities[ix + j] = Math.max(-maxVel, Math.min(maxVel, velocities[ix + j]));
        positionsRef.current[ix + j] += velocities[ix + j] * delta * 1.5;
      }

      const bound = 9;
      for (let j = 0; j < 3; j++) {
        if (Math.abs(positionsRef.current[ix + j]) > bound) {
          velocities[ix + j] *= -0.8;
          positionsRef.current[ix + j] = Math.sign(positionsRef.current[ix + j]) * bound;
        }
      }
    }

    entanglements.forEach((partner, idx) => {
      if (idx < partner) {
        const a = idx * 3;
        const b = partner * 3;
        const mid = (spoonLevel / 5) * 0.5 + 0.25;
        for (let j = 0; j < 3; j++) {
          const avg = positionsRef.current[a + j] * mid + positionsRef.current[b + j] * (1 - mid);
          positionsRef.current[b + j] = avg;
          positionsRef.current[a + j] = avg;
        }
      }
    });

    if (superpositionMode) {
      for (let i = 0; i < COUNT; i++) {
        const ix = i * 3;
        ghostPositions[ix] += (Math.random() - 0.5) * 0.08 * speedFactor;
        ghostPositions[ix + 1] += (Math.random() - 0.5) * 0.08 * speedFactor;
        ghostPositions[ix + 2] += (Math.random() - 0.5) * 0.08 * speedFactor;
        for (let j = 0; j < 3; j++) {
          if (Math.abs(ghostPositions[ix + j]) > 10) {
            ghostPositions[ix + j] = Math.sign(ghostPositions[ix + j]) * 10;
          }
        }
      }
    }

    if (pointsRef.current?.geometry?.attributes?.position) {
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
    if (ghostsRef.current?.geometry?.attributes?.position && superpositionMode) {
      ghostsRef.current.geometry.attributes.position.needsUpdate = true;
    }

    if (linesRef.current) {
      const verts: number[] = [];
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.3 + 0.7;
      entanglements.forEach((partner, idx) => {
        if (idx < partner) {
          const a = idx * 3;
          const b = partner * 3;
          verts.push(positionsRef.current[a], positionsRef.current[a + 1], positionsRef.current[a + 2]);
          verts.push(positionsRef.current[b], positionsRef.current[b + 1], positionsRef.current[b + 2]);
        }
      });
      if (verts.length > 0) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
        if (linesRef.current.geometry) linesRef.current.geometry.dispose();
        linesRef.current.geometry = geo;
        (linesRef.current.material as THREE.LineBasicMaterial).opacity = pulse * 0.6;
      }
    }
  });

  const lineColor = spoonLevel > 3 ? 0x44ffcc : 0x4488ff;

  return (
    <>
      <group ref={pointsRef}>
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" array={positionsRef.current} count={COUNT} itemSize={3} />
            <bufferAttribute attach="attributes-color" array={colors} count={COUNT} itemSize={3} />
          </bufferGeometry>
          <PointMaterial
            size={0.18}
            vertexColors
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
            sizeAttenuation
          />
        </points>
      </group>

      {superpositionMode && (
        <points ref={ghostsRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" array={ghostPositions} count={COUNT} itemSize={3} />
          </bufferGeometry>
          <PointMaterial
            size={0.1}
            color="#88ccff"
            transparent
            opacity={0.35}
            blending={THREE.AdditiveBlending}
            sizeAttenuation
          />
        </points>
      )}

      <lineSegments ref={linesRef}>
        <bufferGeometry />
        <lineBasicMaterial color={lineColor} transparent opacity={0.6} />
      </lineSegments>
    </>
  );
};

interface QuantumFieldProps {
  spoonLevel?: number;
  decoherence?: number;
  superpositionMode?: boolean;
  onEntanglementCountChange?: (count: number) => void;
}

export const QuantumField = ({
  spoonLevel = 3,
  decoherence = 0.2,
  superpositionMode = false,
  onEntanglementCountChange,
}: QuantumFieldProps) => {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 16], fov: 60 }}
        style={{ pointerEvents: 'auto' }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        <ParticleField
          spoonLevel={spoonLevel}
          decoherence={decoherence}
          superpositionMode={superpositionMode}
          onEntanglementUpdate={onEntanglementCountChange}
        />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} />
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/30 pointer-events-none" />
    </div>
  );
};
