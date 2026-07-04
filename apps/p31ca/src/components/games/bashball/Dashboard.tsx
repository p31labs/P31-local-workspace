import { useState } from 'react';
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

const WIN_PCT_COLORS = ['#cc6247', '#cc6247', '#cc6247', '#cda852', '#cda852', '#8b7cc9', '#3ba372', '#3ba372', '#3ba372', '#3ba372', '#3ba372'];

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
        background: 'rgba(255,255,255,0.02)',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div>
          <div style={{
            fontFamily: "'Press Start 2P', cursive",
            fontSize: 14,
            color: '#e8e6e3',
          }}>
            {teamState.name}
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            color: 'rgba(232,230,227,0.4)',
            marginTop: 6,
          }}>
            {tierBadge(teamState.tier)} · Season {teamState.season}
          </div>
        </div>
        <div style={{
          fontFamily: "'Press Start 2P', cursive",
          fontSize: 16,
          color: '#cda852',
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
        <div style={{ width: '100%', padding: '6px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: 'rgba(232,230,227,0.4)', marginBottom: 4 }}>
            <span>Season {seasonProgress}/{seasonTotal}</span>
            <span>{Math.round((seasonProgress / seasonTotal) * 100)}%</span>
          </div>
          <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${(seasonProgress / seasonTotal) * 100}%`, height: '100%', background: '#cc6247', borderRadius: 2, transition: 'width 0.3s' }} />
          </div>
        </div>
      )}
      {seasonComplete && (
        <div style={{ width: '100%', padding: '12px 16px', background: 'rgba(205,168,82,0.08)', border: '1px solid rgba(205,168,82,0.2)', borderRadius: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 10, fontFamily: "'Press Start 2P', cursive", color: '#cda852', marginBottom: 4 }}>
            SEASON COMPLETE
          </p>
          <p style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: 'rgba(232,230,227,0.5)' }}>
            {teamState.record.wins}W - {teamState.record.losses}L
            {tier && ` — ${tierBadge(tier!)}`}
          </p>
        </div>
      )}

      {seasonComplete && (
        <button onClick={() => onNavigate('play')} style={{
          padding: '12px 28px', borderRadius: 10,
          border: '2px solid #cda852', background: 'rgba(205,168,82,0.1)',
          color: '#cda852', fontFamily: "'Press Start 2P', cursive", fontSize: 10,
          cursor: 'pointer',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(205,168,82,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(205,168,82,0.1)'; }}
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
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: 'rgba(232,230,227,0.4)',
              marginBottom: 4,
            }}>
              NEXT GAME
            </div>
            <div style={{
              fontFamily: "'Press Start 2P', cursive",
              fontSize: 10,
              color: '#e8e6e3',
            }}>
              vs {nextGame.opponent}
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: nextGame.isHome ? '#3ba372' : '#8b7cc9',
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
              border: '2px solid #cc6247',
              background: hoveredNav === 'play-btn' ? 'rgba(204,98,71,0.2)' : 'rgba(204,98,71,0.1)',
              color: '#cc6247',
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
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            color: 'rgba(232,230,227,0.4)',
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
                    background: isUser ? 'rgba(205,168,82,0.08)' : 'transparent',
                    border: isUser ? '1px solid rgba(205,168,82,0.15)' : '1px solid transparent',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    color: isUser ? '#cda852' : 'rgba(232,230,227,0.6)',
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
                background: 'rgba(205,168,82,0.08)',
                border: '1px solid rgba(205,168,82,0.15)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: '#cda852',
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
              color: hoveredLink === 'standings' ? '#8b7cc9' : 'rgba(232,230,227,0.4)',
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
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            color: 'rgba(232,230,227,0.4)',
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
                  background: 'rgba(255,255,255,0.02)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: 'rgba(232,230,227,0.6)',
                }}
              >
                <span>{r.playerName}</span>
                <span style={{ color: '#3ba372' }}>
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
              color: hoveredLink === 'train' ? '#8b7cc9' : 'rgba(232,230,227,0.4)',
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
              border: `1px solid ${hoveredNav === btn.screen ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)'}`,
              background: hoveredNav === btn.screen ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
              color: hoveredNav === btn.screen ? '#e8e6e3' : 'rgba(232,230,227,0.5)',
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
        background: hovered ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
        borderRadius: 10,
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)'}`,
        transition: 'all 0.15s',
        cursor: 'default',
      }}
    >
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 8,
        color: 'rgba(232,230,227,0.4)',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'Press Start 2P', cursive",
        fontSize: 16,
        color: valueColor ?? '#e8e6e3',
      }}>
        {value}
      </div>
    </div>
  );
}
