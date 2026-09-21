/**
 * The Loom — profile hook. Fetches the active human's profile once, exposes
 * it (or null when anonymous), and derives presentation overrides + tier.
 * Pure resolution lives in ./profile.ts; this owns the fetch lifecycle.
 */
import { useEffect, useState } from 'react';
import type { HumanProfile } from '@p31/canon/loom/profiles';
import { resolveHumanId, presentationOverrides, resolveTier, resolvePresentation, type PresentationPrefs } from './profile';

/** The privacy-preserving care proof, as served by /api/loom/love/:did. */
export interface CareProof {
  did: string;
  bound: boolean;
  careScore: number;
  verified: boolean;
  sovereigntyPool: number;
  performancePool: number;
  totalEarned: number;
  updatedAt: number | null;
}

export interface UseProfile {
  humanId: string | null;
  profile: HumanProfile | null;
  overrides: Record<string, string>;
  presentation: PresentationPrefs;
  tier: 'beginner' | 'intermediate' | 'advanced';
  /** The LOVE care proof for this human, when a loveDid is bound. null when
   *  anonymous, unbinding, or the ledger read is still in flight. */
  care: CareProof | null;
}

export function useProfile(): UseProfile {
  const search = typeof location !== 'undefined' ? location.search : '';
  // Resolves once. Navigating between ?id= / ?tier= values in the same
  // session does not re-resolve; reload to switch identity or tier.
  const [humanId] = useState<string | null>(() => resolveHumanId(search));
  const [profile, setProfile] = useState<HumanProfile | null>(null);
  const [care, setCare] = useState<CareProof | null>(null);

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

  // LOVE care proof: only when the profile binds a loveDid. The ledger read
  // is separate so an anonymous or unbinding session never touches it.
  useEffect(() => {
    const did = profile?.loveDid;
    if (!did) {
      setCare(null);
      return;
    }
    let alive = true;
    fetch(`/api/loom/love/${encodeURIComponent(did)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((p: CareProof | null) => {
        if (alive && p) setCare(p);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [profile]);

  return {
    humanId,
    profile,
    care,
    overrides: presentationOverrides(profile, search),
    presentation: resolvePresentation(profile, search),
    tier: resolveTier(profile, search),
  };
}
