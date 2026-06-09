// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// BondSpark: spark traveling along new bonds
//
// When a new bond forms, a bright point travels along
// the bezier curve from one atom to the other.
// Trail of 4 fading points behind it.
// ═══════════════════════════════════════════════════════

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ELEMENTS } from '../data/elements';
import { useGameStore } from '../store/gameStore';

const SPARK_DURATION = 0.5;
const TRAIL_COUNT = 4;
const SPARK_GEO = new THREE.SphereGeometry(0.035, 6, 6);

interface ActiveSpark {
  startTime: number;
  from: THREE.Vector3;
  to: THREE.Vector3;
  mid: THREE.Vector3;
  color: THREE.Color;
}

export function BondSpark() {
  const bonds = useGameStore((s) => s.bonds);
  const atoms = useGameStore((s) => s.atoms);
  const prevBondCount = useRef(bonds.length);
  const sparksRef = useRef<ActiveSpark[]>([]);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useRef(new THREE.Object3D()).current;

  // Detect new bonds
  useEffect(() => {
    if (bonds.length > prevBondCount.current) {
      const newBonds = bonds.slice(prevBondCount.current);
      const now = performance.now() / 1000;

      for (const bond of newBonds) {
        const fromAtom = atoms.find((a) => a.id === bond.from);
        const toAtom = atoms.find((a) => a.id === bond.to);
        if (!fromAtom || !toAtom) continue;

        const from = new THREE.Vector3(fromAtom.position.x, fromAtom.position.y, fromAtom.position.z);
        const to = new THREE.Vector3(toAtom.position.x, toAtom.position.y, toAtom.position.z);
        const mid = from.clone().add(to).multiplyScalar(0.5);
        // Push mid slightly perpendicular for curve
        const dir = to.clone().sub(from).normalize();
        const up = Math.abs(dir.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
        const perp = new THREE.Vector3().crossVectors(dir, up).normalize();
        mid.addScaledVector(perp, 0.15);

        const c1 = new THREE.Color(ELEMENTS[fromAtom.element].emissive);
        const c2 = new THREE.Color(ELEMENTS[toAtom.element].emissive);
        c1.lerp(c2, 0.5);

        sparksRef.current.push({ startTime: now, from, to, mid, color: c1 });
      }
    }
    prevBondCount.current = bonds.length;
  }, [bonds, atoms]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    const now = state.clock.elapsedTime;
    const alive: ActiveSpark[] = [];
    let instanceIdx = 0;

    for (const spark of sparksRef.current) {
      const age = now - spark.startTime;
      if (age > SPARK_DURATION) continue;
      alive.push(spark);

      const progress = age / SPARK_DURATION;
      const eased = 1 - Math.pow(1 - progress, 2); // ease-out

      // Draw trail + head (TRAIL_COUNT + 1 instances per spark)
      for (let t = 0; t <= TRAIL_COUNT; t++) {
        if (instanceIdx >= 50) break;
        const trailOffset = t * 0.06;
        const p = Math.max(0, eased - trailOffset);

        // Quadratic bezier
        const a = (1 - p) * (1 - p);
        const b = 2 * (1 - p) * p;
        const c = p * p;
        const x = a * spark.from.x + b * spark.mid.x + c * spark.to.x;
        const y = a * spark.from.y + b * spark.mid.y + c * spark.to.y;
        const z = a * spark.from.z + b * spark.mid.z + c * spark.to.z;

        const trailOpacity = 1 - t / (TRAIL_COUNT + 1);
        const scale = (t === 0 ? 1.2 : 0.6 * trailOpacity);

        dummy.position.set(x, y, z);
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        mesh.setMatrixAt(instanceIdx, dummy.matrix);

        const color = spark.color.clone().multiplyScalar(trailOpacity * 2);
        mesh.setColorAt(instanceIdx, color);
        instanceIdx++;
      }
    }

    // Hide unused instances
    for (let i = instanceIdx; i < 50; i++) {
      dummy.position.set(0, 0, -1000);
      dummy.scale.setScalar(0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    sparksRef.current = alive;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[SPARK_GEO, undefined, 50]}
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
  );
}
