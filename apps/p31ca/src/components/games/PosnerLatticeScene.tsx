import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * PosnerLatticeScene: icosahedral Fibonacci sphere distribution.
 * Decoherence drives jitter amplitude and emissive color (cyan → amber → coral).
 * Listens for 'p31:freezeBreakComplete' to reset decoherence to 0.
 * Now also accepts spoonLevel to adjust decoherence and particle count.
 */
export function PosnerLatticeScene({ 
  initialDecoherence = 0.5, 
  particleCount = 3000,
  spoonLevel = 4 
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useRef(new THREE.Object3D()).current;
  
  // Adjust decoherence and particle count based on spoon level
  // Lower spoons -> higher decoherence (more instability), lower particle count (less detail)
  const decoherenceLevel = useMemo(() => {
    const level = Math.max(0, Math.min(12, spoonLevel));
    // Base decoherence increases as spoons decrease: at spoon 0: initialDecoherence * 2, at spoon 12: initialDecoherence * 1
    return initialDecoherence * (2 - level / 12);
  }, [initialDecoherence, spoonLevel]);
  
  const effectiveParticleCount = useMemo(() => {
    const level = Math.max(0, Math.min(12, spoonLevel));
    // At spoon 0: 100 particles (minimum), at spoon 12: particleCount
    return Math.max(100, Math.round(particleCount * (level / 12)));
  }, [particleCount, spoonLevel]);
  
  const [decoherence, setDecoherence] = useState(decoherenceLevel);

  // Geometry + material memoized
  const geometry = useMemo(() => new THREE.SphereGeometry(0.04, 8, 8), []);
  const material = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: 0x4db8a8,
    emissive: 0x4db8a8,
    emissiveIntensity: 1.5,
    transmission: 0.3,
    thickness: 0.5,
    roughness: 0.1,
    metalness: 0.2,
    clearcoat: 0.5,
  }), []);

  // Initialize instances
  useEffect(() => {
    if (meshRef.current) return;
    const mesh = new THREE.InstancedMesh(geometry, material, effectiveParticleCount);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    meshRef.current = mesh;

    // Distribute instances on an icosahedral Fibonacci sphere
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < effectiveParticleCount; i++) {
      const y = 1 - (i / (effectiveParticleCount - 1)) * 2; // y from 1 to -1
      const radius = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      dummy.position.set(x, y, z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [effectiveParticleCount, geometry, material]);

  // Listen for freeze break complete to reset decoherence
  useEffect(() => {
    const handleFreezeBreak = () => setDecoherence(0);
    window.addEventListener('p31:freezeBreakComplete', handleFreezeBreak);
    return () => window.removeEventListener('p31:freezeBreakComplete', handleFreezeBreak);
  }, []);

  // Simulate decoherence over time (increases when not reset)
  useEffect(() => {
    if (decoherence >= 1) return;
    const rate = 0.0005; // per second
    const interval = setInterval(() => {
      setDecoherence(prev => Math.min(1, prev + rate));
    }, 1000);
    return () => clearInterval(interval);
  }, [decoherence]);

  useFrame(() => {
    if (meshRef.current) {
      // Apply decoherence-driven jitter to instances
      const time = performance.now() * 0.001;
      for (let i = 0; i < effectiveParticleCount; i++) {
        const matrix = new THREE.Matrix4();
        // Get base position
        meshRef.current.getMatrixAt(i, matrix);
        // Add jitter based on decoherence
        const jitter = decoherence * 0.1; // max 0.1 units
        const offsetX = (Math.random() * 2 - 1) * jitter;
        const offsetY = (Math.random() * 2 - 1) * jitter;
        const offsetZ = (Math.random() * 2 - 1) * jitter;
        matrix.elements[12] += offsetX;
        matrix.elements[13] += offsetY;
        matrix.elements[14] += offsetZ;
        meshRef.current.setMatrixAt(i, matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;

      // Update emissive color based on decoherence (cyan → amber → coral)
      const emissive = new THREE.Color(0x4db8a8); // cyan
      emissive.lerp(new THREE.Color(0xffa500), decoherence); // amber
      emissive.lerp(new THREE.Color(0xff7f50), decoherence * 0.5); // coral tint
      material.emissive = emissive;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[0, 0, 0]} scale={[10, 10, 10]}>
      <instancedMesh count={effectiveParticleCount}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshPhysicalMaterial
          color={0x4db8a8}
          emissive={0x4db8a8}
          emissiveIntensity={1.5}
          transmission={0.3}
          thickness={0.5}
          roughness={0.1}
          metalness={0.2}
          clearcoat={0.5}
        />
      </instancedMesh>
    </mesh>
  );
}
