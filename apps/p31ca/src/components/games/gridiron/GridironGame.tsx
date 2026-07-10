import { useState, useCallback, useRef, useEffect } from 'react';
import { GameState, DriveEvent, PlayType } from '../../../engine/gridiron/types.ts';
import { createGameState, simulatePlay } from '../../../engine/gridiron/gameLoop.ts';
import { createMulberry32 } from '../../../engine/card/rng/mulberry32.ts';
import { COLORS } from '../../../lib/arcade-core/theme.ts';

interface GridironGameProps {
  onScoreChange: (delta: number) => void;
  onComplete: () => void;
  onMoveMade: () => void;
  spoonLevel: number;
  teamName: string;
  opponentName: string;
  onGameResult?: (myScore: number, oppScore: number) => void;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function yardLineLabel(yardLine: number, possession: 'home' | 'away'): string {
  if (yardLine <= 50) {
    return possession === 'home' ? `own ${yardLine}` : `opp ${yardLine}`;
  }
  const flipped = 100 - yardLine;
  return possession === 'home' ? `opp ${flipped}` : `own ${flipped}`;
}

function downLabel(down: number): string {
  switch (down) {
    case 1: return '1st';
    case 2: return '2nd';
    case 3: return '3rd';
    case 4: return '4th';
    default: return `${down}th`;
  }
}

function resultColor(event: DriveEvent): string {
  if (event.result.isTouchdown) return 'var(--p31-green)';
  if (event.result.isFieldGoal) return 'var(--p31-gold)';
  if (event.result.isTurnover) return 'var(--p31-rust)';
  return 'var(--p31-cloud)';
}

function accumulateDriveStats(drives: DriveEvent[], fromIndex: number): { plays: number; yards: number; time: number } | null {
  const events: DriveEvent[] = [];
  let i = fromIndex;
  while (i < drives.length) {
    events.push(drives[i]);
    if (drives[i].result.isTouchdown || drives[i].result.isFieldGoal || drives[i].result.isSafety || drives[i].playType === 'PUNT' || drives[i].result.isTurnover) {
      break;
    }
    if (drives[i].down === 4 && !drives[i].result.isFirstDown) {
      break;
    }
    i++;
  }
  if (events.length === 0) return null;
  const yards = events.reduce((sum, e) => sum + e.result.gain, 0);
  const time = events.reduce((sum, e) => sum + e.result.clockSeconds, 0);
  return { plays: events.length, yards: Math.round(yards * 10) / 10, time };
}

function getLastDriveResult(drives: DriveEvent[], fromIndex: number): string {
  for (let i = fromIndex; i < drives.length; i++) {
    if (drives[i].result.isTouchdown) return 'TOUCHDOWN';
    if (drives[i].result.isFieldGoal) return 'FIELD GOAL';
    if (drives[i].result.isSafety) return 'SAFETY';
    if (drives[i].playType === 'PUNT') return 'PUNT';
    if (drives[i].result.isTurnover) return 'TURNOVER';
  }
  return 'IN PROGRESS';
}

export function GridironGame({
  onScoreChange, onComplete, onMoveMade, spoonLevel, teamName, opponentName, onGameResult,
}: GridironGameProps) {
  const [game, setGame] = useState<GameState | null>(null);
  const [selectedPlay, setSelectedPlay] = useState<PlayType>('RUN');
  const [isSimulating, setIsSimulating] = useState(false);
  const [driveStartIndex, setDriveStartIndex] = useState<number | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);
  const keyRef = useRef(0);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const rng = createMulberry32(Date.now());
    const state = createGameState(teamName, opponentName, rng.seed);
    const homeIdx = state.homeTeam.name === teamName ? 1 : 0;
    const adjustedState = { ...state, possession: homeIdx === 1 ? 'home' as const : 'away' as const, drive: { ...state.drive, possession: homeIdx === 1 ? 'home' as const : 'away' as const } };
    setGame(adjustedState);
    setDriveStartIndex(0);
  }, [teamName, opponentName]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [game?.drives.length]);

  useEffect(() => {
    if (game?.isComplete && onGameResult) {
      const homeIdx = game.homeTeam.name === teamName ? 1 : 0;
      onGameResult(game.score[homeIdx], game.score[1 - homeIdx]);
      onComplete();
    }
  }, [game?.isComplete]);

  const homeIdx = game ? (game.homeTeam.name === teamName ? 1 : 0) : 1;
  const myScore = game ? game.score[homeIdx] : 0;
  const oppScore = game ? game.score[1 - homeIdx] : 0;
  const myTeam = game ? (homeIdx === 1 ? game.homeTeam : game.awayTeam) : null;
  const oppTeam = game ? (homeIdx === 1 ? game.awayTeam : game.homeTeam) : null;
  const isMyPos = game ? game.drive.possession === (homeIdx === 1 ? 'home' : 'away') : false;

  const handleSnap = useCallback(() => {
    if (!game || isSimulating || game.isComplete) return;
    setIsSimulating(true);

    setTimeout(() => {
      let current = game;
      const rng = createMulberry32(keyRef.current++);
      const spoonFactor = Math.max(0.3, Math.min(1, spoonLevel / 6));

      let playType = selectedPlay;
      if (!isMyPos) {
        playType = ['RUN', 'RUN', 'PASS', 'PASS', 'PASS'][rng.int(5)] as PlayType;
        setSelectedPlay(playType);
      }

      const simState = simulatePlay(current, rng, { spoonFactor, playerTeam: homeIdx === 1 ? 'home' : 'away' });
      const newDrives = simState.drives;
      const lastEvent = newDrives[newDrives.length - 1];
      const prevScore = lastEvent.scoreBefore;
      const newScore = lastEvent.scoreAfter;

      const myPrev = prevScore[homeIdx];
      const myNow = newScore[homeIdx];
      if (myNow > myPrev) onScoreChange(myNow - myPrev);

      onMoveMade();
      setGame(simState);

      const driveEnded = lastEvent.result.isTouchdown || lastEvent.result.isFieldGoal || lastEvent.result.isSafety || lastEvent.playType === 'PUNT' || lastEvent.result.isTurnover || (lastEvent.down === 4 && !lastEvent.result.isFirstDown && !['PUNT', 'FIELD_GOAL'].includes(lastEvent.playType));
      if (driveEnded) {
        setDriveStartIndex(newDrives.length);
      }

      setIsSimulating(false);
    }, 100);
  }, [game, isSimulating, selectedPlay, isMyPos, homeIdx, onScoreChange, onMoveMade]);

  if (!game || !myTeam || !oppTeam) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', color: 'var(--p31-cloud-50)', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
        Loading...
      </div>
    );
  }

  const showPlayCall = !game.isComplete && !game.kickoffPending;

  const canKick = game.drive.down === 4;
  const fieldGoalRange = 100 - game.drive.yardLine + 17 <= 52;

  const driveStats = driveStartIndex !== null ? accumulateDriveStats(game.drives, driveStartIndex) : null;

  return (
    <div style={{ maxWidth: 820, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12, padding: '0 12px' }}>
      <style>{`
@keyframes fadeSlideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulseGlow { 0%,100% { box-shadow: 0 0 4px var(--p31-gold-border); } 50% { box-shadow: 0 0 14px var(--p31-gold-border); } }
`}</style>

      {/* Scoreboard */}
      <div style={{ background: 'rgba(15,17,21,0.95)', border: '1px solid var(--p31-gold-border)', borderRadius: 10, padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 9, color: 'var(--p31-gold)', letterSpacing: '0.05em' }}>
            Q{game.quarter}
          </span>
          <span style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 9, color: 'var(--p31-gold)', letterSpacing: '0.05em' }}>
            {formatTime(game.timeRemaining)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
            <span style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 20, color: homeIdx === 1 ? 'var(--p31-cloud)' : 'var(--p31-gold)', minWidth: 60, textAlign: 'center' }}>
              {game.score[homeIdx]}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--p31-cloud-60)' }}>
                {myTeam.name.length > 16 ? myTeam.name.slice(0, 16) : myTeam.name}
              </span>
              {isMyPos && !game.isComplete && (
                <span style={{ fontSize: 10 }}>🏈</span>
              )}
            </div>
          </div>
          <div style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 8, color: 'var(--p31-cloud-20)', padding: '0 8px' }}>
            VS
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, flexDirection: 'row-reverse' }}>
            <span style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 20, color: homeIdx === 1 ? 'var(--p31-gold)' : 'var(--p31-cloud)', minWidth: 60, textAlign: 'center' }}>
              {game.score[1 - homeIdx]}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--p31-cloud-60)' }}>
                {oppTeam.name.length > 16 ? oppTeam.name.slice(0, 16) : oppTeam.name}
              </span>
              {!isMyPos && !game.isComplete && (
                <span style={{ fontSize: 10 }}>🏈</span>
              )}
            </div>
          </div>
        </div>
        {!game.isComplete && !game.kickoffPending && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--p31-cloud-50)' }}>
            <span style={{ color: 'var(--p31-gold)' }}>{downLabel(game.drive.down)} & {game.drive.distance}</span>
            <span>{yardLineLabel(game.drive.yardLine, game.drive.possession)}</span>
          </div>
        )}
        {game.kickoffPending && !game.isComplete && (
          <div style={{ textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--p31-cloud-40)' }}>
            Kickoff pending — snap to start
          </div>
        )}
      </div>

      {/* LCD status strip — retro scoreboard band (T7 facelift) */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 18,
        background: 'var(--p31-deep-void)', borderRadius: 10, padding: '8px 14px',
        border: '1px solid var(--p31-gold-border)',
        fontFamily: "'Press Start 2P', monospace",
      }}>
        <span style={{ color: 'var(--p31-gold)', fontSize: 10 }}>Q{game.quarter}</span>
        <span style={{ color: 'var(--p31-gold)', fontSize: 10 }}>⏱ {formatTime(game.timeRemaining)}</span>
        {!game.isComplete && !game.kickoffPending && (
          <span style={{ color: 'var(--p31-ice)', fontSize: 10 }}>{downLabel(game.drive.down)} & {game.drive.distance}</span>
        )}
        <span style={{ color: 'var(--p31-cloud-50)', fontSize: 10 }}>{yardLineLabel(game.drive.yardLine, game.drive.possession)}</span>
      </div>

      {/* Field */}
      <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--p31-white-6)' }}>
        <svg width="100%" height="100" viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
          <rect x="0" y="0" width="1000" height="400" fill="rgba(58,119,40,0.3)" />
          <rect x="0" y="0" width="60" height="400" fill="rgba(180,40,40,0.4)" />
          <rect x="940" y="0" width="60" height="400" fill="rgba(40,60,180,0.4)" />
          {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((yd) => {
            const x = 60 + (yd / 100) * 880;
            const label = yd === 50 ? '50' : yd === 0 ? 'G' : yd === 100 ? 'G' : `${yd > 50 ? 100 - yd : yd}`;
            return (
              <g key={yd}>
                <line x1={x} y1="0" x2={x} y2="400" stroke="var(--p31-white-12)" strokeWidth={yd === 50 ? 2 : 1} />
                {yd > 0 && yd < 100 && (
                  <text x={x} y="390" fill="rgba(255,255,255,0.2)" fontSize="22" textAnchor="middle" fontFamily="'Press Start 2P', cursive">{label}</text>
                )}
              </g>
            );
          })}
          {game.drive.yardLine > 0 && (
            <line x1={60 + (game.drive.yardLine / 100) * 880} y1="0" x2={60 + (game.drive.yardLine / 100) * 880} y2="400" stroke="var(--p31-cloud)" strokeWidth="3" />
          )}
          {(() => {
            const firstDownYard = Math.min(100, game.drive.yardLine + game.drive.distance);
            return (
              <line x1={60 + (firstDownYard / 100) * 880} y1="0" x2={60 + (firstDownYard / 100) * 880} y2="400" stroke="var(--p31-gold)" strokeWidth="2" strokeDasharray="8,6" />
            );
          })()}
          {game.drive.yardLine > 0 && (
            <ellipse cx={60 + (game.drive.yardLine / 100) * 880} cy="200" rx="8" ry="5" fill="#8B4513" />
          )}
          <text x="30" y="210" fill="rgba(255,255,255,0.3)" fontSize="16" textAnchor="middle" fontFamily="'Press Start 2P', cursive">{game.homeTeam.name.charAt(0)}</text>
          <text x="970" y="210" fill="rgba(255,255,255,0.3)" fontSize="16" textAnchor="middle" fontFamily="'Press Start 2P', cursive">{game.awayTeam.name.charAt(0)}</text>
        </svg>
      </div>

      {/* Play call */}
      {showPlayCall && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {isMyPos ? (
            <>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => setSelectedPlay('RUN')} disabled={isSimulating}
                  style={{ padding: '10px 24px', borderRadius: 8, border: `1px solid ${selectedPlay === 'RUN' ? 'var(--p31-gold-border)' : 'var(--p31-white-6)'}`, background: selectedPlay === 'RUN' ? 'var(--p31-gold-dim)' : 'var(--p31-white-2)', color: selectedPlay === 'RUN' ? 'var(--p31-gold)' : 'var(--p31-cloud-50)', fontFamily: "'Press Start 2P', cursive", fontSize: 10, cursor: isSimulating ? 'not-allowed' : 'pointer', opacity: isSimulating ? 0.5 : 1, transition: 'all 0.15s' }}
                  onMouseEnter={e => { if (!isSimulating) e.currentTarget.style.background = 'var(--p31-gold-border)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = selectedPlay === 'RUN' ? 'var(--p31-gold-dim)' : 'var(--p31-white-2)'; }}>
                  RUN
                </button>
                <button onClick={() => setSelectedPlay('PASS')} disabled={isSimulating}
                  style={{ padding: '10px 24px', borderRadius: 8, border: `1px solid ${selectedPlay === 'PASS' ? 'var(--p31-gold-border)' : 'var(--p31-white-6)'}`, background: selectedPlay === 'PASS' ? 'var(--p31-gold-dim)' : 'var(--p31-white-2)', color: selectedPlay === 'PASS' ? 'var(--p31-gold)' : 'var(--p31-cloud-50)', fontFamily: "'Press Start 2P', cursive", fontSize: 10, cursor: isSimulating ? 'not-allowed' : 'pointer', opacity: isSimulating ? 0.5 : 1, transition: 'all 0.15s' }}
                  onMouseEnter={e => { if (!isSimulating) e.currentTarget.style.background = 'var(--p31-gold-border)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = selectedPlay === 'PASS' ? 'var(--p31-gold-dim)' : 'var(--p31-white-2)'; }}>
                  PASS
                </button>
                {canKick && (
                  <>
                    <button onClick={() => setSelectedPlay('PUNT')} disabled={isSimulating}
                      style={{ padding: '10px 24px', borderRadius: 8, border: `1px solid ${selectedPlay === 'PUNT' ? 'var(--p31-gold-border)' : 'var(--p31-white-6)'}`, background: selectedPlay === 'PUNT' ? 'var(--p31-gold-dim)' : 'var(--p31-white-2)', color: selectedPlay === 'PUNT' ? 'var(--p31-gold)' : 'var(--p31-cloud-50)', fontFamily: "'Press Start 2P', cursive", fontSize: 10, cursor: isSimulating ? 'not-allowed' : 'pointer', opacity: isSimulating ? 0.5 : 1, transition: 'all 0.15s' }}
                      onMouseEnter={e => { if (!isSimulating) e.currentTarget.style.background = 'var(--p31-gold-border)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = selectedPlay === 'PUNT' ? 'var(--p31-gold-dim)' : 'var(--p31-white-2)'; }}>
                      PUNT
                    </button>
                    {fieldGoalRange && (
                      <button onClick={() => setSelectedPlay('FIELD_GOAL')} disabled={isSimulating}
                        style={{ padding: '10px 24px', borderRadius: 8, border: `1px solid ${selectedPlay === 'FIELD_GOAL' ? 'var(--p31-gold-border)' : 'var(--p31-white-6)'}`, background: selectedPlay === 'FIELD_GOAL' ? 'var(--p31-gold-dim)' : 'var(--p31-white-2)', color: selectedPlay === 'FIELD_GOAL' ? 'var(--p31-gold)' : 'var(--p31-cloud-50)', fontFamily: "'Press Start 2P', cursive", fontSize: 10, cursor: isSimulating ? 'not-allowed' : 'pointer', opacity: isSimulating ? 0.5 : 1, transition: 'all 0.15s' }}
                        onMouseEnter={e => { if (!isSimulating) e.currentTarget.style.background = 'var(--p31-gold-border)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = selectedPlay === 'FIELD_GOAL' ? 'var(--p31-gold-dim)' : 'var(--p31-white-2)'; }}>
                        FG
                      </button>
                    )}
                  </>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button onClick={handleSnap} disabled={isSimulating}
                  style={{ padding: '12px 48px', borderRadius: 8, border: '2px solid var(--p31-gold)', background: 'var(--p31-deep-void)', color: 'var(--p31-gold)', fontFamily: "'Press Start 2P', cursive", fontSize: 12, cursor: isSimulating ? 'not-allowed' : 'pointer', opacity: isSimulating ? 0.5 : 1, animation: 'none', transition: 'all 0.15s', boxShadow: '0 0 12px var(--p31-gold-border)' }}
                  onMouseEnter={e => { if (!isSimulating) { e.currentTarget.style.background = 'var(--p31-gold-dim)'; } }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--p31-deep-void)'; }}>
                  {isSimulating ? 'SNAPPING...' : 'SNAP'}
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button onClick={handleSnap} disabled={isSimulating}
                style={{ padding: '12px 48px', borderRadius: 8, border: '2px solid var(--p31-gold-border)', background: 'var(--p31-deep-void)', color: 'var(--p31-gold)', fontFamily: "'Press Start 2P', cursive", fontSize: 12, cursor: isSimulating ? 'not-allowed' : 'pointer', opacity: isSimulating ? 0.5 : 1, transition: 'all 0.15s' }}
                onMouseEnter={e => { if (!isSimulating) e.currentTarget.style.background = 'var(--p31-gold-dim)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--p31-deep-void)'; }}>
                {isSimulating ? 'SIMULATING...' : 'SNAP'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Drive summary */}
      {driveStats && game.drives.length > 0 && (() => {
        const lastEvent = game.drives[game.drives.length - 1];
        const driveEnded = lastEvent.result.isTouchdown || lastEvent.result.isFieldGoal || lastEvent.result.isSafety || lastEvent.playType === 'PUNT' || lastEvent.result.isTurnover || (lastEvent.down === 4 && !lastEvent.result.isFirstDown && !['PUNT', 'FIELD_GOAL'].includes(lastEvent.playType));
        if (!driveEnded) return null;
        const result = getLastDriveResult(game.drives, driveStartIndex ?? 0);
        return (
          <div style={{ background: 'rgba(205,168,82,0.06)', border: '1px solid var(--p31-gold-dim)', borderRadius: 8, padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'fadeSlideIn 0.3s ease-out' }}>
            <div style={{ display: 'flex', gap: 16, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--p31-cloud-50)' }}>
              <span>{driveStats.plays} plays</span>
              <span>{driveStats.yards} yds</span>
              <span>{formatTime(driveStats.time)} TOP</span>
            </div>
            <span style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 9, color: result === 'TOUCHDOWN' ? 'var(--p31-green)' : result === 'FIELD GOAL' ? 'var(--p31-gold)' : result === 'TURNOVER' ? 'var(--p31-rust)' : 'var(--p31-cloud-40)' }}>
              {result}
            </span>
          </div>
        );
      })()}

      {/* Play-by-play log */}
      <div ref={logRef} style={{ maxHeight: 200, overflowY: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid var(--p31-white-6)', padding: 8 }}>
        {game.drives.length === 0 ? (
          <div style={{ textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--p31-cloud-20)', padding: 16 }}>
            {game.kickoffPending ? 'Tap SNAP to kick off' : 'No plays yet'}
          </div>
        ) : (
          game.drives.map((event, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, padding: '3px 0', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: resultColor(event), borderBottom: i < game.drives.length - 1 ? '1px solid var(--p31-white-3)' : 'none', animation: 'fadeSlideIn 0.2s ease-out' }}>
              <span style={{ minWidth: 24, color: 'var(--p31-cloud-25)' }}>Q{event.quarter}</span>
              <span style={{ minWidth: 42, color: 'var(--p31-cloud-35)' }}>{downLabel(event.down)}&{event.distance}</span>
              <span style={{ minWidth: 28 }}>{event.playType === 'FIELD_GOAL' ? 'FG' : event.playType === 'PUNT' ? 'PUNT' : event.playType === 'RUN' ? 'RUN' : 'PASS'}</span>
              <span style={{ minWidth: 28 }}>{event.result.gain > 0 ? `+${event.result.gain}` : event.result.gain < 0 ? `${event.result.gain}` : '0'}</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.result.description}</span>
            </div>
          ))
        )}
      </div>

      {/* Game over */}
      {game.isComplete && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '24px 16px', background: 'rgba(205,168,82,0.06)', border: '1px solid var(--p31-gold-border)', borderRadius: 12, animation: 'fadeSlideIn 0.5s ease-out' }}>
          <span style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 24, color: 'var(--p31-gold)' }}>
            {myScore > oppScore ? 'WIN' : myScore < oppScore ? 'LOSS' : 'TIE'}
          </span>
          <div style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 32, color: 'var(--p31-cloud)', display: 'flex', gap: 32 }}>
            <span style={{ color: homeIdx === 1 ? 'var(--p31-cloud)' : 'var(--p31-gold)' }}>{myScore}</span>
            <span style={{ color: 'var(--p31-cloud-20)', fontSize: 24 }}>-</span>
            <span style={{ color: homeIdx === 1 ? 'var(--p31-gold)' : 'var(--p31-cloud)' }}>{oppScore}</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => window.location.reload()}
              style={{ padding: '12px 28px', borderRadius: 8, border: '2px solid var(--p31-gold)', background: 'var(--p31-gold-dim)', color: 'var(--p31-gold)', fontFamily: "'Press Start 2P', cursive", fontSize: 10, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--p31-gold-border)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--p31-gold-dim)'; }}>
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
