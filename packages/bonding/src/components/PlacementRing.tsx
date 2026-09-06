// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// PlacementRing: expanding light ring on atom placement
//
// When a new atom is placed, an expanding torus + spray
// of 8 tiny particles burst outward from the position.
// ═══════════════════════════════════════════════════════

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ELEMENTS } from '../data/elements';
import { useGameStore } from '../store/gameStore';

const RING_DURATION = 0.7;
const SPRAY_COUNT = 8;

interface ActiveRing {
  startTime: number;
  position: THREE.Vector3;
  color: THREE.Color;
  sprayDirs: THREE.Vector3[];
}

// Shared geometries
const TORUS_GEO = new THREE.TorusGeometry(0.5, 0.015, 8, 32);
const SPRAY_GEO = new THREE.SphereGeometry(0.025, 6, 6);

export function PlacementRing() {
  const atoms = useGameStore((s) => s.atoms);
  const gamePhase = useGameStore((s) => s.gamePhase);
  const prevAtomCount = useRef(atoms.length);
  const ringsRef = useRef<ActiveRing[]>([]);
  const torusRef = useRef<THREE.Mesh>(null);
  const sprayRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useRef(new THREE.Object3D()).current;

  // Detect new atom placements
  useEffect(() => {
    if (atoms.length > prevAtomCount.current && gamePhase !== 'complete') {
      const newest = atoms[atoms.length - 1];
      const pos = new THREE.Vector3(newest.position.x, newest.position.y, newest.position.z);
      const color = new THREE.Color(ELEMENTS[newest.element].emissive);

      // Generate spray directions (ring pattern in XZ plane)
      const sprayDirs: THREE.Vector3[] = [];
      for (let i = 0; i < SPRAY_COUNT; i++) {
        const angle = (i / SPRAY_COUNT) * Math.PI * 2;
        sprayDirs.push(new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)));
      }

      ringsRef.current.push({
        startTime: performance.now() / 1000,
        position: pos,
        color,
        sprayDirs,
      });
    }
    prevAtomCount.current = atoms.length;
  }, [atoms, gamePhase]);

  useFrame((state) => {
    const now = state.clock.elapsedTime;
    const alive: ActiveRing[] = [];

    // Process most recent ring for torus
    const activeRing = ringsRef.current.find((r) => now - r.startTime < RING_DURATION);

    if (torusRef.current) {
      if (activeRing) {
        const age = now - activeRing.startTime;
        const t = age / RING_DURATION;
        const scale = 0.2 + t * 2.0; // Expand from 0.2 to 2.2
        const opacity = 0.6 * (1 - t * t); // Fade with ease-in

        torusRef.current.visible = true;
        torusRef.current.position.copy(activeRing.position);
        torusRef.current.scale.setScalar(scale);
        const mat = torusRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = opacity;
        mat.color.copy(activeRing.color);
      } else {
        torusRef.current.visible = false;
      }
    }

    // Process spray particles
    if (sprayRef.current) {
      const mesh = sprayRef.current;
      let idx = 0;

      for (const ring of ringsRef.current) {
        const age = now - ring.startTime;
        if (age > RING_DURATION) continue;
        alive.push(ring);

        const t = age / RING_DURATION;
        const eased = 1 - Math.pow(1 - t, 2);

        for (let i = 0; i < SPRAY_COUNT; i++) {
          if (idx >= 32) break;
          const dir = ring.sprayDirs[i];
          const dist = eased * 1.5;
          const opacity = 1 - t;

          dummy.position.set(
            ring.position.x + dir.x * dist,
            ring.position.y + dir.y * dist,
            ring.position.z + dir.z * dist,
          );
          dummy.scale.setScalar(opacity * 0.8);
          dummy.updateMatrix();
          mesh.setMatrixAt(idx, dummy.matrix);
          mesh.setColorAt(idx, ring.color.clone().multiplyScalar(opacity * 2));
          idx++;
        }
      }

      // Hide unused
      for (let i = idx; i < 32; i++) {
        dummy.position.set(0, 0, -1000);
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }

      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }

    ringsRef.current = alive.length > 0 ? alive : ringsRef.current.filter((r) => now - r.startTime < RING_DURATION);
  });

  return (
    <>
      {/* Expanding torus ring */}
      <mesh ref={torusRef} geometry={TORUS_GEO} visible={false} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Spray particles */}
      <instancedMesh
        ref={sprayRef}
        args={[SPRAY_GEO, undefined, 32]}
        frustumCulled={false}
      >
        <meshBasicMaterial
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>
    </>
  );
}
