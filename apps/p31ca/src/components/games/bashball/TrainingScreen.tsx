import { useState, useEffect, useCallback } from 'react';
import { Player, SkillCategory, PlayerStats } from '../../../engine/bashball/types.ts';
import { SKILL_STAT_MAP, SKILL_LABELS } from '../../../engine/bashball/training.ts';
import { PlayerCard } from './PlayerCard.tsx';

interface TrainingScreenProps {
  roster: Player[];
  sessionsToday: number;
  maxSessions: number;
  eliteUnlocked: boolean;
  onTrain: (playerIndex: number, skill: SkillCategory) => void;
  onBack: () => void;
}

const SKILLS: SkillCategory[] = ['hitting', 'pitching', 'fielding', 'running'];

const SKILL_BUTTON_COLORS: Record<SkillCategory, string> = {
  hitting: '#cc6247',
  pitching: '#3ba372',
  fielding: '#8b7cc9',
  running: '#cda852',
};

const SKILL_BUTTON_LABELS: Record<SkillCategory, string> = {
  hitting: 'H',
  pitching: 'P',
  fielding: 'F',
  running: 'R',
};

interface FlashState {
  playerIndex: number;
  stat: keyof PlayerStats;
  gain: number;
}

export function TrainingScreen({ roster, sessionsToday, maxSessions, eliteUnlocked, onTrain, onBack }: TrainingScreenProps) {
  const [flash, setFlash] = useState<FlashState | null>(null);
  const [hoveredSkill, setHoveredSkill] = useState<{ player: number; skill: SkillCategory } | null>(null);
  const [hoveredBack, setHoveredBack] = useState(false);

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), 1000);
    return () => clearTimeout(timer);
  }, [flash]);

  const handleTrain = useCallback((playerIndex: number, skill: SkillCategory) => {
    const stat = SKILL_STAT_MAP[skill];
    const player = roster[playerIndex];
    const currentVal = player.stats[stat];
    const gain = Math.max(0.1, Math.min(5, ((currentVal < 100 ? 0.2 : 0) * (eliteUnlocked ? 2 : 1) * Math.max(0.05, (100 - currentVal) / 100))));
    const finalGain = Math.round(gain * 100) / 100;
    setFlash({ playerIndex, stat, gain: finalGain });
    onTrain(playerIndex, skill);
  }, [roster, eliteUnlocked, onTrain]);

  const limitReached = sessionsToday >= maxSessions;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      maxWidth: 800,
      margin: '0 auto',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 18px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          fontFamily: "'Press Start 2P', cursive",
          fontSize: 14,
          color: '#cc6247',
        }}>
          TRAINING
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: limitReached ? '#cc6247' : 'rgba(232,230,227,0.6)',
        }}>
          {sessionsToday}/{maxSessions} sessions today
          {eliteUnlocked && (
            <span style={{ color: '#cda852', marginLeft: 8 }}>ELITE</span>
          )}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 14,
      }}>
        {roster.map((player, pIdx) => {
          const playerFlash = flash?.playerIndex === pIdx ? flash : null;

          return (
            <div key={player.id} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}>
              <PlayerCard
                player={player}
                showTrainingGain={playerFlash?.gain ?? null}
                trainingStat={playerFlash?.stat ?? undefined}
                compact
              />

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 4,
              }}>
                {SKILLS.map(skill => {
                  const statKey = SKILL_STAT_MAP[skill];
                  const isMaxed = player.stats[statKey] >= 100;
                  const isHovered = hoveredSkill?.player === pIdx && hoveredSkill?.skill === skill;
                  const isThisFlashing = playerFlash?.stat === statKey;
                  const disabled = limitReached || isMaxed;

                  return (
                    <div key={skill} style={{ position: 'relative' }}>
                      <button
                        aria-label={`Train ${SKILL_LABELS[skill]}`}
                        disabled={disabled}
                        onClick={() => !disabled && handleTrain(pIdx, skill)}
                        onMouseEnter={() => setHoveredSkill({ player: pIdx, skill })}
                        onMouseLeave={() => setHoveredSkill(null)}
                        style={{
                          width: '100%',
                          height: 28,
                          borderRadius: 8,
                          border: `1px solid ${isThisFlashing ? SKILL_BUTTON_COLORS[skill] : disabled ? 'rgba(255,255,255,0.06)' : SKILL_BUTTON_COLORS[skill]}`,
                          background: disabled
                            ? 'rgba(255,255,255,0.02)'
                            : isThisFlashing
                              ? `${SKILL_BUTTON_COLORS[skill]}40`
                              : isHovered
                                ? `${SKILL_BUTTON_COLORS[skill]}25`
                                : `${SKILL_BUTTON_COLORS[skill]}12`,
                          color: disabled ? 'rgba(232,230,227,0.25)' : isThisFlashing ? SKILL_BUTTON_COLORS[skill] : SKILL_BUTTON_COLORS[skill],
                          fontFamily: "'Press Start 2P', cursive",
                          fontSize: 7,
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                        }}
                      >
                        {isMaxed ? 'MAX' : SKILL_BUTTON_LABELS[skill]}
                      </button>
                      {disabled && !isMaxed && (
                        <div
                          role="tooltip"
                          style={{
                            position: 'absolute',
                            bottom: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            marginBottom: 4,
                            padding: '4px 8px',
                            borderRadius: 6,
                            background: 'rgba(0,0,0,0.9)',
                            color: 'rgba(232,230,227,0.7)',
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 7,
                            whiteSpace: 'nowrap',
                            pointerEvents: 'none',
                            opacity: isHovered ? 1 : 0,
                            transition: 'opacity 0.15s',
                            zIndex: 10,
                          }}
                        >
                          Limit reached
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <button
        aria-label="Back to dashboard"
        onClick={onBack}
        onMouseEnter={() => setHoveredBack(true)}
        onMouseLeave={() => setHoveredBack(false)}
        style={{
          alignSelf: 'center',
          padding: '12px 28px',
          borderRadius: 10,
          border: `1px solid ${hoveredBack ? 'rgba(232,230,227,0.2)' : 'rgba(255,255,255,0.1)'}`,
          background: hoveredBack ? 'rgba(255,255,255,0.04)' : 'transparent',
          color: 'rgba(232,230,227,0.5)',
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
