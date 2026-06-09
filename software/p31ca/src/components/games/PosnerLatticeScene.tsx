import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * PosnerLatticeScene: icosahedral Fibonacci sphere distribution.
 * Decoherence drives jitter amplitude and emissive color (cyan → amber → coral).
 * Listens for 'p31:freezeBreakComplete' to reset decoherence to 0.
 */
export function PosnerLatticeScene({ 
  initialDecoherence = 0.5, 
  particleCount = 3000 
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useRef(new THREE.Object3D()).current;
  const [decoherence, setDecoherence] = useState(initialDecoherence);
  
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
  
  // Cleanup geometries and materials on unmount
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  // Freeze-break collapse → reset decoherence to 0, then slow ramp back to ~0.5
  useEffect(() => {
    const onCollapse = () => {
      setDecoherence(0);
      let progress = 0;
      const ramp = () => {
        progress += 0.01;
        setDecoherence(prev => {
          const next = Math.min(prev + 0.003, 0.5);
          if (next >= 0.5) return 0.5;
          return next;
        });
        if (progress < 2.0) {  // ~2 seconds at 60fps (~120 frames)
          requestAnimationFrame(ramp);
        }
      };
      setTimeout(ramp, 500);
    };
    window.addEventListener('p31:freezeBreakComplete', onCollapse);
    return () => window.removeEventListener('p31:freezeBreakComplete', onCollapse);
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;
    
    const mesh = meshRef.current;
    const time = performance.now() / 1000;
    const mat = mesh.material as THREE.MeshPhysicalMaterial;
    
    // Emissive hue: cyan (~0.5) → amber (~0.12) → coral (~0.05)
    const hue = Math.max(0.05, 0.5 - decoherence * 0.5);
    mat.emissive.setHSL(hue, 0.9, 0.6);
    
    let instanceIdx = 0;
    const phiSpan = Math.PI * (3 - Math.sqrt(5)); // golden angle ≈ 2.39996 rad
    for (let i = 0; i < particleCount; i++) {
      // Icosahedral Fibonacci sphere: uniform distribution via golden-angle spiral
      const phi = Math.acos(1 - 2 * (i + 0.5) / particleCount);
      const theta = phiSpan * i;
      const r = 1.0;
      let x = r * Math.sin(phi) * Math.cos(theta);
      let y = r * Math.sin(phi) * Math.sin(theta);
      let z = r * Math.cos(phi);
      
      // Perlin-like noise (sin/cos combos), amplitude = decoherence
      const ns = decoherence * 0.5;
      x += Math.sin(time * 0.5 + i * 0.13) * ns;
      y += Math.cos(time * 0.37 + i * 0.17) * ns;
      z += Math.sin(time * 0.61 + i * 0.23) * ns;
      
      // Scale: thermodynamic expansion metaphor
      const scale = 0.6 + (1 - decoherence) * 0.6;
      
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(instanceIdx++, dummy.matrix);
    }
    
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <primitive 
      object={new THREE.InstancedMesh(geometry, material, particleCount)} 
      ref={meshRef}
      frustumCulled={false}
    />
  );
}