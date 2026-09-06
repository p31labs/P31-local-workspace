import React from 'react';
import type { CSSProperties } from 'react';

export interface SpoonDialProps {
  /** Current spoon level 0–5 (spec). */
  level?: number;
  /** @deprecated use `level` */
  value?: number;
  onChange?: (level: number) => void;
  min?: number;
  max?: number;
  className?: string;
  style?: CSSProperties;
  /** @deprecated use onChange */
  label?: string;
}

const SPOON_SVG = `<path d="M100 30 Q96 80 100 110 Q100 120 100 145" stroke="currentColor" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="100" cy="145" rx="16" ry="26" fill="currentColor"/><circle cx="100" cy="30" r="6" fill="currentColor"/>`;

export function SpoonDial({ level, value, onChange, min = 0, max = 5, className = '', style }: SpoonDialProps) {
  const resolved = level ?? value ?? 3;
  const current = Math.max(min, Math.min(max, resolved));

  return (
    <div
      className={`spoon-dial ${className}`.trim()}
      role="radiogroup"
      aria-label="Cognitive load"
      style={style}
    >
      {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((n) => (
        <button
          key={n}
          type="button"
          className={`spoon-btn${n === current ? ' active' : ''}`}
          aria-checked={n === current ? 'true' : 'false'}
          aria-label={`Spoons = ${n}`}
          title={`Cognitive load level ${n}`}
          onClick={() => onChange?.(n)}
          dangerouslySetInnerHTML={{ __html: `<svg viewBox="0 0 200 200" width="15" height="15" aria-hidden="true">${SPOON_SVG}</svg>` }}
        />
      ))}
    </div>
  );
}

export default SpoonDial;
