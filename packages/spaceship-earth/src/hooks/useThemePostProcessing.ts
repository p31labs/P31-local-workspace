// ═══════════════════════════════════════════════════════════════
// WCD-29.4: Post-Processing Intensity Control
// P31 Labs — Spaceship Earth
//
// CRITICAL: NEVER unmount EffectComposer, bloom, or DoF passes.
// Unmounting forces shader recompilation = multi-second freeze on Android.
// Instead, lerp intensity to 0.
// ═══════════════════════════════════════════════════════════════

import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useThemeStore } from '../stores/themeStore';

interface PostProcessingRefs {
  bloomPass?: { luminanceThreshold: number; intensity: number };
  dofPass?: { bokehScale: number };
}

const POSTFX_TARGETS = {
  OPERATOR: { bloomThreshold: 0.6, bloomIntensity: 1.5, dofScale: 2 },
  KIDS: { bloomThreshold: 0.8, bloomIntensity: 0.8, dofScale: 4 },
  GRAY_ROCK: { bloomThreshold: 99, bloomIntensity: 0, dofScale: 0 }, // Effectively disabled
  AURORA: { bloomThreshold: 0.5, bloomIntensity: 2.0, dofScale: 3 },
  HIGH_CONTRAST: { bloomThreshold: 0.3, bloomIntensity: 2.0, dofScale: 0 },
  LOW_MOTION: { bloomThreshold: 0.6, bloomIntensity: 1.5, dofScale: 0 },
};

/**
 * CRITICAL: NEVER unmount EffectComposer, bloom, or DoF passes.
 * Unmounting forces shader recompilation = multi-second freeze on Android.
 * Instead, lerp intensity to 0.
 */
export function useThemePostProcessing(refs: PostProcessingRefs) {
  useFrame((_state, delta) => {
    const skin = useThemeStore.getState().config.skin;
    const targets = POSTFX_TARGETS[skin] ?? POSTFX_TARGETS.OPERATOR;

    if (refs.bloomPass) {
      refs.bloomPass.luminanceThreshold = THREE.MathUtils.lerp(
        refs.bloomPass.luminanceThreshold, targets.bloomThreshold, 5 * delta
      );
      refs.bloomPass.intensity = THREE.MathUtils.lerp(
        refs.bloomPass.intensity, targets.bloomIntensity, 5 * delta
      );
    }

    if (refs.dofPass) {
      refs.dofPass.bokehScale = THREE.MathUtils.lerp(
        refs.dofPass.bokehScale, targets.dofScale, 5 * delta
      );
    }
  });
}
