import { useState, useEffect } from 'react';

interface LeaderEntry {
  did: string;
  family_name: string;
  love_total: number;
  challenges_completed: number;
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then(() => {
        setEntries([
          { did: 'did:key:z6Mk...a1b2', family_name: 'Sample Pilot 1', love_total: 1250, challenges_completed: 7 },
          { did: 'did:key:z6Mk...c3d4', family_name: 'Sample Pilot 2', love_total: 980, challenges_completed: 5 },
          { did: 'did:key:z6Mk...e5f6', family_name: 'Sample Pilot 3', love_total: 720, challenges_completed: 4 },
        ]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(245,245,247,0.3)', fontFamily: 'monospace', fontSize: '0.9rem' }}>
        Loading leaderboard...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '40px 1fr 100px 80px',
          gap: 12,
          padding: '10px 16px',
          fontSize: '0.75rem',
          color: 'rgba(245,245,247,0.3)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontFamily: 'monospace',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <span>#</span>
        <span>Pilot</span>
        <span style={{ textAlign: 'right' }}>LOVE</span>
        <span style={{ textAlign: 'right' }}>Challenges</span>
      </div>

      {entries.map((entry, i) => (
        <div
          key={entry.did}
          style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr 100px 80px',
            gap: 12,
            padding: '14px 16px',
            background: i === 0 ? 'rgba(251,191,36,0.06)' : 'rgba(255,255,255,0.02)',
            borderRadius: 12,
            border: i === 0 ? '1px solid rgba(251,191,36,0.15)' : '1px solid rgba(255,255,255,0.04)',
            alignItems: 'center',
            fontSize: '0.9rem',
          }}
        >
          <span style={{ fontWeight: 700, color: [i === 0 ? '#FBBF24' : i === 1 ? '#94a3b8' : '#CD7F32'][i] || 'rgba(245,245,247,0.4)', fontFamily: 'monospace' }}>
            {i + 1}
          </span>
          <span style={{ fontWeight: 500 }}>{entry.family_name}</span>
          <span style={{ textAlign: 'right', fontWeight: 600, color: '#00F0FF', fontFamily: 'monospace' }}>
            {entry.love_total.toLocaleString()}
          </span>
          <span style={{ textAlign: 'right', color: 'rgba(245,245,247,0.5)', fontFamily: 'monospace' }}>
            {entry.challenges_completed}
          </span>
        </div>
      ))}

      {entries.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(245,245,247,0.3)', fontSize: '0.9rem' }}>
          No entries yet. Play a game to earn LOVE!
        </div>
      )}
    </div>
  );
}
