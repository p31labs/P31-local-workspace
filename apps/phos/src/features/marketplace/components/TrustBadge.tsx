import { useState, useEffect } from 'react';

interface Profile {
  trustTier: string;
  careScore: number;
}

interface TrustBadgeProps {
  did?: string;
  tier?: 'basic' | 'trusted' | 'high' | string;
  size?: 'sm' | 'md';
}

const FEDERATION_API = 'https://gateway.p31ca.org/api/federation';

const TIER_COLORS = {
  basic: 'bg-quantum-amber/10 text-quantum-amber border-quantum-amber/20',
  trusted: 'bg-quantum-cyan/10 text-quantum-cyan border-quantum-cyan/20',
  high: 'bg-quantum-green/10 text-quantum-green border-quantum-green/20',
};

const TIER_ICONS = {
  basic: '🌱',
  trusted: '🔗',
  high: '⭐',
};

export function TrustBadge({ did, tier, size = 'md' }: TrustBadgeProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const normalizedTier = ((did ? profile?.trustTier : tier) || 'basic').toLowerCase() as keyof typeof TIER_COLORS;

  useEffect(() => {
    if (!did) return;
    fetch(`${FEDERATION_API}/.well-known/profiles/${encodeURIComponent(did)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setProfile({ trustTier: data.trustTier, careScore: data.careScore });
      })
      .catch(() => {});
  }, [did]);

  const careScore = profile?.careScore ?? null;

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border ${TIER_COLORS[normalizedTier] || TIER_COLORS.basic} ${sizeClasses}`}
      title={`Trust tier: ${normalizedTier}${careScore !== null ? ` · Care score: ${careScore.toFixed(2)}` : ''}`}
    >
      <span>{TIER_ICONS[normalizedTier] || TIER_ICONS.basic}</span>
      <span className="font-medium capitalize">{normalizedTier}</span>
    </span>
  );
}
