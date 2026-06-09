// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// CompletionBurst: 3D particle supernova on molecule completion
//
// 80 particles burst outward from molecule centroid.
// Element-colored, additive blending, gravity + fade.
// Triggered on gamePhase → 'complete'.
// ═══════════════════════════════════════════════════════

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ELEMENTS } from '../data/elements';
import { useGameStore } from '../store/gameStore';

const PARTICLE_COUNT = 80;
const BURST_DURATION = 1.8; // seconds
const GRAVITY = -1.5;
const PARTICLE_GEO = new THREE.SphereGeometry(0.04, 6, 6);

interface BurstParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  life: number;
  maxLife: number;
}

function createBurst(
  centroid: THREE.Vector3,
  elementColors: THREE.Color[],
): BurstParticle[] {
  const particles: BurstParticle[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Random direction on unit sphere
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const speed = 2 + Math.random() * 3;
    const vx = Math.sin(phi) * Math.cos(theta) * speed;
    const vy = Math.sin(phi) * Math.sin(theta) * speed;
    const vz = Math.cos(phi) * speed;

    const life = BURST_DURATION * (0.6 + Math.random() * 0.4);
    const color = elementColors[Math.floor(Math.random() * elementColors.length)].clone();

    particles.push({
      position: centroid.clone(),
      velocity: new THREE.Vector3(vx, vy, vz),
      color,
      life,
      maxLife: life,
    });
  }
  return particles;
}

export function CompletionBurst() {
  const gamePhase = useGameStore((s) => s.gamePhase);
  const atoms = useGameStore((s) => s.atoms);
  const prevPhaseRef = useRef(gamePhase);
  const [active, setActive] = useState(false);
  const particlesRef = useRef<BurstParticle[]>([]);
  const meshesRef = useRef<THREE.InstancedMesh | null>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Detect phase transition to 'complete'
  useEffect(() => {
    if (gamePhase === 'complete' && prevPhaseRef.current !== 'complete' && atoms.length > 0) {
      // Compute centroid
      const cx = atoms.reduce((s, a) => s + a.position.x, 0) / atoms.length;
      const cy = atoms.reduce((s, a) => s + a.position.y, 0) / atoms.length;
      const cz = atoms.reduce((s, a) => s + a.position.z, 0) / atoms.length;
      const centroid = new THREE.Vector3(cx, cy, cz);

      // Gather element colors
      const colors = atoms.map((a) => new THREE.Color(ELEMENTS[a.element].emissive));

      particlesRef.current = createBurst(centroid, colors);
      setActive(true);
    }
    prevPhaseRef.current = gamePhase;
  }, [gamePhase, atoms]);

  useFrame((_, delta) => {
    if (!active || !meshesRef.current) return;
    const mesh = meshesRef.current;
    const particles = particlesRef.current;
    let anyAlive = false;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.life <= 0) {
        dummy.position.set(0, 0, -1000);
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        continue;
      }

      anyAlive = true;
      p.life -= delta;
      p.velocity.y += GRAVITY * delta;
      p.position.addScaledVector(p.velocity, delta);

      const t = 1 - p.life / p.maxLife;
      const scale = 1 - t * t; // Shrink with ease-in
      const opacity = 1 - t;

      dummy.position.copy(p.position);
      dummy.scale.setScalar(scale * 0.8);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      // Color with fade
      const color = p.color.clone().multiplyScalar(opacity * 2);
      mesh.setColorAt(i, color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    if (!anyAlive) {
      setActive(false);
      particlesRef.current = [];
    }
  });

  if (!active) return null;

  return (
    <instancedMesh
      ref={meshesRef}
      args={[PARTICLE_GEO, undefined, PARTICLE_COUNT]}
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
