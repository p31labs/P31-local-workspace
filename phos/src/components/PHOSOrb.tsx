import React from 'react';
import { useAtmosphere } from './AtmosphereProvider';

export default function PHOSOrb() {
  const { spoons, grayRock } = useAtmosphere();
  const size = 72 + spoons * 8;
  if (grayRock || spoons === 0) {
    return <div className="w-16 h-16 rounded-full bg-gray-800 shadow-none" aria-hidden="true" />;
  }
  return (
    <div
      className="rounded-full shadow-[0_0_50px_rgba(52,211,153,0.5)] bg-emerald-400 animate-pulse"
      style={{ width: size, height: size }}
      aria-label="PHOS Orb"
    />
  );
}
