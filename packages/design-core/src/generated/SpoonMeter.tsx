/**
 * @file SpoonMeter — Cognitive load meter showing 0-5 spoons.
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface SpoonMeterProps {
  spoons: number;
  onChange?: (level: number) => void;
  className?: string;
}

const SPOON_SVG = `<svg viewBox="0 0 200 200" width="15" height="15" aria-hidden="true"><path d="M100 30 Q96 80 100 110 Q100 120 100 145" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round"/><ellipse cx="100" cy="145" rx="16" ry="26" fill="currentColor"/><circle cx="100" cy="30" r="6" fill="currentColor"/></svg>`;

export function SpoonMeter({ spoons, onChange, className }: SpoonMeterProps) {
  return (
    <div className={`flex items-center gap-1 ${className || ''}`} role="img" aria-label={`Spoon level ${spoons} of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`w-[18px] h-[18px] ${i < spoons ? 'text-accent' : 'text-white/20'}`}
          dangerouslySetInnerHTML={{ __html: SPOON_SVG }}
        />
      ))}
    </div>
  );
}

export default SpoonMeter;
