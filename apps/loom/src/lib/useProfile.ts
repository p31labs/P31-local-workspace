/**
 * The Loom — profile hook. Fetches the active human's profile once, exposes
 * it (or null when anonymous), and derives presentation overrides + tier.
 * Pure resolution lives in ./profile.ts; this owns the fetch lifecycle.
 */
import { useEffect, useState } from 'react';
import type { HumanProfile } from '@p31/canon/loom/profiles';
import { resolveHumanId, presentationOverrides, resolveTier } from './profile';

export interface UseProfile {
  humanId: string | null;
  profile: HumanProfile | null;
  overrides: Record<string, string>;
  tier: 'beginner' | 'intermediate' | 'advanced';
}

export function useProfile(): UseProfile {
  const [humanId] = useState<string | null>(() => resolveHumanId());
  const [profile, setProfile] = useState<HumanProfile | null>(null);

  useEffect(() => {
    if (!humanId) return;
    let alive = true;
    fetch(`/api/loom/profile/${encodeURIComponent(humanId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((p: HumanProfile | null) => {
        if (alive && p) setProfile(p);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [humanId]);

  return {
    humanId,
    profile,
    overrides: presentationOverrides(profile),
    tier: resolveTier(profile),
  };
}
