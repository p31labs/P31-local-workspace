/**
 * @file starfieldStore — Runtime config for the starfield.
 * Read by StarfieldLayer via getState() for zero-render performance.
 * Written by StarControls DevMenu panel.
 */

import { create } from 'zustand';

interface StarfieldConfigState {
  starCount: number;
  speed: number;
  connRadius: number;
  tealGlow: number;
  coralGlow: number;
  baseAlpha: number;
  brightness: number;
  twinkle: boolean;

  setStarCount: (n: number) => void;
  setSpeed: (n: number) => void;
  setConnRadius: (n: number) => void;
  setTealGlow: (n: number) => void;
  setCoralGlow: (n: number) => void;
  setBaseAlpha: (n: number) => void;
  setBrightness: (n: number) => void;
  setTwinkle: (b: boolean) => void;
}

export const useStarfieldStore = create<StarfieldConfigState>((set) => ({
  starCount: 80,
  speed: 0.15,
  connRadius: 80,
  tealGlow: 0.02,
  coralGlow: 0.04,
  baseAlpha: 0.25,
  brightness: 1,
  twinkle: true,

  setStarCount: (n) => set({ starCount: Math.max(20, Math.min(200, Math.round(n))) }),
  setSpeed: (n) => set({ speed: Math.max(0.02, Math.min(0.5, n)) }),
  setConnRadius: (n) => set({ connRadius: Math.max(0, Math.min(200, Math.round(n))) }),
  setTealGlow: (n) => set({ tealGlow: Math.max(0, Math.min(0.1, n)) }),
  setCoralGlow: (n) => set({ coralGlow: Math.max(0, Math.min(0.1, n)) }),
  setBaseAlpha: (n) => set({ baseAlpha: Math.max(0.02, Math.min(0.8, n)) }),
  setBrightness: (n) => set({ brightness: Math.max(0.1, Math.min(2, n)) }),
  setTwinkle: (b) => set({ twinkle: b }),
}));
