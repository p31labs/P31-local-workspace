/**
 * The Loom — presentation-axis hooks (context-based).
 *
 * Presentation prefs resolve once to a `Presentation` value (see App.tsx) and
 * are provided through React context, so canvas/WebGL/DOM consumers re-render
 * when the axes change — a real subscription, not a `getComputedStyle` poll.
 *
 * The OS `prefers-reduced-motion` boundary is enforced by `floorMotion()`,
 * which App applies before providing the context: an OS-level preference caps
 * the effective tier at `reduced` regardless of what the profile stores.
 */
import { createContext, useContext } from 'react';

export type MotionPreference = 'full' | 'reduced' | 'none';

export interface Presentation {
  literalLabels: boolean;
  motion: MotionPreference;
}

export const PresentationContext = createContext<Presentation>({
  literalLabels: false,
  motion: 'full',
});

/**
 * Floor a stored motion preference at the OS boundary. OS `reduced` caps the
 * effective tier at `reduced` (a health/safety guardrail); a profile may still
 * degrade further to `none`, but never above `reduced`.
 */
export function floorMotion(pref: string | undefined, osReduced: boolean): MotionPreference {
  const profile: MotionPreference = pref === 'reduced' || pref === 'none' ? pref : 'full';
  if (osReduced) return profile === 'none' ? 'none' : 'reduced';
  return profile;
}

/** True when the profile prefers plain-language labels over technical terms. */
export function useLiteralLabels(): boolean {
  return useContext(PresentationContext).literalLabels;
}

/** The motion preference tier, already floored at the OS boundary. */
export function useMotion(): MotionPreference {
  return useContext(PresentationContext).motion;
}
