/**
 * The Loom — human identity + profile resolution (client side).
 *
 * The canvas is presentation-layer: it resolves a `humanId` (URL param wins,
 * then localStorage, then anonymous) and applies profile-driven presentation
 * preferences. The log records the action + `humanId`; this module owns the
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

/** The discrete presentation tiers, resolved from profile + URL params. */
export interface PresentationPrefs {
  density: 'compact' | 'comfortable' | 'spacious';
  motion: 'full' | 'reduced' | 'none';
  saturation: 'normal' | 'muted';
  literalLabels: boolean;
  letterSpacing: 'normal' | 'wide' | 'extra-wide';
  lineSpacing: 'normal' | 'loose';
}

/**
 * Resolve the presentation preferences. URL params win over the profile (a
 * demo/testing affordance mirroring `?tier=`): `?density=`, `?motion=`,
 * `?saturation=`, `?literal=1|0`, `?spacing=`, `?line=`. The profile store
 * remains authoritative; params only promote/demote display for the session.
 */
export function resolvePresentation(
  profile: HumanProfile | null,
  search: string = typeof location !== 'undefined' ? location.search : '',
): PresentationPrefs {
  const p = profile?.presentation;
  const params = new URLSearchParams(search);

  const pick = <T extends string>(
    param: string,
    profileVal: T | undefined,
    allowed: readonly T[],
    fallback: T,
  ): T => {
    const v = params.get(param) as T | null;
    if (v && (allowed as readonly string[]).includes(v)) return v;
    if (profileVal && (allowed as readonly string[]).includes(profileVal)) return profileVal;
    return fallback;
  };

  const literal = params.get('literal');
  const literalLabels =
    literal === '1' ? true : literal === '0' ? false : (p?.literalLabels ?? false);

  return {
    density: pick('density', p?.density, ['compact', 'comfortable', 'spacious'], 'comfortable'),
    motion: pick('motion', p?.motion, ['full', 'reduced', 'none'], 'full'),
    saturation: pick('saturation', p?.colorSaturation, ['normal', 'muted'], 'normal'),
    literalLabels,
    letterSpacing: pick('spacing', p?.letterSpacing, ['normal', 'wide', 'extra-wide'], 'normal'),
    lineSpacing: pick('line', p?.lineSpacing, ['normal', 'loose'], 'normal'),
  };
}

/**
 * Map presentation prefs onto the CSS custom properties the DOM actually
 * consumes (letter-spacing, line-height). The discrete tiers (density, motion,
 * saturation, literal) are surfaced via `data-*` attributes + the React
 * presentation context, not CSS vars — one channel per concern.
 */
export function presentationOverrides(
  profile: HumanProfile | null,
  search: string = typeof location !== 'undefined' ? location.search : '',
): Record<string, string> {
  const prefs = resolvePresentation(profile, search);
  const out: Record<string, string> = {};
  if (prefs.letterSpacing === 'wide') out['--loom-letter-spacing'] = '0.06em';
  else if (prefs.letterSpacing === 'extra-wide') out['--loom-letter-spacing'] = '0.12em';
  if (prefs.lineSpacing === 'loose') out['--loom-line-height'] = '1.8';
  return out;
}

/** Resolve a profile's tier, defaulting to 'advanced' (the full surface). A
 *  `?tier=` URL param overrides the stored tier for the session — a demo
 *  affordance so a reader can see the tier system without hand-writing JSON.
 *  The store remains authoritative; the param only promotes/demotes display. */
export type Tier = 'beginner' | 'intermediate' | 'advanced';

const TIERS: readonly Tier[] = ['beginner', 'intermediate', 'advanced'];

export function resolveTier(
  profile: HumanProfile | null,
  search: string = typeof location !== 'undefined' ? location.search : '',
): Tier {
  const param = new URLSearchParams(search).get('tier');
  if (param && (TIERS as readonly string[]).includes(param)) return param as Tier;
  return profile?.tier ?? 'advanced';
}
