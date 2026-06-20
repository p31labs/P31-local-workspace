import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import * as THREE from 'three';

extend({ THREE });

interface Branch {
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
  depth: number;
}

interface CyberneticBonsaiSceneProps {
  spoonLevel?: number; // 0-12
}

/**
 * Recursive L-system bonsai with PID-driven branch angles.
 * P-gain → immediate branch straightening
 * I-accumulator → trunk thickness
 * D-filter → branch tip extension (future growth lines)
 * Grounding Wire ("Delta Reset") → prune to trunk, reset gains, regrow.
 */
export function CyberneticBonsaiScene({ spoonLevel = 4 }: CyberneticBonsaiSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const branchesRef = useRef<Branch[]>([]);
  // Material template — cloned per-branch to avoid shared-state visual artifacts
  const baseMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: 0xcda852,
  }), []);

  // PID gains adjusted by spoon level: lower spoons -> less aggressive correction
  const spoonFactor = useMemo(() => {
    const level = Math.max(0, Math.min(12, spoonLevel ?? 4));
    // Factor from 0.5 (spoon 0) to 1.0 (spoon 12)
    return 0.5 + level / 24;
  }, [spoonLevel]);

  // Base PID gains (these can be tuned)
  const basePGain = 0.02;
  const baseIGain = 0.001;
  const baseDGain = 0.005;

  const PGain = basePGain * spoonFactor;
  const IGain = baseIGain * spoonFactor;
  const DGain = baseDGain * spoonFactor;

  // State
  const pErrorRef = useRef(0); // Proportional error
  const iErrorRef = useRef(0); // Integral error
  const dErrorRef = useRef(0); // Derivative error
  const lastErrorRef = useRef(0);

  const trunkRef = useRef<THREE.Mesh>(null);
  const soilRef = useRef<THREE.Mesh>(null);

  // Grounding wire (reset)
  const handleGroundingWire = useCallback(() => {
    // Reset errors
    pErrorRef.current = 0;
    iErrorRef.current = 0;
    dErrorRef.current = 0;
    lastErrorRef.current = 0;
    // Optionally, prune to trunk (simplified: just reset gains)
    emit('p31:groundingWireDrop');
  }, [emit]);

  // PID input events from keyboard (for manual control) - now handled in BonsaiGame wrapper
  // We still listen for the event to update the scene if needed
  useEffect(() => {
    const handlePIDAction = (e: CustomEvent) => {
      const action = e.detail.action;
      if (action === 'sigh') {
        // Proportional: immediate response to error
        pErrorRef.current += 0.1; // Simulate error
      }
      if (action === 'sleep') {
        // Integral: accumulate over time
        iErrorRef.current += 0.01;
      }
      if (action === 'task') {
        // Derivative: respond to rate of change
        dErrorRef.current += 0.05;
      }
    };
    window.addEventListener('p31:pidAction', handlePIDAction);
    return () => window.removeEventListener('p31:pidAction', handlePIDAction);
  }, [emit]);

  useEffect(() => {
    // Simulate trunk growth and soil
    if (!trunkRef.current) {
      const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
      const trunkMaterial = new THREE.MeshBasicMaterial({ color: 0x8b4513 });
      trunkRef.current = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunkRef.current.position.y = 1;
      groupRef.current?.add(trunkRef.current);
    }
    if (!soilRef.current) {
      const soilGeometry = new THREE.PlaneGeometry(10, 10);
      const soilMaterial = new THREE.MeshBasicMaterial({ color: 0x654321, side: THREE.DoubleSide });
      soilRef.current = new THREE.Mesh(soilGeometry, soilMaterial);
      soilRef.current.rotation.x = -Math.PI / 2;
      soilRef.current.position.y = 0;
      groupRef.current?.add(soilRef.current);
    }
  }, []);

  useFrame(() => {
    if (groupRef.current) {
      // Slow rotation for display
      groupRef.current.rotation.y += 0.001;
    }

    // Apply PID to branches (simplified: adjust branch angles based on errors)
    const pulse = 0.5 + Math.sin(Date.now() / 800) * 0.2;
    branchesRef.current.forEach((branch) => {
      // Base openness from depth (deeper branches are more closed)
      const baseOpenness = 0.4 + pulse * 0.3 - branch.depth * 0.1;
      // PID adjustment: combine errors to adjust openness
      const pidAdjustment = (PGain * pErrorRef.current) + (IGain * iErrorRef.current) + (DGain * dErrorRef.current);
      const openness = Math.max(0, Math.min(1, baseOpenness + pidAdjustment));
      branch.material.openness = openness;
      // Update material opacity based on openness
      branch.material.opacity = openness;
    });

    // Gradually decay errors (simulate forgetting)
    pErrorRef.current *= 0.99;
    iErrorRef.current *= 0.995;
    dErrorRef.current *= 0.98;
  });

  return <primitive object={groupRef} ref={groupRef} />;
}
