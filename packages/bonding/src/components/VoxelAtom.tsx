// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// VoxelAtom — Living Wonky Energy Orbs
//
// Three layers, each does one job:
//   1. Body: MeshDistortMaterial — wobbly, semi-transparent,
//      PBR lit. Depth from real light/shadow. See through it.
//   2. Energy: meshBasicMaterial — additive inner glow,
//      scaled down inside the body. The fire inside the glass.
//   3. Rim: meshBasicMaterial + Fresnel — bright edge halo.
//   4. Label: drei Text.
//
// Body is translucent glass. Energy burns inside.
// Rim defines the edge. Together: depth + glow + wonk.
// ═══════════════════════════════════════════════════════

import { useRef, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { Billboard, Float, Text, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import type { ElementData } from '../types';
import { playAtomNote } from '../engine/sound';
import { useGameStore } from '../store/gameStore';
import { BREATHING_PATTERN } from '../config/breathing';

export interface PersonalityAnimationHint {
  speed: number;      // 0–1
  pulse: boolean;
  vibrate: boolean;
  scale: number;      // 0.8–1.5
}

interface VoxelAtomProps {
  element: ElementData;
  position: [number, number, number];
  onClick?: () => void;
  isHighlighted?: boolean;
  excitement?: number; // 0–1, driven by game state
  personalityHint?: PersonalityAnimationHint | null;
}

// Shared geometries
const ENERGY_GEOMETRY = new THREE.SphereGeometry(0.5, 24, 24);
const RIM_GEOMETRY = new THREE.SphereGeometry(0.5, 32, 32);

// Shared Fresnel rim shader — compiled once at module load, reused by all atoms
const rimCompile = (shader: THREE.WebGLProgramParametersWithUniforms) => {
  shader.vertexShader = shader.vertexShader
    .replace(
      '#include <common>',
      `#include <common>
       varying vec3 vRimNormal;
       varying vec3 vRimView;`,
    )
    .replace(
      '#include <project_vertex>',
      `#include <project_vertex>
       vRimNormal = normalize(normalMatrix * normal);
       vRimView = normalize(-mvPosition.xyz);`,
    );

  shader.fragmentShader = shader.fragmentShader
    .replace(
      '#include <common>',
      `#include <common>
       varying vec3 vRimNormal;
       varying vec3 vRimView;`,
    )
    .replace(
      'vec4 diffuseColor = vec4( diffuse, opacity );',
      `float facing = max(dot(normalize(vRimNormal), normalize(vRimView)), 0.0);
       float rim = pow(1.0 - facing, 2.5);
       vec4 diffuseColor = vec4( diffuse * (1.0 + rim * 4.0), opacity * rim );`,
    );
};

export const VoxelAtom = memo(function VoxelAtom({
  element,
  position,
  onClick,
  isHighlighted,
  excitement = 0,
  personalityHint,
}: VoxelAtomProps) {
  const groupRef = useRef<THREE.Group>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bodyMatRef = useRef<any>(null);
  const energyRef = useRef<THREE.Mesh>(null);
  const rimRef = useRef<THREE.Mesh>(null);
  const breathing = useGameStore((s) => s.breathing);
  const calciumLogged = useGameStore((s) => s.calciumLogged);

  const phaseOffset =
    (position[0] * 127.1 + position[1] * 311.7 + position[2] * 523.3) %
    (Math.PI * 2);

  const pHint = personalityHint;
  const clampedSize = Math.min(0.65, element.size);

  // Smaller atoms wobble more
  const baseDistort = 0.3 + (1.0 - clampedSize) * 0.2;

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime + phaseOffset;

    let scale: number;
    let breathe: number;

    if (breathing) {
      const cycle = 14;
      const bt = state.clock.elapsedTime % cycle;
      let breathScale = 1.0;
      if (bt < 4) {
        breathScale = 1.0 + 0.1 * (bt / 4);
      } else if (bt < 8) {
        breathScale = 1.1;
      } else {
        breathScale = 1.1 - 0.1 * ((bt - 8) / 6);
      }
      scale = breathScale * clampedSize;
      breathe = (breathScale - 1.0) / 0.1;
    } else {
      breathe = Math.pow(Math.sin(t * 0.8) * 0.5 + 0.5, 0.85);
      const baseScale = 0.95 + breathe * 0.05;
      const pScale = pHint ? pHint.scale : 1.0;
      scale = (baseScale + excitement * 0.1) * clampedSize * pScale;
    }
    if (calciumLogged) scale *= 1.2; // Brighten when calcium logged
    groupRef.current.scale.setScalar(scale);
    groupRef.current.rotation.y += 0.002 + excitement * 0.005;

    // Body: neon emissive breathing — glass lit from within
    if (bodyMatRef.current) {
      const mat = bodyMatRef.current;
      mat.emissiveIntensity = isHighlighted
        ? 1.0
        : 0.5 + breathe * 0.35 + excitement * 0.3;

      mat.distort = baseDistort + excitement * 0.15
        + (pHint?.vibrate ? 0.12 + Math.sin(t * 15) * 0.06 : 0)
        + (pHint?.pulse ? Math.sin(t * 3.0) * 0.1 : 0);
    }

    // Energy core: neon glow breathing inside the glass
    if (energyRef.current) {
      const coreBreath = 0.5 + breathe * 0.2 + Math.sin(t * 1.5) * 0.06;
      energyRef.current.scale.setScalar(coreBreath);
      const mat = energyRef.current.material as THREE.MeshBasicMaterial;
      const pulse = 0.7 + breathe * 0.35 + Math.sin(t * 1.5) * 0.12;
      mat.color.set(element.emissive).multiplyScalar(
        Math.min(2.0, isHighlighted ? 1.8 : pulse * (1.4 + excitement * 0.4))
      );
      mat.opacity = isHighlighted ? 0.6 : 0.35 + breathe * 0.2;
    }

    // Rim: neon Fresnel edge glow
    if (rimRef.current) {
      const rimMat = rimRef.current.material as THREE.MeshBasicMaterial;
      rimMat.opacity = isHighlighted ? 0.7 : 0.4 + breathe * 0.15;
    }
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    playAtomNote(element.frequency);
    if (onClick) onClick();
  };

  return (
    <Float
      speed={1.2 + excitement * 0.8}
      rotationIntensity={0.15}
      floatIntensity={0.2}
    >
      <group
        ref={groupRef}
        position={position}
        onPointerDown={handlePointerDown}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        {/* Layer 1: Wobbly glass body — nearly clear, edge-lit */}
        <mesh>
          <icosahedronGeometry args={[0.5, 16]} />
          <MeshDistortMaterial
            ref={bodyMatRef}
            color={element.color}
            emissive={element.emissive}
            emissiveIntensity={0.6}
            roughness={0.08}
            metalness={0.1}
            distort={baseDistort}
            speed={1.5 + (pHint?.speed ?? 0.5) * 2}
            transparent
            opacity={0.25}
            depthWrite={false}
          />
        </mesh>

        {/* Layer 2: Inner energy — additive glow visible through glass */}
        <mesh ref={energyRef} geometry={ENERGY_GEOMETRY}>
          <meshBasicMaterial
            color={element.emissive}
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        {/* Layer 3: Fresnel rim — glass edge definition */}
        <mesh ref={rimRef} geometry={RIM_GEOMETRY} scale={1.02}>
          <meshBasicMaterial
            color={element.emissive}
            transparent
            opacity={0.4}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
            onBeforeCompile={rimCompile}
          />
        </mesh>

        {/* Layer 4: Element label */}
        <Billboard follow position={[0, 0, 0.35]}>
          <Text
            fontSize={0.22}
            color="white"
            anchorX="center"
            anchorY="middle"
            renderOrder={10}
            outlineWidth={0.02}
            outlineColor="black"
          >
            {element.symbol}
          </Text>
        </Billboard>
      </group>
    </Float>
  );
});
