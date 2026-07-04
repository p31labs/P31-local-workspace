import type { SkinTheme } from './types';

// D1.3: Material interpolation targets per skin theme
// All values are lerp targets — animation loop approaches these smoothly via delta-time

export interface SkinProfile {
  // Material properties
  emissiveIntensity: number;
  roughness: number;
  bloomStrength: number;
  bloomThreshold: number;
  // Fog density (atmosphere)
  fogDensity: number;
  // Starfield opacity
  starOpacity: number;
  // Scanline overlay opacity
  scanlineOpacity: number;
  // Waveform visibility
  waveformScale: number;
}

export const SKIN_PROFILES: Record<SkinTheme, SkinProfile> = {
  OPERATOR: {
    emissiveIntensity: 2.5,
    roughness: 0.2,
    bloomStrength: 0.6,
    bloomThreshold: 0.85,
    fogDensity: 0.035,
    starOpacity: 0.5,
    scanlineOpacity: 0.3,
    waveformScale: 1.0,
  },
  KIDS: {
    emissiveIntensity: 0.5,
    roughness: 0.8,
    bloomStrength: 0.3,
    bloomThreshold: 1.2,
    fogDensity: 0.015,
    starOpacity: 0.7,
    scanlineOpacity: 0.0,
    waveformScale: 0.0,
  },
  GRAY_ROCK: {
    emissiveIntensity: 0.0,
    roughness: 1.0,
    bloomStrength: 0.0,
    bloomThreshold: 2.0,
    fogDensity: 0.02,
    starOpacity: 0.15,
    scanlineOpacity: 0.0,
    waveformScale: 0.0,
  },
};

// Lerp speed per second (higher = faster transition)
export const SKIN_LERP_RATE = 4.0;
