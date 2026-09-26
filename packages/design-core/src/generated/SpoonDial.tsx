/**
 * @file SpoonDial — Cognitive load selector (0-5 spoons).
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface SpoonDialProps {
  level: number;
  onChange?: (level: number) => void;
  className?: string;
}

const SPOON_SVG = `<svg viewBox="0 0 200 200" width="15" height="15" aria-hidden="true"><path d="M100 30 Q96 80 100 110 Q100 120 100 145" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round"/><ellipse cx="100" cy="145" rx="16" ry="26" fill="currentColor"/><circle cx="100" cy="30" r="6" fill="currentColor"/></svg>`;

export function SpoonDial({ level, onChange, className }: SpoonDialProps) {
  return (
    <div className={`spoon-dial ${className || ''}`} role="radiogroup" aria-label="Cognitive load">
      {Array.from({ length: 6 }, (_, i) => (
        <button
          key={i}
          type="button"
          className={`spoon-btn ${i === level ? 'active' : ''}`}
          onClick={() => onChange?.(i)}
          role="radio"
          aria-checked={i === level}
          aria-label={`Spoons = ${i}`}
          title={`Cognitive load level ${i}`}
        >
          <span dangerouslySetInnerHTML={{ __html: SPOON_SVG }} />
        </button>
      ))}
    </div>
  );
}

export default SpoonDial;
