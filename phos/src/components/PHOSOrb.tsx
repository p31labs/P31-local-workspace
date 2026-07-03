import React from 'react';
import { useAtmosphere } from './AtmosphereProvider';

interface PHOSOrbProps {
  spoons?: number;
}

export default function PHOSOrb({ spoons: propSpoons }: PHOSOrbProps) {
  const ctx = (() => { try { return useAtmosphere(); } catch { return null; } })();
  const spoons = propSpoons ?? ctx?.spoons ?? 3;
  const grayRock = ctx?.grayRock ?? false;

  const size = 72 + spoons * 8;

  if (grayRock || spoons === 0) {
    return <div className="w-16 h-16 rounded-full bg-gray-800 shadow-none" aria-hidden="true" />;
  }

  const pulseDuration = Math.max(2, 6 - spoons);
  return (
    <div
      className="rounded-full bg-phos-accent phos-gpu"
      style={{
        width: size,
        height: size,
        opacity: 0.6 + spoons * 0.08,
        animation: `pulse ${pulseDuration}s ease-in-out infinite`,
      }}
      aria-label="PHOS Orb"
    />
  );
}
