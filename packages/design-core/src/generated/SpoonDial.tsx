/**
 * @file SpoonDial — Icon-mode spoon meter for header placement.
 * Auto-generated from components.yml.
 *
 * @a2ui-component SpoonDial
 * @a2ui-props level number - Current spoon level (0-5)
 * @a2ui-props onChange string - Action ID to call when level changes
 * @a2ui-example {"component":"SpoonDial","level":3,"onChange":"set-spoons"}
 */

import type { ReactNode } from 'react';

export interface SpoonDialProps {
  spoons?: number;
  className?: string;
  style?: React.CSSProperties;
}

const SPOON_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 2H15a2 2 0 00-2 2v4a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2z"/></svg>';

export function SpoonDial({ spoons = 3, className, style }: SpoonDialProps) {
  return (
    <div className={`flex items-center gap-1 ${className || ''}`} style={style} role="img" aria-label={`Spoon level ${spoons} of 5`}>
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

export default SpoonDial;
