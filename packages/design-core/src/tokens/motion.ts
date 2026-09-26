/**
 * P31 motion — spoon-aware duration/easing system.
 * Compiled by `scripts/gen-tokens.mts` → src/generated/spoon-ladder.css
 * as `[data-spoons="n"]` custom-property overrides.
 */

export const motionTokens = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',

  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',

  crisis: {
    duration: '0ms',
    blurFilter: 'blur(0px)',
    opacity: '100%',
  },
} as const;

export interface SpoonStep {
  /** spoon level 0–5 */
  level: 0 | 1 | 2 | 3 | 4 | 5;
  /** base transition duration */
  motion: string;
  /** backdrop blur filter value */
  blur: string;
  /** glass opacity percent */
  opacity: string;
  interaction: 'essential-only' | 'normal' | 'enhanced' | 'full';
}

/** The canonical 0→5 cascade. Every component is tested across it. */
export const spoonLadder: readonly SpoonStep[] = [
  { level: 0, motion: '0ms', blur: '0px', opacity: '100%', interaction: 'essential-only' },
  { level: 1, motion: '0ms', blur: '0px', opacity: '100%', interaction: 'essential-only' },
  { level: 2, motion: '200ms', blur: 'blur(4px)', opacity: '95%', interaction: 'normal' },
  { level: 3, motion: '300ms', blur: 'blur(8px)', opacity: '85%', interaction: 'normal' },
  { level: 4, motion: '150ms', blur: 'blur(12px)', opacity: '75%', interaction: 'enhanced' },
  { level: 5, motion: '100ms', blur: 'blur(16px)', opacity: '60%', interaction: 'full' },
] as const;
