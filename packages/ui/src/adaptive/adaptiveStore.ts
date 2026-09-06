import { create } from 'zustand';

export interface AdaptiveState {
  spoons: number;
  sizeClass: 'compact' | 'regular' | 'medium' | 'expanded';
  contrast: 'standard' | 'high';
  motion: 'full' | 'reduced' | 'none';
  density: 'low' | 'medium' | 'high';
  confidence: number;
  drivers: string[];
  setDecision: (partial: Partial<AdaptiveState>) => void;
}

export const useAdaptiveStore = create<AdaptiveState>((set) => ({
  spoons: 3,
  sizeClass: 'regular',
  contrast: 'standard',
  motion: 'full',
  density: 'medium',
  confidence: 0.3,
  drivers: [],
  setDecision: (partial) => set(partial),
}));
