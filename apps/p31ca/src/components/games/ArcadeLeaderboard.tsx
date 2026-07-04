import { useState, useEffect } from 'react';
import { getPGlite } from '../../lib/arcade-core/pglite/client.ts';
import { GET_ALL_GAME_TOP_SCORES } from '../../lib/arcade-core/pglite/schema.ts';
import { ARCADE_GAMES } from '../../lib/arcade-core/theme.ts';

interface ScoreRow {
  slug: string;
  title: string;
  score: number;
  created_at: string;
}

const GAME_EMOJI: Record<string, string> = {};
const GAME_COLOR: Record<string, string> = {};
for (const g of ARCADE_GAMES) {
  GAME_EMOJI[g.id] = g.emoji;
  GAME_COLOR[g.id] = g.color;
}

function formatDate(d: string): string {
  try { return new Date(d).toLocaleDateString(); } catch { return ''; }
}

export function ArcadeLeaderboard() {
  const [groups, setGroups] = useState<{ slug: string; title: string; scores: ScoreRow[] }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const db = await getPGlite();
        const res = await db.query(GET_ALL_GAME_TOP_SCORES);
        const rows = (res.rows as ScoreRow[]).filter(r => r.score != null);

        const map = new Map<string, { title: string; scores: ScoreRow[] }>();
        for (const r of rows) {
          if (!map.has(r.slug)) map.set(r.slug, { title: r.title, scores: [] });
          if (map.get(r.slug)!.scores.length < 3) {
            map.get(r.slug)!.scores.push(r);
          }
        }

        const sorted = Array.from(map.entries())
          .map(([slug, v]) => ({ slug, ...v }))
          .sort((a, b) => {
            const maxA = a.scores[0]?.score ?? 0;
            const maxB = b.scores[0]?.score ?? 0;
            return maxB - maxA;
          });

        setGroups(sorted);
      } catch { setGroups([]); }
      setLoading(false);
    })();
  }, []);

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 16px 40px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{
          fontFamily: "'Press Start 2P', cursive", fontSize: 18,
          color: '#cda852', marginBottom: 8,
        }}>
          LEADERBOARDS
        </h1>
        <p style={{
          fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
          color: 'rgba(232,230,227,0.4)',
        }}>
          Top scores across the arcade
        </p>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 40, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: 'rgba(232,230,227,0.3)' }}>
          Loading scores...
        </div>
      )}

      {!loading && groups.length === 0 && (
        <div style={{
          textAlign: 'center', padding: 40,
          background: 'rgba(255,255,255,0.02)', borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <p style={{ fontSize: 14, fontFamily: "'JetBrains Mono', monospace", color: 'rgba(232,230,227,0.4)', marginBottom: 8 }}>
            No scores yet
          </p>
          <p style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'rgba(232,230,227,0.2)' }}>
            Play some games to see your best performances here.
          </p>
        </div>
      )}

      {!loading && groups.map(group => {
        const emoji = GAME_EMOJI[group.slug] || '🎮';
        const color = GAME_COLOR[group.slug] || '#8b7cc9';
        return (
          <div key={group.slug} style={{
            marginBottom: 16, padding: '16px 20px',
            background: 'rgba(255,255,255,0.02)', borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>{emoji}</span>
              <div>
                <h3 style={{
                  fontFamily: "'Press Start 2P', cursive", fontSize: 10,
                  color: '#e8e6e3', margin: 0,
                }}>
                  {group.title}
                </h3>
                <a href={`/arcade/${group.slug}/`} style={{
                  fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                  color: color, textDecoration: 'none',
                }}
                  onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }}
                  onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}
                >
                  Play →
                </a>
              </div>
            </div>
            {group.scores.map((s, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px', marginBottom: i < group.scores.length - 1 ? 6 : 0,
                background: i === 0 ? 'rgba(205,168,82,0.06)' : 'transparent',
                borderRadius: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    fontFamily: "'Press Start 2P', cursive", fontSize: 8,
                    color: i === 0 ? '#cda852' : 'rgba(232,230,227,0.3)',
                    minWidth: 20,
                  }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </span>
                  <span style={{
                    fontSize: 16, fontFamily: "'Press Start 2P', cursive",
                    color: i === 0 ? '#cda852' : '#e8e6e3',
                  }}>
                    {s.score}
                  </span>
                </div>
                <span style={{
                  fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                  color: 'rgba(232,230,227,0.3)',
                }}>
                  {formatDate(s.created_at)}
                </span>
              </div>
            ))}
            {group.scores.length === 0 && (
              <p style={{
                fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                color: 'rgba(232,230,227,0.2)', textAlign: 'center', padding: 12,
              }}>
                No scores yet
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
