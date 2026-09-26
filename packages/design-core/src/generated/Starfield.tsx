/**
 * @file Starfield — Animated starfield background.
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface StarfieldProps {
  spoons?: number;
  warmStars?: boolean;
  reduceMotion?: boolean;
  className?: string;
}

export function Starfield({ spoons = 3, warmStars = false, reduceMotion = false, className }: StarfieldProps) {
  if (reduceMotion || spoons <= 1) {
    return <div className={`starfield-bg ${className || ''}`} aria-hidden="true" />;
  }
  return (
    <div className={`starfield-bg ${className || ''}`} aria-hidden="true">
      <canvas />
    </div>
  );
}

export default Starfield;
