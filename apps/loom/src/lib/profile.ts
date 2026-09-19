/**
 * The Loom — human identity + profile resolution (client side).
 *
 * The canvas is presentation-layer: it resolves a `humanId` (URL param wins,
 * then localStorage, then anonymous) and applies profile-driven presentation
 * overrides. The log records the action + `humanId`; this module owns the
 * display side. No PII reaches the log.
 *
 * Note: `?id=` has no auth. It is a dev/demo convenience, not an identity
 * proof. A future authenticated wrapper sets `humanId` server-side before
 * `commit()` — the middleware is already structured for that.
 */
import type { HumanProfile } from '@p31/canon/loom/profiles';

const STORAGE_KEY = 'loom:humanId';

/** Resolve the active humanId: URL `?id=` wins, else localStorage, else null. */
export function resolveHumanId(search: string = typeof location !== 'undefined' ? location.search : ''): string | null {
  const param = new URLSearchParams(search).get('id');
  if (param) {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, param);
    return param;
  }
  if (typeof localStorage !== 'undefined') return localStorage.getItem(STORAGE_KEY);
  return null;
}

/** Map a profile's presentation prefs onto CSS custom-property overrides. */
export function presentationOverrides(profile: HumanProfile | null): Record<string, string> {
  if (!profile?.presentation) return {};
  const p = profile.presentation;
  const out: Record<string, string> = {};
  if (p.letterSpacing === 'wide') out['--loom-letter-spacing'] = '0.06em';
  if (p.letterSpacing === 'extra-wide') out['--loom-letter-spacing'] = '0.12em';
  if (p.lineSpacing === 'loose') out['--loom-line-height'] = '1.8';
  if (p.density === 'spacious') out['--loom-density'] = 'spacious';
  if (p.density === 'compact') out['--loom-density'] = 'compact';
  return out;
}

/** Resolve a profile's tier, defaulting to 'advanced' (the full surface). */
export function resolveTier(profile: HumanProfile | null): 'beginner' | 'intermediate' | 'advanced' {
  return profile?.tier ?? 'advanced';
}
