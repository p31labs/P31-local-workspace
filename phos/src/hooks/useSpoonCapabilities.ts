import { useMemo } from 'react';
import { useAtmosphere } from '../components/AtmosphereProvider';

export type SpoonLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface SpoonCapabilities {
  level: SpoonLevel;
  isCrisis: boolean;
  isBridge: boolean;
  isQuantum: boolean;
  canAnimate: boolean;
  canLaunchGames: boolean;
  canNetwork: boolean;
  canCompute: boolean;
  canMintCredits: boolean;
  maxVisibleSurfaces: number;
  showExternalLinks: boolean;
  maxPollInterval: number;
  reducedMotion: boolean;
}

export function useSpoonCapabilities(): SpoonCapabilities {
  const { spoons, grayRock } = useAtmosphere();
  
  return useMemo(() => {
    const level = Math.max(0, Math.min(5, spoons)) as SpoonLevel;
    const isCrisis = grayRock || level === 0;
    const isBridge = level >= 1 && level <= 3;
    const isQuantum = level >= 4;
    
    return {
      level,
      isCrisis,
      isBridge,
      isQuantum,
      canAnimate: level >= 3,
      canLaunchGames: level >= 3,
      canNetwork: level >= 3,
      canCompute: level >= 3,
      canMintCredits: level >= 3,
      maxVisibleSurfaces: level <= 1 ? 1 : level <= 2 ? 2 : 4,
      showExternalLinks: level >= 4,
      maxPollInterval: level <= 1 ? 0 : level <= 2 ? 30000 : 5000,
      reducedMotion: level <= 2,
    };
  }, [spoons, grayRock]);
}
