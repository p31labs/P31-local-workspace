import { useState } from 'react';
import { useGameEngine } from '../../lib/arcade-core/useGameEngine.ts';
import { emit } from '../../lib/arcade-core/eventBus.ts';
import { GameOverlay } from './GameOverlay.tsx';
import { GridironGame } from './gridiron/GridironGame.tsx';
import { SeasonRecord } from '../../engine/gridiron/types.ts';
import { createInitialSeasonRecord, formatSeasonRecord, generateTeamName } from '../../engine/gridiron/teamManager.ts';
import { createMulberry32 } from '../../engine/card/rng/mulberry32.ts';

type Screen = 'menu' | 'game';

const STORAGE_KEY = 'p31:gridiron:record';

function loadRecord(): SeasonRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return createInitialSeasonRecord();
}

function saveRecord(rec: SeasonRecord) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rec));
  } catch {}
}

export function GridironGameShell() {
  const engine = useGameEngine({ slug: 'gridiron', title: 'Gridiron', autoSave: true });
  const [screen, setScreen] = useState<Screen>('menu');
  const [teamName, setTeamName] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [record, setRecord] = useState<SeasonRecord>(loadRecord);

  const spoonLevel = engine.state.spoons;
  const spoonFactor = Math.max(0.3, Math.min(1.0, spoonLevel / 6));

  function handleStartGame() {
    if (!teamName.trim()) return;
    const rng = createMulberry32(Date.now());
    const opp = generateTeamName(rng);
    setOpponentName(opp);
    engine.start();
    setScreen('game');
  }

  function handleScoreChange(delta: number) {
    engine.addScore(delta);
    emit('p31:gridiron:playResult', { delta });
  }

  function handleMoveMade() {
    emit('p31:gridiron:playResult', {});
  }

  async function handleComplete() {
    await engine.complete();
    emit('p31:gridiron:driveEnd', {});
  }

  function handleGameResult(myScore: number, oppScore: number) {
    const won = myScore > oppScore;
    const newRec = { ...record };
    if (won) newRec.wins++;
    else newRec.losses++;
    newRec.pointsFor += myScore;
    newRec.pointsAgainst += oppScore;
    setRecord(newRec);
    saveRecord(newRec);
  }

  function handleBackToMenu() {
    engine.reset();
    setScreen('menu');
  }

  const extraHud = screen === 'game' ? (
    <div style={{ position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
      <button onClick={handleBackToMenu} style={{
        padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.04)', color: 'rgba(232,230,227,0.6)',
        fontFamily: "'JetBrains Mono', monospace", fontSize: 10, cursor: 'pointer',
      }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}>
        ← MENU
      </button>
      <span style={{
        padding: '6px 14px', borderRadius: 8, background: 'rgba(205,168,82,0.1)',
        border: '1px solid rgba(205,168,82,0.2)', color: '#cda852',
        fontFamily: "'Press Start 2P', cursive", fontSize: 9,
      }}>
        GRIDIRON
      </span>
    </div>
  ) : null;

  return (
    <GameOverlay
      gameId="gridiron"
      gameTitle="Gridiron"
      gameIcon="🏈"
      engineState={{ ...engine.state, score: engine.state.score }}
      extraHud={extraHud}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '96px 16px 96px' }}>
        {screen === 'menu' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, maxWidth: 500, width: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 12 }}>🏈</div>
              <h1 style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 18, color: '#cda852', marginBottom: 12 }}>GRIDIRON</h1>
              <p style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'rgba(232,230,227,0.5)', lineHeight: 1.8 }}>
                Football simulation engine
              </p>
            </div>

            {record.wins + record.losses > 0 && (
              <div style={{ padding: '10px 20px', background: 'rgba(205,168,82,0.06)', border: '1px solid rgba(205,168,82,0.1)', borderRadius: 10, textAlign: 'center', width: '100%', maxWidth: 320 }}>
                <p style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'rgba(232,230,227,0.4)', marginBottom: 4 }}>Season Record</p>
                <p style={{ fontSize: 14, fontFamily: "'Press Start 2P', cursive", color: '#e8e6e3' }}>
                  {formatSeasonRecord(record)}
                </p>
                <p style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: 'rgba(232,230,227,0.3)', marginTop: 4 }}>
                  PF: {record.pointsFor} — PA: {record.pointsAgainst}
                </p>
              </div>
            )}

            <div style={{ padding: '16px 24px', background: 'rgba(205,168,82,0.06)', border: '1px solid rgba(205,168,82,0.1)', borderRadius: 12, textAlign: 'center', width: '100%', maxWidth: 320 }}>
              <p style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'rgba(232,230,227,0.4)', marginBottom: 12 }}>Team Name</p>
              <input
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                placeholder="e.g. Atlanta Phoenix"
                maxLength={24}
                style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid rgba(205,168,82,0.3)', background: 'rgba(255,255,255,0.03)', color: '#e8e6e3', fontFamily: "'JetBrains Mono', monospace", fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                onKeyDown={e => { if (e.key === 'Enter' && teamName.trim()) handleStartGame(); }}
              />
            </div>

            <div style={{ padding: '12px 24px', background: 'rgba(205,168,82,0.04)', border: '1px solid rgba(205,168,82,0.08)', borderRadius: 12, textAlign: 'center' }}>
              <p style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'rgba(232,230,227,0.4)', lineHeight: 1.8 }}>
                Spoons: {spoonLevel}/12<br />
                Difficulty factor: {(spoonFactor * 100).toFixed(0)}%
              </p>
            </div>

            <button
              onClick={handleStartGame}
              disabled={!teamName.trim()}
              style={{ padding: '16px 40px', borderRadius: 12, border: `2px solid ${teamName.trim() ? '#cda852' : 'rgba(255,255,255,0.1)'}`, background: teamName.trim() ? 'rgba(205,168,82,0.1)' : 'rgba(255,255,255,0.02)', color: teamName.trim() ? '#cda852' : 'rgba(232,230,227,0.2)', fontFamily: "'Press Start 2P', cursive", fontSize: 13, cursor: teamName.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}
              onMouseEnter={e => { if (teamName.trim()) e.currentTarget.style.background = 'rgba(205,168,82,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = teamName.trim() ? 'rgba(205,168,82,0.1)' : 'rgba(255,255,255,0.02)'; }}
            >
              PLAY BALL
            </button>
          </div>
        )}

        {screen === 'game' && (
          <GridironGame
            onScoreChange={handleScoreChange}
            onComplete={handleComplete}
            onMoveMade={handleMoveMade}
            spoonLevel={spoonLevel}
            teamName={teamName.trim()}
            opponentName={opponentName}
            onGameResult={handleGameResult}
          />
        )}
      </div>
    </GameOverlay>
  );
}
