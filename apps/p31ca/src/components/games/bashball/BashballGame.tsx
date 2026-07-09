import { useState, useCallback, useRef, useEffect } from 'react';
import { GameState, PlayEvent, Player, AtBatResult, PlayerStats } from '../../../engine/bashball/types.ts';
import { createGameState, createGameStateWithTeams, simulatePlay } from '../../../engine/bashball/gameLoop.ts';
import { Team } from '../../../engine/bashball/types.ts';
import { generateTeam } from '../../../engine/bashball/gameLoop.ts';
import { createMulberry32 } from '../../../engine/card/rng/mulberry32.ts';
import { eventDescription } from '../../../engine/bashball/atbat.ts';
import { BashballField } from './BashballField.tsx';

interface BashballGameProps {
  onScoreChange: (delta: number) => void;
  onComplete: () => void;
  onMoveMade: () => void;
  spoonLevel: number;
  playerTeam?: Player[];
  opponentName?: string;
  onGameResult?: (myScore: number, oppScore: number) => void;
  variant?: 'smallball' | 'classic';
}

type Screen =
  | { phase: 'intro' }
  | { phase: 'pregame' }
  | { phase: 'playing' }
  | { phase: 'result' };

const styles = `
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulseArrow {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 1; }
}
@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 4px rgba(204,98,71,0.2); }
  50% { box-shadow: 0 0 12px rgba(204,98,71,0.4); }
}
`;

function resultColor(result: AtBatResult): string {
  switch (result) {
    case 'HOME_RUN': return '#3ba372';
    case 'TRIPLE':
    case 'DOUBLE':
    case 'SINGLE': return '#7ec8e3';
    case 'WALK': return '#cda852';
    case 'STRIKEOUT': return '#cc6247';
    default: return 'rgba(232,230,227,0.55)';
  }
}

function isHit(result: AtBatResult): boolean {
  return result === 'SINGLE' || result === 'DOUBLE' || result === 'TRIPLE' || result === 'HOME_RUN';
}

function isPositive(result: AtBatResult): boolean {
  return isHit(result) || result === 'WALK';
}

function getStarPlayer(plays: PlayEvent[]): { name: string; count: number } | null {
  const counts: Record<string, number> = {};
  for (const p of plays) {
    if (isPositive(p.result)) {
      counts[p.batter] = (counts[p.batter] || 0) + 1;
    }
  }
  let best: { name: string; count: number } | null = null;
  for (const [name, count] of Object.entries(counts)) {
    if (!best || count > best.count) {
      best = { name, count };
    }
  }
  return best;
}

function getInningRuns(plays: PlayEvent[]): { away: number[]; home: number[] } {
  const away = new Array(9).fill(0);
  const home = new Array(9).fill(0);
  for (const p of plays) {
    const idx = p.inning - 1;
    if (idx >= 9) continue;
    if (p.top) {
      away[idx] += p.scoreAfter[0] - p.scoreBefore[0];
    } else {
      home[idx] += p.scoreAfter[1] - p.scoreBefore[1];
    }
  }
  return { away, home };
}

function BaseDiamond({ bases }: { bases: [boolean, boolean, boolean] }) {
  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <polygon points="55,8 100,55 55,102 10,55" fill="rgba(58,119,40,0.15)" stroke="rgba(232,230,227,0.12)" strokeWidth="1" />
      <line x1="55" y1="8" x2="100" y2="55" stroke="rgba(232,230,227,0.08)" strokeWidth="1" />
      <line x1="100" y1="55" x2="55" y2="102" stroke="rgba(232,230,227,0.08)" strokeWidth="1" />
      <line x1="55" y1="102" x2="10" y2="55" stroke="rgba(232,230,227,0.08)" strokeWidth="1" />
      <line x1="10" y1="55" x2="55" y2="8" stroke="rgba(232,230,227,0.08)" strokeWidth="1" />

      {bases[0] ? (
        <circle cx="97" cy="55" r="8" fill="rgba(255,255,255,0.9)" />
      ) : (
        <polygon points="94,55 97,52 100,55 97,58" fill="rgba(232,230,227,0.3)" />
      )}

      {bases[1] ? (
        <circle cx="55" cy="8" r="8" fill="rgba(255,255,255,0.9)" />
      ) : (
        <polygon points="55,5 58,8 55,11 52,8" fill="rgba(232,230,227,0.3)" />
      )}

      {bases[2] ? (
        <circle cx="13" cy="55" r="8" fill="rgba(255,255,255,0.9)" />
      ) : (
        <polygon points="10,55 13,52 16,55 13,58" fill="rgba(232,230,227,0.3)" />
      )}

      <polygon points="50,100 60,100 64,104 60,108 50,108 46,104" fill="rgba(232,230,227,0.25)" />
    </svg>
  );
}

export function BashballGame({ onScoreChange, onComplete, onMoveMade, spoonLevel, playerTeam, opponentName, onGameResult, variant = 'smallball' }: BashballGameProps) {
  const [screen, setScreen] = useState<Screen>({ phase: 'intro' });
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [teamName, setTeamName] = useState('Bash League');
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);
  const [lastPlayIdx, setLastPlayIdx] = useState(-1);
  const [elapsed, setElapsed] = useState(0);

  const spoonFactor = Math.max(0.3, Math.min(1.0, spoonLevel / 6));

  useEffect(() => {
    if (gameState && gameState.plays.length > prevCountRef.current) {
      setLastPlayIdx(gameState.plays.length - 1);
      prevCountRef.current = gameState.plays.length;
    }
  }, [gameState?.plays.length]);

  const startGame = useCallback(() => {
    const seed = Math.floor(Math.random() * 2147483647);
    const rng = createMulberry32(seed);
    let state: GameState;
    if (playerTeam && opponentName) {
      const awayTeam: Team = {
        id: teamName.toLowerCase().replace(/\s/g, ''),
        name: teamName,
        players: playerTeam,
        lineup: playerTeam.filter(p => p.position !== 'P').slice(0, 9),
        pitcher: playerTeam.find(p => p.position === 'P') || playerTeam[0],
      };
      const oppTeam = generateTeam(opponentName, rng);
      state = createGameStateWithTeams(awayTeam, oppTeam);
    } else {
      state = createGameState(teamName, opponentName || 'Cyclones', seed);
    }
    setGameState(state);
    setScreen({ phase: 'playing' });
    prevCountRef.current = 0;
    setLastPlayIdx(-1);
    setElapsed(0);
    onMoveMade();
  }, [teamName, onMoveMade, playerTeam, opponentName]);

  const handlePlayBall = useCallback(() => {
    if (!gameState || gameState.isComplete) return;
    const next = simulatePlay(gameState, spoonFactor);
    setGameState(next);
    onMoveMade();

    if (next.isComplete) {
      const myScore = next.top ? next.score[0] : next.score[1];
      const oppScore = next.top ? next.score[1] : next.score[0];
      const delta = myScore > oppScore ? 100 + (myScore - oppScore) * 10
        : myScore === oppScore ? 50 : -20;
      onScoreChange(delta);
      if (onGameResult) onGameResult(myScore, oppScore);
      setTimeout(() => {
        setScreen({ phase: 'result' });
        onComplete();
      }, 500);
    }
  }, [gameState, spoonFactor, onScoreChange, onComplete, onMoveMade, onGameResult]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [gameState?.plays.length]);

  useEffect(() => {
    if (screen.phase !== 'playing' || gameState?.isComplete) return;
    const timer = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timer);
  }, [screen.phase, gameState?.isComplete]);

  if (screen.phase === 'intro') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 24, textAlign: 'center', maxWidth: 500, margin: '0 auto',
      }}>
        <div style={{ fontSize: 72 }}>⚾</div>
        <h2 style={{
          fontFamily: "'Press Start 2P', cursive", fontSize: 16,
          color: '#cc6247', margin: 0,
        }}>
          BASHBALL
        </h2>
        <p style={{
          fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
          color: 'rgba(232,230,227,0.5)',
          maxWidth: 360, lineHeight: 1.8,
        }}>
          Markov chain baseball simulation. Manage your team, call the plays, and ride the spoon-fuelled RNG.
        </p>
        <button
          onClick={() => {
            if (playerTeam) { startGame(); }
            else { setScreen({ phase: 'pregame' }); }
          }}
          style={{
            padding: '16px 40px', borderRadius: 12,
            border: '2px solid #cc6247',
            background: 'rgba(204,98,71,0.1)',
            color: '#cc6247',
            fontFamily: "'Press Start 2P', cursive",
            fontSize: 12, cursor: 'pointer',
          }}
        >
          PLAY BALL
        </button>
      </div>
    );
  }

  if (screen.phase === 'pregame') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 20, maxWidth: 500, margin: '0 auto',
      }}>
        <h3 style={{
          fontFamily: "'Press Start 2P', cursive",
          fontSize: 12, color: '#cc6247',
        }}>
          TEAM SETUP
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 300 }}>
          <label style={{
            fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
            color: 'rgba(232,230,227,0.5)',
          }}>
            Your Team Name
          </label>
          <input
            value={teamName}
            onChange={e => setTeamName(e.target.value)}
            style={{
              padding: '10px 16px', borderRadius: 8,
              border: '1px solid rgba(204,98,71,0.3)',
              background: 'rgba(255,255,255,0.03)',
              color: '#e8e6e3',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 14, outline: 'none',
            }}
            maxLength={24}
          />
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={startGame}
            style={{
              padding: '14px 32px', borderRadius: 12,
              border: '2px solid #cc6247',
              background: 'rgba(204,98,71,0.15)',
              color: '#cc6247',
              fontFamily: "'Press Start 2P', cursive",
              fontSize: 10, cursor: 'pointer',
            }}
          >
            ⚾ PLAY GAME
          </button>
          <button
            onClick={() => setScreen({ phase: 'intro' })}
            style={{
              padding: '14px 24px', borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent',
              color: 'rgba(232,230,227,0.5)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11, cursor: 'pointer',
            }}
          >
            BACK
          </button>
        </div>
      </div>
    );
  }

  if (screen.phase === 'result') {
    if (!gameState) return null;
    const myScore = gameState.score[0];
    const oppScore = gameState.score[1];
    const won = myScore > oppScore;
    const { away: awayRuns, home: homeRuns } = getInningRuns(gameState.plays);
    const awayHits = gameState.plays.filter(p => p.top && isHit(p.result)).length;
    const homeHits = gameState.plays.filter(p => !p.top && isHit(p.result)).length;
    const star = getStarPlayer(gameState.plays);
    const totalPlays = gameState.plays.length;
    const durationLabel = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;
    const labelA = gameState.awayTeam.name === teamName ? 'YOUR TEAM' : gameState.awayTeam.name;
    const labelH = gameState.homeTeam.name === teamName ? 'YOUR TEAM' : gameState.homeTeam.name;

    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 20, textAlign: 'center',
      }}>
        <div style={{ fontSize: 64 }}>{won ? '🏆' : '😤'}</div>
        <h2 style={{
          fontFamily: "'Press Start 2P', cursive",
          fontSize: won ? 16 : 14,
          color: won ? '#3ba372' : '#cc6247',
        }}>
          {won ? 'VICTORY!' : 'LOSS'}
        </h2>
        <p style={{
          fontSize: 24, fontFamily: "'Press Start 2P', cursive",
          color: '#e8e6e3',
        }}>
          {myScore} - {oppScore}
        </p>

        <div style={{
          width: '100%', maxWidth: 460, padding: '16px 20px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
        }}>
          <div style={{
            fontFamily: "'Press Start 2P', cursive", fontSize: 10,
            color: '#cda852', marginBottom: 14,
          }}>
            GAME RECAP
          </div>
          <div style={{
            fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
            color: 'rgba(232,230,227,0.6)', marginBottom: 12,
          }}>
            Duration: {durationLabel} &middot; {totalPlays} plays
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '80px repeat(9, 26px) 32px',
            gap: '2px 0', justifyContent: 'center',
            fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
            marginBottom: 14,
          }}>
            <div />
            {[1,2,3,4,5,6,7,8,9].map(i => (
              <div key={i} style={{ color: 'rgba(232,230,227,0.35)', textAlign: 'center' }}>{i}</div>
            ))}
            <div style={{ color: 'rgba(232,230,227,0.6)', textAlign: 'center' }}>R</div>
            <div style={{ color: 'rgba(232,230,227,0.7)', textAlign: 'left' }}>{labelA}</div>
            {awayRuns.map((r, i) => (
              <div key={i} style={{ color: '#cc6247', textAlign: 'center' }}>{r}</div>
            ))}
            <div style={{ color: '#cc6247', textAlign: 'center', fontWeight: 'bold' }}>{myScore}</div>
            <div style={{ color: 'rgba(232,230,227,0.7)', textAlign: 'left' }}>{labelH}</div>
            {homeRuns.map((r, i) => (
              <div key={i} style={{ color: '#cda852', textAlign: 'center' }}>{r}</div>
            ))}
            <div style={{ color: '#cda852', textAlign: 'center', fontWeight: 'bold' }}>{oppScore}</div>
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-around', gap: 12,
            fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
          }}>
            <div>
              <div style={{ color: 'rgba(232,230,227,0.35)', fontSize: 9 }}>HITS</div>
              <div style={{ color: '#7ec8e3' }}>{labelA}: {awayHits}</div>
              <div style={{ color: '#7ec8e3' }}>{labelH}: {homeHits}</div>
            </div>
            {star && (
              <div>
                <div style={{ color: 'rgba(232,230,227,0.35)', fontSize: 9 }}>STAR PLAYER</div>
                <div style={{ color: '#cda852', fontSize: 10 }}>{star.name}</div>
                <div style={{ color: 'rgba(232,230,227,0.5)', fontSize: 9 }}>
                  {star.count} positive {star.count === 1 ? 'result' : 'results'}
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            setScreen({ phase: 'intro' });
            setGameState(null);
          }}
          style={{
            padding: '14px 32px', borderRadius: 12,
            border: '2px solid #cc6247',
            background: 'rgba(204,98,71,0.1)',
            color: '#cc6247',
            fontFamily: "'Press Start 2P', cursive",
            fontSize: 10, cursor: 'pointer',
          }}
        >
          PLAY AGAIN
        </button>
      </div>
    );
  }

  if (!gameState) return null;

  const { away: awayRuns, home: homeRuns } = getInningRuns(gameState.plays);
  const { inning, top, outs, bases, score, balls, strikes, currentBatter, currentPitcher, awayTeam, homeTeam, plays, isComplete } = gameState;
  const labelA = awayTeam.name === teamName ? 'YOUR TEAM' : awayTeam.name;
  const labelH = homeTeam.name === teamName ? 'YOUR TEAM' : homeTeam.name;

  function inningDisplay(innNum: number, half: 'away' | 'home'): string {
    const idx = innNum - 1;
    if (innNum > inning) return '-';
    if (innNum < inning) {
      const val = half === 'away' ? awayRuns[idx] : homeRuns[idx];
      return String(val);
    }
    if (innNum === inning) {
      if (half === 'away') return String(awayRuns[idx]);
      if (top) return '-';
      return String(homeRuns[idx]);
    }
    return '-';
  }

  const recentPlays = plays.slice(-25);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 700, margin: '0 auto' }}>
      <style>{styles}</style>

      <div style={{
        padding: '14px 16px 12px',
        background: 'rgba(58,119,40,0.05)',
        borderRadius: 12,
        border: '1px solid rgba(58,119,40,0.12)',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '76px repeat(9, 28px) 32px',
          gap: '1px 0',
          justifyContent: 'center',
          fontSize: 10,
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          <div />
          {[1,2,3,4,5,6,7,8,9].map(i => (
            <div key={i} style={{
              textAlign: 'center',
              color: i === inning ? '#e8e6e3' : 'rgba(232,230,227,0.3)',
              fontWeight: i === inning ? 'bold' : 'normal',
              paddingBottom: 4,
            }}>
              {i}
            </div>
          ))}
          <div style={{ textAlign: 'center', color: 'rgba(232,230,227,0.5)', paddingBottom: 4 }}>R</div>

          <div style={{
            color: 'rgba(232,230,227,0.6)', fontSize: 9, textAlign: 'left',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: '20px',
          }}>
            {labelA}
          </div>
          {[1,2,3,4,5,6,7,8,9].map(i => {
            const display = inningDisplay(i, 'away');
            return (
              <div key={i} style={{
                textAlign: 'center',
                color: '#cc6247',
                lineHeight: '20px',
                background: i === inning && top ? 'rgba(204,98,71,0.08)' : 'transparent',
                borderRadius: i === inning && top ? 4 : 0,
              }}>
                {display}
              </div>
            );
          })}
          <div style={{
            textAlign: 'center', color: '#cc6247',
            fontWeight: 'bold', lineHeight: '20px',
          }}>
            {score[0]}
          </div>

          <div style={{
            color: 'rgba(232,230,227,0.6)', fontSize: 9, textAlign: 'left',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: '20px',
          }}>
            {labelH}
          </div>
          {[1,2,3,4,5,6,7,8,9].map(i => {
            const display = inningDisplay(i, 'home');
            return (
              <div key={i} style={{
                textAlign: 'center',
                color: '#cda852',
                lineHeight: '20px',
                background: i === inning && !top ? 'rgba(205,168,82,0.08)' : 'transparent',
                borderRadius: i === inning && !top ? 4 : 0,
              }}>
                {display}
              </div>
            );
          })}
          <div style={{
            textAlign: 'center', color: '#cda852',
            fontWeight: 'bold', lineHeight: '20px',
          }}>
            {score[1]}
          </div>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 10, paddingTop: 10,
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: 'rgba(232,230,227,0.35)' }}>
              AWAY
            </div>
            <div style={{ fontSize: 22, fontFamily: "'Press Start 2P', cursive", color: '#cc6247' }}>
              {score[0]}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 11,
              fontFamily: "'Press Start 2P', cursive",
              color: '#8b7cc9',
            }}>
              <span style={{
                display: 'inline-block',
                animation: 'none',
              }}>
                {top ? '▲' : '▼'}
              </span>
              {' '}INNING {inning}
            </div>
            <div style={{
              fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace",
              color: 'rgba(232,230,227,0.5)',
              marginTop: 4,
            }}>
              {outs} OUT{outs !== 1 ? 'S' : ''}
            </div>
            <div style={{
              fontSize: 9,
              fontFamily: "'JetBrains Mono', monospace",
              color: 'rgba(232,230,227,0.35)',
              marginTop: 4,
            }}>
              ⏱ {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
            </div>
            <div style={{
              fontSize: 9,
              fontFamily: "'JetBrains Mono', monospace",
              color: 'rgba(232,230,227,0.25)',
              marginTop: 4,
            }}>
              🥄 {spoonFactor.toFixed(1)}x
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: 'rgba(232,230,227,0.35)' }}>
              HOME
            </div>
            <div style={{ fontSize: 22, fontFamily: "'Press Start 2P', cursive", color: '#cda852' }}>
              {score[1]}
            </div>
          </div>
        </div>
      </div>

      {variant === 'smallball' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 18,
            background: '#05070a', borderRadius: 10, padding: '8px 14px',
            border: '1px solid rgba(205,168,82,0.25)',
            fontFamily: "'Press Start 2P', monospace",
          }}>
            <span style={{ color: '#cda852', fontSize: 10 }}>B {balls}</span>
            <span style={{ color: '#cda852', fontSize: 10 }}>S {strikes}</span>
            <span style={{ color: '#cda852', fontSize: 10 }}>O {outs}</span>
            <span style={{ color: '#7ec8e3', fontSize: 10 }}>⏱ {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</span>
          </div>
          <BashballField bases={bases} spoonLevel={spoonLevel} />
        </div>
      ) : (
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: '8px 0',
          background: 'rgba(58,119,40,0.03)',
          borderRadius: 12,
          border: '1px solid rgba(58,119,40,0.08)',
        }}>
          <BaseDiamond bases={bases} />
        </div>
      )}

      <div
        ref={scrollRef}
        style={{
          maxHeight: 240,
          overflowY: 'auto',
          padding: '12px 14px',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        {plays.length === 0 && (
          <div style={{
            textAlign: 'center', fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            color: 'rgba(232,230,227,0.3)',
            padding: 20,
          }}>
            Batter up! Press "PLAY" to start.
          </div>
        )}
        {recentPlays.map((play, i) => {
          const isNew = plays.indexOf(play) === lastPlayIdx;
          return (
            <div key={plays.indexOf(play)} style={{
              animation: isNew ? 'fadeSlideIn 0.35s ease-out' : 'none',
            }}>
              <div style={{
                display: 'flex', gap: 6, alignItems: 'baseline',
                padding: '6px 0 2px',
              }}>
                <span style={{
                  fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                  color: 'rgba(232,230,227,0.25)', minWidth: 34,
                }}>
                  {play.inning}{play.top ? '▲' : '▼'}
                </span>
                <span style={{
                  fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                  color: '#8b7cc9',
                }}>
                  {play.batter}
                </span>
                <span style={{
                  fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                  color: 'rgba(232,230,227,0.25)',
                }}>
                  vs. {play.pitcher}
                </span>
              </div>
              <div style={{
                display: 'flex', gap: 6,
                padding: '0 0 4px 40px',
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                color: resultColor(play.result),
                borderBottom: i < recentPlays.length - 1
                  ? '1px solid rgba(255,255,255,0.03)' : 'none',
              }}>
                {play.result === 'HOME_RUN' && <span>🔥</span>}
                {play.result === 'STRIKEOUT' && <span>💀</span>}
                {play.result === 'WALK' && <span>🚶</span>}
                {isHit(play.result) && play.result !== 'HOME_RUN' && <span>💪</span>}
                <span style={{ flex: 1 }}>{play.description}</span>
              </div>
            </div>
          );
        })}
      </div>

      {!isComplete && (
        <button
          onClick={handlePlayBall}
          style={{
            padding: '14px 24px',
            borderRadius: 12,
            border: '2px solid #cc6247',
            background: 'rgba(204,98,71,0.12)',
            color: '#cc6247',
            fontFamily: "'Press Start 2P', cursive",
            fontSize: 10,
            cursor: 'pointer',
            transition: 'all 0.15s',
                animation: 'none',
                display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            width: '100%',
          }}
        >
          <span>⚾</span>
          <span>BATTER: {currentBatter.name.toUpperCase()}</span>
        </button>
      )}

      {isComplete && (
        <div style={{
          textAlign: 'center', fontSize: 12,
          fontFamily: "'Press Start 2P', cursive",
          color: '#cda852',
          padding: 12,
        }}>
          GAME OVER — {score[0]} - {score[1]}
        </div>
      )}
    </div>
  );
}
