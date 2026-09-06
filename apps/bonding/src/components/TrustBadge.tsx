/**
 * BONDING — SBT Trust Tier Badge
 * Fetches trust tier from DADS and displays as a badge.
 */
import { useState, useEffect } from 'react';
import { getUserId } from '../lib/identity';

const DADS_MCP = 'https://gateway.p31ca.org/api/trust';
const FEDERATION_API = 'https://gateway.p31ca.org/api/federation';

interface TrustState {
  tier: string;
  score: number;
  loading: boolean;
}

const TIER_COLORS: Record<string, string> = {
  genesis: '#FBBF24',
  high: '#34D399',
  trusted: '#00F0FF',
  basic: '#94a3b8',
  untrusted: '#f87171',
};

export function TrustBadge() {
  const [trust, setTrust] = useState<TrustState>({ tier: 'basic', score: 0.5, loading: true });

  useEffect(() => {
    const id = getUserId();
    if (!id) { setTrust({ tier: 'basic', score: 0.5, loading: false }); return; }

    // Try federation-bridge profile first (has trust_tier + care_score)
    fetch(`${FEDERATION_API}/.well-known/profiles/${encodeURIComponent(id)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.trustTier) {
          setTrust({ tier: data.trustTier, score: data.careScore || 0.5, loading: false });
          return;
        }
        // Fallback: call DADS trust_tier
        return fetch(DADS_MCP, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0', id: Date.now(), method: 'tools/call',
            params: { name: 'dads_trust_tier', arguments: { did: id } },
          }),
        });
      })
      .then(r => r?.json())
      .then(data => {
        if (data?.result?.content?.[0]?.text) {
          const result = JSON.parse(data.result.content[0].text);
          if (result?.tier) {
            setTrust({ tier: result.tier, score: result.trustScore || 0.5, loading: false });
            return;
          }
        }
        setTrust({ tier: 'basic', score: 0.5, loading: false });
      })
      .catch(() => setTrust({ tier: 'basic', score: 0.5, loading: false }));
  }, []);

  const color = TIER_COLORS[trust.tier] || TIER_COLORS.basic;

  return (
    <div style={{
      background: `${color}10`, border: `1px solid ${color}30`,
      borderRadius: 12, padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12,
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0,
      }} />
      <span style={{ fontWeight: 600, color, textTransform: 'capitalize' }}>
        {trust.loading ? '...' : trust.tier}
      </span>
      {!trust.loading && (
        <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 10 }}>
          {trust.score.toFixed(2)}
        </span>
      )}
    </div>
  );
}
