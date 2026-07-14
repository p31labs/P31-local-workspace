import React from 'react';
import { useSpoonMotion, type SpoonLevel } from '../hooks/useSpoonMotion';
import { VagusBreath as CrisisBreath } from './ui/VagusBreath';

import AtomOrbitals from './ambient/AtomOrbitals';
import DustMotes from './ambient/DustMotes';
import EmberParticles from './ambient/EmberParticles';
import GlitchEffect from './ambient/GlitchEffect';
import HexRain from './ambient/HexRain';
import PixelGrid from './ambient/PixelGrid';
import VaultScanlines from './ambient/VaultScanlines';

interface AmbientManagerProps {
  spoons: SpoonLevel;
  activeEffects?: string[];
  crisisActive?: boolean;
  onCrisisExit?: () => void;
  className?: string;
}

/**
 * AmbientManager — conditionally renders ambient effects by spoon tier.
 *
 * Effect thresholds:
 * - VagusBreath:     spoons === 0 (crisis invariant)
 * - EmberParticles:  spoons <= 2 (crisis warning)
 * - DustMotes:       spoons >= 2 (sanctuary, idle)
 * - AtomOrbitals:    spoons >= 3 (identity, keys)
 * - VaultScanlines:  spoons >= 3 (security, wallet)
 * - GlitchEffect:    spoons >= 4 (cryptographic signing)
 * - HexRain:         spoons >= 4 (data streams)
 * - PixelGrid:       spoons >= 4 (developer mode)
 *
 * Each ambient component reads spoons from AtmosphereProvider context internally.
 * This component only controls render/no-render at the container level.
 */
export function AmbientManager({
  spoons,
  activeEffects = ['all'],
  crisisActive = false,
  onCrisisExit,
  className = '',
}: AmbientManagerProps) {
  const { effective } = useSpoonMotion(spoons);
  const showAll = activeEffects.includes('all');

  return (
    <>
      {/* Crisis invariant — full-screen breathing overlay */}
      <CrisisBreath active={effective === 0 || crisisActive} onExit={onCrisisExit} />

      {/* Ambient effects — conditionally rendered by spoon tier */}
      <div
        className={`pointer-events-none fixed inset-0 z-0 ${className}`}
        aria-hidden="true"
      >
        {(showAll || activeEffects.includes('ember')) && effective <= 2 && (
          <EmberParticles />
        )}
        {(showAll || activeEffects.includes('dust')) && effective >= 2 && (
          <DustMotes />
        )}
        {(showAll || activeEffects.includes('atom')) && effective >= 3 && (
          <AtomOrbitals />
        )}
        {(showAll || activeEffects.includes('vault')) && effective >= 3 && (
          <VaultScanlines />
        )}
        {(showAll || activeEffects.includes('glitch')) && effective >= 4 && (
          <GlitchEffect />
        )}
        {(showAll || activeEffects.includes('hex')) && effective >= 4 && (
          <HexRain />
        )}
        {(showAll || activeEffects.includes('pixel')) && effective >= 4 && (
          <PixelGrid />
        )}
      </div>
    </>
  );
}
