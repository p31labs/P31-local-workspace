import { useState } from 'react';
import { COLORS } from '../../../lib/arcade-core/theme.ts';
import { Player, PlayerStats } from '../../../engine/bashball/types.ts';

interface PlayerCardProps {
  player: Player;
  highlightStat?: keyof PlayerStats;
  showTrainingGain?: number | null;
  trainingStat?: keyof PlayerStats;
  compact?: boolean;
}

const STAT_CONFIG: Record<keyof PlayerStats, { label: string; color: string }> = {
  power: { label: 'POW', color: 'var(--p31-rust)' },
  speed: { label: 'SPD', color: 'var(--p31-gold)' },
  stamina: { label: 'STA', color: 'var(--p31-purple)' },
  accuracy: { label: 'ACC', color: 'var(--p31-green)' },
};

const STAT_KEYS: (keyof PlayerStats)[] = ['power', 'speed', 'stamina', 'accuracy'];

export function PlayerCard({ player, highlightStat, showTrainingGain, trainingStat, compact }: PlayerCardProps) {
  const [hovered, setHovered] = useState(false);

  const barHeight = compact ? 4 : 6;
  const barRadius = compact ? 4 : 6;

  return (
    <div
      aria-label={`Player card: ${player.name}, ${player.position}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--p31-white-4)' : 'var(--p31-white-2)',
        border: `1px solid ${highlightStat ? 'var(--p31-gold)' : 'var(--p31-white-6)'}`,
        borderRadius: 10,
        padding: compact ? '10px 12px' : '14px 16px',
        transition: 'all 0.15s',
        cursor: 'default',
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: compact ? 8 : 10,
      }}>
        <span style={{
          fontFamily: "'Press Start 2P', cursive",
          fontSize: compact ? 8 : 10,
          color: 'var(--p31-cloud)',
        }}>
          {player.name}
        </span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: compact ? 8 : 9,
          color: 'var(--p31-rust)',
          background: 'var(--p31-rust-dim)',
          padding: '2px 8px',
          borderRadius: 6,
        }}>
          {player.position}
        </span>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: compact ? 'row' : 'column',
        gap: compact ? 6 : 5,
        flexWrap: compact ? 'wrap' : undefined,
      }}>
        {STAT_KEYS.map(stat => {
          const cfg = STAT_CONFIG[stat];
          const value = player.stats[stat];
          const isHighlighted = highlightStat === stat;
          const isTraining = trainingStat === stat && showTrainingGain != null;
          const barWidth = compact ? 'calc(50% - 3px)' : '100%';

          return (
            <div
              key={stat}
              aria-label={`${cfg.label}: ${value}`}
              style={{
                width: barWidth,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: compact ? 7 : 8,
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                <span style={{
                  color: isTraining ? cfg.color : isHighlighted ? 'var(--p31-gold)' : 'var(--p31-cloud-50)',
                  fontWeight: isTraining || isHighlighted ? 700 : 400,
                }}>
                  {cfg.label}
                </span>
                <span style={{
                  color: isTraining ? cfg.color : isHighlighted ? 'var(--p31-gold)' : 'var(--p31-cloud-40)',
                }}>
                  {isTraining ? `${Math.round(value)} +${showTrainingGain!.toFixed(1)}` : Math.round(value)}
                </span>
              </div>
              <div style={{
                width: '100%',
                height: barHeight,
                background: 'var(--p31-white-4)',
                borderRadius: barRadius,
                overflow: 'hidden',
                position: 'relative',
              }}>
                <div style={{
                  width: `${Math.min(100, Math.max(0, value))}%`,
                  height: '100%',
                  background: isTraining ? cfg.color : isHighlighted ? 'var(--p31-gold)' : cfg.color,
                  borderRadius: barRadius,
                  opacity: isTraining ? 1 : isHighlighted ? 0.9 : 0.7,
                  transition: 'width 0.3s ease, opacity 0.2s ease',
                  boxShadow: isTraining ? `0 0 8px ${cfg.color}` : undefined,
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
