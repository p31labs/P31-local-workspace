// ═══════════════════════════════════════════════════════════════
// WCD-29.3: WebGL Transient Material Mutation Hook
// P31 Labs — Spaceship Earth
//
// Attaches to a meshStandardMaterial ref and interpolates
// material properties based on active theme.
// Uses transient Zustand pattern — NO React re-renders.
// ═══════════════════════════════════════════════════════════════

import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useThemeStore } from '../stores/themeStore';

// Module-scope allocations — NEVER inside useFrame
const _targetColor = new THREE.Color();
const _targetEmissive = new THREE.Color();

interface ThemeMaterialTargets {
  OPERATOR: { emissiveIntensity: number; roughness: number; color: string; emissive: string };
  KIDS: { emissiveIntensity: number; roughness: number; color: string; emissive: string };
  GRAY_ROCK: { emissiveIntensity: number; roughness: number; color: string; emissive: string };
  AURORA: { emissiveIntensity: number; roughness: number; color: string; emissive: string };
  HIGH_CONTRAST: { emissiveIntensity: number; roughness: number; color: string; emissive: string };
  LOW_MOTION: { emissiveIntensity: number; roughness: number; color: string; emissive: string };
}

const MATERIAL_TARGETS: ThemeMaterialTargets = {
  OPERATOR: { emissiveIntensity: 2.5, roughness: 0.2, color: '#C9B1FF', emissive: '#C9B1FF' },
  KIDS: { emissiveIntensity: 0.5, roughness: 0.8, color: '#E9C46A', emissive: '#E9C46A' },
  GRAY_ROCK: { emissiveIntensity: 0.0, roughness: 1.0, color: '#64748B', emissive: '#000000' },
  AURORA: { emissiveIntensity: 3.5, roughness: 0.1, color: '#a78bfa', emissive: '#a78bfa' },
  HIGH_CONTRAST: { emissiveIntensity: 3.0, roughness: 0.1, color: '#00FFFF', emissive: '#00FFFF' },
  LOW_MOTION: { emissiveIntensity: 2.5, roughness: 0.2, color: '#C9B1FF', emissive: '#C9B1FF' },
};

/**
 * Attaches to a meshStandardMaterial ref and interpolates
 * material properties based on active theme.
 * Uses transient Zustand pattern — NO React re-renders.
 */
export function useThemeMaterial(
  materialRef: React.RefObject<THREE.MeshStandardMaterial | null>,
  lerpSpeed: number = 5
) {
  useFrame((_state, delta) => {
    const mat = materialRef.current;
    if (!mat) return;

    // Imperative fetch — no subscription, no re-render
    const skin = useThemeStore.getState().config.skin;
    const targets = MATERIAL_TARGETS[skin] ?? MATERIAL_TARGETS.OPERATOR;

    // Lerp color
    _targetColor.set(targets.color);
    mat.color.lerp(_targetColor, lerpSpeed * delta);

    // Lerp emissive
    _targetEmissive.set(targets.emissive);
    mat.emissive.lerp(_targetEmissive, lerpSpeed * delta);

    // Lerp scalars
    mat.emissiveIntensity = THREE.MathUtils.lerp(
      mat.emissiveIntensity, targets.emissiveIntensity, lerpSpeed * delta
    );
    mat.roughness = THREE.MathUtils.lerp(
      mat.roughness, targets.roughness, lerpSpeed * delta
    );
  });
}
