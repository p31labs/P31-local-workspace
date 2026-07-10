import { useState } from 'react';
import { COLORS } from '../../../lib/arcade-core/theme.ts';
import { LeagueStandings, LeagueTier } from '../../../engine/bashball/types.ts';

interface StandingsViewProps {
  standings: LeagueStandings | null;
  userTeamName: string;
  tier: LeagueTier;
  onBack: () => void;
}

const TIER_LABELS: Record<LeagueTier, string> = {
  [LeagueTier.Rookie]: 'ROOKIE',
  [LeagueTier.Minor]: 'MINOR',
  [LeagueTier.Major]: 'MAJOR',
  [LeagueTier.World]: 'WORLD',
};

const TIER_COLORS: Record<LeagueTier, string> = {
  [LeagueTier.Rookie]: 'var(--p31-green)',
  [LeagueTier.Minor]: 'var(--p31-purple)',
  [LeagueTier.Major]: 'var(--p31-gold)',
  [LeagueTier.World]: 'var(--p31-rust)',
};

export function StandingsView({ standings, userTeamName, tier, onBack }: StandingsViewProps) {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredBack, setHoveredBack] = useState(false);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      maxWidth: 700,
      margin: '0 auto',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px',
        background: 'var(--p31-white-2)',
        borderRadius: 12,
        border: '1px solid var(--p31-white-6)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontFamily: "'Press Start 2P', cursive",
            fontSize: 14,
            color: 'var(--p31-rust)',
          }}>
            STANDINGS
          </span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            color: TIER_COLORS[tier],
            background: `${TIER_COLORS[tier]}18`,
            padding: '3px 10px',
            borderRadius: 6,
            border: `1px solid ${TIER_COLORS[tier]}30`,
          }}>
            {TIER_LABELS[tier]}
          </span>
        </div>
      </div>

      {!standings || standings.teams.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 40,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          color: 'var(--p31-cloud-40)',
          background: 'var(--p31-white-2)',
          borderRadius: 12,
          border: '1px solid var(--p31-white-6)',
        }}>
          Season not started
        </div>
      ) : (
        <div style={{
          background: 'var(--p31-white-2)',
          borderRadius: 12,
          border: '1px solid var(--p31-white-6)',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '30px 1fr 36px 36px 36px 40px 40px 40px',
            gap: 4,
            padding: '10px 14px',
            borderBottom: '1px solid var(--p31-white-6)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            color: 'var(--p31-cloud-40)',
          }}>
            <span>#</span>
            <span>Team</span>
            <span style={{ textAlign: 'center' }}>W</span>
            <span style={{ textAlign: 'center' }}>L</span>
            <span style={{ textAlign: 'center' }}>T</span>
            <span style={{ textAlign: 'center' }}>GB</span>
            <span style={{ textAlign: 'center' }}>RS</span>
            <span style={{ textAlign: 'center' }}>RA</span>
          </div>

          {standings.teams.map((entry, i) => {
            const isUser = entry.teamName === userTeamName;
            const isFirst = i === 0;
            const isHovered = hoveredRow === i;

            return (
              <div
                key={entry.teamId || entry.teamName}
                aria-label={`${i + 1}. ${entry.teamName} - ${entry.record.wins} wins, ${entry.record.losses} losses`}
                onMouseEnter={() => setHoveredRow(i)}
                onMouseLeave={() => setHoveredRow(null)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '30px 1fr 36px 36px 36px 40px 40px 40px',
                  gap: 4,
                  padding: '10px 14px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: isUser ? 'var(--p31-gold)' : isHovered ? 'var(--p31-cloud)' : 'var(--p31-cloud-70)',
                  background: isUser
                    ? 'var(--p31-gold-dim)'
                    : isHovered
                      ? 'var(--p31-white-3)'
                      : 'transparent',
                  borderBottom: i < standings.teams.length - 1 ? '1px solid var(--p31-white-3)' : 'none',
                  transition: 'all 0.12s',
                  fontWeight: isUser ? 700 : 400,
                }}
              >
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}>
                  {isFirst ? '👑' : i + 1}
                </span>
                <span style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {isUser ? `★ ${entry.teamName}` : entry.teamName}
                </span>
                <span style={{ textAlign: 'center' }}>{entry.record.wins}</span>
                <span style={{ textAlign: 'center' }}>{entry.record.losses}</span>
                <span style={{ textAlign: 'center' }}>{entry.record.ties}</span>
                <span style={{ textAlign: 'center' }}>{entry.gamesBack > 0 ? entry.gamesBack : '-'}</span>
                <span style={{ textAlign: 'center' }}>{entry.record.runsScored}</span>
                <span style={{ textAlign: 'center' }}>{entry.record.runsAllowed}</span>
              </div>
            );
          })}
        </div>
      )}

      <button
        aria-label="Back to dashboard"
        onClick={onBack}
        onMouseEnter={() => setHoveredBack(true)}
        onMouseLeave={() => setHoveredBack(false)}
        style={{
          alignSelf: 'center',
          padding: '12px 28px',
          borderRadius: 10,
          border: `1px solid ${hoveredBack ? 'var(--p31-cloud-20)' : 'var(--p31-white-10)'}`,
          background: hoveredBack ? 'var(--p31-white-4)' : 'transparent',
          color: 'var(--p31-cloud-50)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        ← BACK
      </button>
    </div>
  );
}
