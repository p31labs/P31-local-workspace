/**
 * @file SpoonMeter — Real-time cognitive load indicator (0-5 scale).
 * Auto-generated from components.yml.
 *
 * @a2ui-component SpoonMeter
 * @a2ui-props current number - Current spoon level (0-5)
 * @a2ui-props interactive boolean - Allows user adjustment
 * @a2ui-example {"component":"SpoonMeter","current":3,"interactive":true}
 */

import type { ReactNode } from 'react';

export interface SpoonMeterProps {
  current?: number;
  interactive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function SpoonMeter({ current = 3, interactive = true, className, style }: SpoonMeterProps) {
  const dots = Array.from({ length: 5 }, (_, i) => i < current);

  return (
    <div className={`flex items-center gap-1.5 ${className || ''}`} style={style} role="img" aria-label={`Spoon level ${current} of 5`}>
      {dots.map((filled, i) => (
        <div
          key={i}
          className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${filled ? 'bg-accent shadow-[0_0_6px_rgba(0,240,255,0.5)]' : 'bg-white/10'}`}
        />
      ))}
    </div>
  );
}

export default SpoonMeter;
