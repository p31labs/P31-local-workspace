import { useState } from 'react';
import { COLORS } from '../../../lib/arcade-core/theme.ts';
import { TeamState, LeagueStandings, SkillCategory, LeagueTier } from '../../../engine/bashball/types.ts';

import { tierBadge, formatRecord } from '../../../engine/bashball/teamManager.ts';
interface DashboardProps {
  teamState: TeamState;
  nextGame: { opponent: string; isHome: boolean } | null;
  leagueStandings: LeagueStandings | null;
  recentTrainingResults: { playerName: string; skill: SkillCategory; gain: number }[];
  onNavigate: (screen: 'train' | 'play' | 'standings' | 'roster' | 'shop') => void;
  seasonProgress?: number;
  seasonTotal?: number;
  seasonComplete?: boolean;
  tier?: LeagueTier;
}

const NAV_BUTTONS: { screen: DashboardProps['onNavigate'] extends (s: infer S) => void ? S : never; label: string; icon: string }[] = [
  { screen: 'train', label: 'TRAIN', icon: '🏋️' },
  { screen: 'play', label: 'PLAY BALL', icon: '⚾' },
  { screen: 'standings', label: 'STANDINGS', icon: '📊' },
  { screen: 'roster', label: 'ROSTER', icon: '👥' },
  { screen: 'shop', label: 'ELITE SHOP', icon: '🔧' },
];

const WIN_PCT_COLORS = ['var(--p31-rust)', 'var(--p31-rust)', 'var(--p31-rust)', 'var(--p31-gold)', 'var(--p31-gold)', 'var(--p31-purple)', 'var(--p31-green)', 'var(--p31-green)', 'var(--p31-green)', 'var(--p31-green)', 'var(--p31-green)'];

export function Dashboard({ teamState, nextGame, leagueStandings, recentTrainingResults, onNavigate, seasonProgress, seasonTotal, seasonComplete, tier }: DashboardProps) {
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const record = teamState.record;
  const totalGames = record.wins + record.losses + record.ties;
  const winPct = totalGames > 0 ? ((record.wins + record.ties * 0.5) / totalGames) : 0;
  const winPctDisplay = winPct.toFixed(3).slice(1);
  const winPctColorIdx = Math.min(9, Math.floor(winPct * 10));
  const winPctColor = WIN_PCT_COLORS[winPctColorIdx];

  const userStanding = leagueStandings?.teams.findIndex(t => t.teamName === teamState.name) ?? -1;
  const topThree = leagueStandings?.teams.slice(0, 3) ?? [];
  const userInTopThree = userStanding >= 0 && userStanding < 3;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      maxWidth: 600,
      margin: '0 auto',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 18px',
        background: 'var(--p31-white-2)',
        borderRadius: 12,
        border: '1px solid var(--p31-white-6)',
      }}>
        <div>
          <div style={{
            fontFamily: "'Press Start 2P', cursive",
            fontSize: 14,
            color: 'var(--p31-cloud)',
          }}>
            {teamState.name}
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            color: 'var(--p31-cloud-40)',
            marginTop: 6,
          }}>
            {tierBadge(teamState.tier)} · Season {teamState.season}
          </div>
        </div>
        <div style={{
          fontFamily: "'Press Start 2P', cursive",
          fontSize: 16,
          color: 'var(--p31-gold)',
          textAlign: 'right',
        }}>
          {formatRecord(record)}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10,
      }}>
        <QuickStatCard label="Games" value={String(totalGames)} />
        <QuickStatCard label="Season" value={String(teamState.season)} />
        <QuickStatCard
          label="Win %"
          value={winPctDisplay}
          valueColor={winPctColor}
        />
      </div>

      {seasonTotal && seasonProgress !== undefined && !seasonComplete && (
        <div style={{ width: '100%', padding: '6px 12px', background: 'var(--p31-white-2)', borderRadius: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: 'var(--p31-cloud-40)', marginBottom: 4 }}>
            <span>Season {seasonProgress}/{seasonTotal}</span>
            <span>{Math.round((seasonProgress / seasonTotal) * 100)}%</span>
          </div>
          <div style={{ width: '100%', height: 4, background: 'var(--p31-white-6)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${(seasonProgress / seasonTotal) * 100}%`, height: '100%', background: 'var(--p31-rust)', borderRadius: 2, transition: 'width 0.3s' }} />
          </div>
        </div>
      )}
      {seasonComplete && (
        <div style={{ width: '100%', padding: '12px 16px', background: 'var(--p31-gold-dim)', border: '1px solid var(--p31-gold-border)', borderRadius: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 10, fontFamily: "'Press Start 2P', cursive", color: 'var(--p31-gold)', marginBottom: 4 }}>
            SEASON COMPLETE
          </p>
          <p style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: 'var(--p31-cloud-50)' }}>
            {teamState.record.wins}W - {teamState.record.losses}L
            {tier && ` — ${tierBadge(tier!)}`}
          </p>
        </div>
      )}

      {seasonComplete && (
        <button onClick={() => onNavigate('play')} style={{
          padding: '12px 28px', borderRadius: 10,
          border: '2px solid var(--p31-gold)', background: 'var(--p31-gold-dim)',
          color: 'var(--p31-gold)', fontFamily: "'Press Start 2P', cursive", fontSize: 10,
          cursor: 'pointer',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--p31-gold-border)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--p31-gold-dim)'; }}
        >
          NEXT SEASON →
        </button>
      )}

      {nextGame && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 18px',
          background: 'var(--p31-white-2)',
          borderRadius: 12,
          border: '1px solid var(--p31-white-6)',
        }}>
          <div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: 'var(--p31-cloud-40)',
              marginBottom: 4,
            }}>
              NEXT GAME
            </div>
            <div style={{
              fontFamily: "'Press Start 2P', cursive",
              fontSize: 10,
              color: 'var(--p31-cloud)',
            }}>
              vs {nextGame.opponent}
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: nextGame.isHome ? 'var(--p31-green)' : 'var(--p31-purple)',
              marginTop: 2,
            }}>
              {nextGame.isHome ? 'HOME' : 'AWAY'}
            </div>
          </div>
          <button
            aria-label="Play next game"
            onClick={() => onNavigate('play')}
            onMouseEnter={() => setHoveredNav('play-btn')}
            onMouseLeave={() => setHoveredNav(null)}
            style={{
              padding: '10px 22px',
              borderRadius: 10,
              border: '2px solid var(--p31-rust)',
              background: hoveredNav === 'play-btn' ? 'var(--p31-rust-border)' : 'var(--p31-rust-dim)',
              color: 'var(--p31-rust)',
              fontFamily: "'Press Start 2P', cursive",
              fontSize: 9,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            PLAY
          </button>
        </div>
      )}

      {leagueStandings && leagueStandings.teams.length > 0 && (
        <div style={{
          padding: '14px 18px',
          background: 'var(--p31-white-2)',
          borderRadius: 12,
          border: '1px solid var(--p31-white-6)',
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            color: 'var(--p31-cloud-40)',
            marginBottom: 10,
          }}>
            STANDINGS
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}>
            {topThree.map((entry, i) => {
              const isUser = entry.teamName === teamState.name;
              return (
                <div
                  key={entry.teamId || entry.teamName}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 10px',
                    borderRadius: 8,
                    background: isUser ? 'var(--p31-gold-dim)' : 'transparent',
                    border: isUser ? '1px solid var(--p31-gold-border)' : '1px solid transparent',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    color: isUser ? 'var(--p31-gold)' : 'var(--p31-cloud-60)',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ minWidth: 16 }}>{i === 0 ? '👑' : `${i + 1}.`}</span>
                    <span>{isUser ? `★ ${entry.teamName}` : entry.teamName}</span>
                  </span>
                  <span>{formatRecord(entry.record)}</span>
                </div>
              );
            })}

            {!userInTopThree && userStanding >= 3 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 10px',
                borderRadius: 8,
                background: 'var(--p31-gold-dim)',
                border: '1px solid var(--p31-gold-border)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: 'var(--p31-gold)',
                marginTop: 2,
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ minWidth: 16 }}>{userStanding + 1}.</span>
                  <span>★ {teamState.name}</span>
                </span>
                <span>{formatRecord(record)}</span>
              </div>
            )}
          </div>

          <button
            aria-label="View full standings"
            onClick={() => onNavigate('standings')}
            onMouseEnter={() => setHoveredLink('standings')}
            onMouseLeave={() => setHoveredLink(null)}
            style={{
              marginTop: 10,
              background: 'none',
              border: 'none',
              padding: 0,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: hoveredLink === 'standings' ? 'var(--p31-purple)' : 'var(--p31-cloud-40)',
              cursor: 'pointer',
              transition: 'all 0.15s',
              textDecoration: hoveredLink === 'standings' ? 'underline' : 'none',
            }}
          >
            VIEW FULL STANDINGS →
          </button>
        </div>
      )}

      {recentTrainingResults.length > 0 && (
        <div style={{
          padding: '14px 18px',
          background: 'var(--p31-white-2)',
          borderRadius: 12,
          border: '1px solid var(--p31-white-6)',
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            color: 'var(--p31-cloud-40)',
            marginBottom: 10,
          }}>
            RECENT TRAINING
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}>
            {recentTrainingResults.slice(-2).reverse().map((r, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 10px',
                  borderRadius: 8,
                  background: 'var(--p31-white-2)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: 'var(--p31-cloud-60)',
                }}
              >
                <span>{r.playerName}</span>
                <span style={{ color: 'var(--p31-green)' }}>
                  +{r.gain.toFixed(1)} {r.skill}
                </span>
              </div>
            ))}
          </div>

          <button
            aria-label="Go to training"
            onClick={() => onNavigate('train')}
            onMouseEnter={() => setHoveredLink('train')}
            onMouseLeave={() => setHoveredLink(null)}
            style={{
              marginTop: 10,
              background: 'none',
              border: 'none',
              padding: 0,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: hoveredLink === 'train' ? 'var(--p31-purple)' : 'var(--p31-cloud-40)',
              cursor: 'pointer',
              transition: 'all 0.15s',
              textDecoration: hoveredLink === 'train' ? 'underline' : 'none',
            }}
          >
            TRAINING →
          </button>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
        gap: 8,
        marginTop: 4,
      }}>
        {NAV_BUTTONS.map(btn => (
          <button
            key={btn.screen}
            aria-label={`Navigate to ${btn.label}`}
            onClick={() => onNavigate(btn.screen)}
            onMouseEnter={() => setHoveredNav(btn.screen)}
            onMouseLeave={() => setHoveredNav(null)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              padding: '14px 10px',
              borderRadius: 10,
              border: `1px solid ${hoveredNav === btn.screen ? 'var(--p31-white-10)' : 'var(--p31-white-6)'}`,
              background: hoveredNav === btn.screen ? 'var(--p31-white-4)' : 'var(--p31-white-2)',
              color: hoveredNav === btn.screen ? 'var(--p31-cloud)' : 'var(--p31-cloud-50)',
              fontFamily: "'Press Start 2P', cursive",
              fontSize: 7,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 18 }}>{btn.icon}</span>
            <span>{btn.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function QuickStatCard({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        padding: '14px 10px',
        background: hovered ? 'var(--p31-white-4)' : 'var(--p31-white-2)',
        borderRadius: 10,
        border: `1px solid ${hovered ? 'var(--p31-white-10)' : 'var(--p31-white-6)'}`,
        transition: 'all 0.15s',
        cursor: 'default',
      }}
    >
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 8,
        color: 'var(--p31-cloud-40)',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'Press Start 2P', cursive",
        fontSize: 16,
        color: valueColor ?? 'var(--p31-cloud)',
      }}>
        {value}
      </div>
    </div>
  );
}
