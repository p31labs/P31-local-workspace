import { useState, useEffect } from 'react';

interface LeaderboardEntry {
  id: string;
  total_earned: number;
  sovereignty_pool: number;
  performance_pool: number;
}

export function LovePanel() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('https://gateway.p31ca.org/api/love/leaderboard')
      .then(r => r.ok ? r.json() : { leaderboard: [] })
      .then(d => setLeaderboard(d.leaderboard || []))
      .catch(() => setLeaderboard([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div data-mcp-tool="lovePanel" data-mcp-state="idle" style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(240,242,245,0.5)', textTransform: 'uppercase' }}>
        ♥ LOVE Leaderboard
      </div>
      {loading ? (
        <div style={{ fontSize: 10, color: 'rgba(240,242,245,0.3)' }}>Loading…</div>
      ) : leaderboard.length === 0 ? (
        <div style={{ fontSize: 10, color: 'rgba(240,242,245,0.3)' }}>No LOVE data yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {leaderboard.map((entry, i) => (
            <div
              key={entry.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.02)',
              }}
            >
              <span style={{
                width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: i < 3 ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.04)',
                color: i < 3 ? '#fbbf24' : 'rgba(240,242,245,0.4)',
                fontSize: 8, fontWeight: 700,
              }}>
                {i + 1}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: i < 3 ? '#fbbf24' : 'rgba(240,242,245,0.7)', fontSize: 10 }}>
                  {entry.id.length > 24 ? entry.id.slice(0, 24) + '…' : entry.id}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600, color: '#00f0ff', fontSize: 10 }}>
                  ♥ {entry.total_earned?.toFixed(1)}
                </div>
                <div style={{ fontSize: 8, color: 'rgba(240,242,245,0.25)' }}>
                  S:{entry.sovereignty_pool?.toFixed(1)} P:{entry.performance_pool?.toFixed(1)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LovePanel;
