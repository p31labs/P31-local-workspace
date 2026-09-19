/**
 * The Loom — surface + decision logic (pure, unit-testable).
 *
 * Progressive disclosure lives here: the tier controls what the canvas
 * surfaces (digest, overlay, scrubber, survival bars, raw JSON), never what
 * the log records. The reject-reason default is also here so the two tiers
 * differ without burying the rule in JSX.
 */
import type { Tier } from './profile';

export interface Surface {
  /** Event overlay (intermediate+) vs digest (beginner). */
  showOverlay: boolean;
  /** Timeline scrubber — advanced only. */
  showScrubber: boolean;
  /** Survival bars + raw JSON — advanced only. */
  showSurvival: boolean;
}

/** Effective tier after the beginner "show me more" toggle. The toggle
 *  promotes the surface to advanced for the session; the profile is unchanged. */
export function effectiveTier(tier: Tier, showMore: boolean): Tier {
  return showMore ? 'advanced' : tier;
}

/** What the canvas surfaces at a given tier. Same LoomState behind all three. */
export function resolveSurface(tier: Tier): Surface {
  return {
    showOverlay: tier !== 'beginner',
    showScrubber: tier === 'advanced',
    showSurvival: tier === 'advanced',
  };
}

/** Default reject reason per tier. Beginner gets a softer, non-committal
 *  default ("deferred by human"); advanced gets the neutral "rejected by
 *  human". A non-empty reason always wins. */
export function rejectReasonFor(tier: Tier, reason: string): string {
  const trimmed = reason.trim();
  if (trimmed) return trimmed;
  return tier === 'beginner' ? 'deferred by human' : 'rejected by human';
}

/** The approve button label per tier: beginner sees plain language. */
export function approveLabel(tier: Tier): string {
  return tier === 'beginner' ? 'Looks good' : 'Approve';
}
