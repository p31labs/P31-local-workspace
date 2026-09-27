import { useRef, useEffect, useState, useCallback } from 'react';
import { usePlayer } from '../components/PlayerProvider';
import { useGameEngine } from '@p31ca/game-engine/react';
import { jitterbugVertices, jitterbugEdges } from '@p31ca/game-engine';
import type { PlayerCharacter, Team, Season, GameResult, FootballPlayResult, FootballDriveResult, FootballLineupSlot, TrainingSession } from './common/index.js';
import { generateKids, runTraining, createSeason, getWeekGames, recordResult, simulateFootballGame, FOOTBALL_POSITIONS, store, LOVE_REWARDS, xpToLevel, xpForLevel, ParticleSystem } from './common/index.js';
import { playNote, playChord, playRiser, P31_F } from './common/sound.js';

const P31_FREQ = 172.35;
const P31_HARMONIC = 517.05;
const P31_GOAL = 863;

type Screen = 'title' | 'team-builder' | 'training' | 'season' | 'game-result';

interface PlayCall {
  name: string;
  type: 'run' | 'pass' | 'trick' | 'punt' | 'field_goal';
  risk: number;
  gainBase: number;
  description: string;
}

const PLAYBOOK: PlayCall[] = [
  { name: 'Dive', type: 'run', risk: 0.15, gainBase: 3, description: 'Power run up the middle' },
  { name: 'Sweep', type: 'run', risk: 0.25, gainBase: 6, description: 'Outside run to the edge' },
  { name: 'Counter', type: 'run', risk: 0.3, gainBase: 8, description: 'Misdirection run' },
  { name: 'QB Sneak', type: 'run', risk: 0.1, gainBase: 1, description: 'Quarterback push for short yards' },
  { name: 'Short Pass', type: 'pass', risk: 0.2, gainBase: 6, description: 'Quick throw underneath' },
  { name: 'Medium Pass', type: 'pass', risk: 0.35, gainBase: 14, description: '10-20 yard route' },
  { name: 'Deep Pass', type: 'pass', risk: 0.55, gainBase: 28, description: 'Go route downfield' },
  { name: 'Screen Pass', type: 'pass', risk: 0.15, gainBase: 4, description: 'Throw behind the line to RB' },
  { name: 'Play Action', type: 'pass', risk: 0.4, gainBase: 20, description: 'Fake run, throw deep' },
  { name: 'Reverse', type: 'trick', risk: 0.5, gainBase: 16, description: 'Double handoff misdirection' },
  { name: 'Punt', type: 'punt', risk: 0.02, gainBase: -35, description: 'Kick the ball away' },
  { name: 'Field Goal', type: 'field_goal', risk: 0.2, gainBase: 3, description: 'Kick through the uprights (3 pts)' },
];

function playTone(freq: number, dur: number, vol = 0.1) {
  playNote(freq, dur, vol);
}

import { glassStyle, btnStyle, btnGhost } from './common/styles';

function StatBar({ label, value, color = '#00F0FF' }: { label: string; value: number; color?: string }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: 'monospace' }}>
      <span style={{ width: 60, color: 'rgba(255,255,255,0.6)' }}>{label}</span>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ color, fontWeight: 600, width: 24, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

export default function Gridiron() {
  const { spoons, setSpoons, did, mintLOVE } = usePlayer();
  const { state, actions } = useGameEngine({ type: 'gridiron', spoons,
    onComplete: (data) => { playTone(P31_GOAL, 2, 0.2); mintLOVE(data.loveEarned, 'gridiron_game'); },
  });

  const [screen, setScreen] = useState<Screen>('title');
  const [kids] = useState(() => generateKids('gridiron'));
  const [team, setTeam] = useState<Team | null>(null);
  const [season, setSeason] = useState<Season | null>(null);
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [quarter, setQuarter] = useState(1);
  const [down, setDown] = useState(1);
  const [yardsToGo, setYardsToGo] = useState(10);
  const [yardLine, setYardLine] = useState(80);
  const [score, setScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [driveLog, setDriveLog] = useState<string[]>([]);
  const [lastPlay, setLastPlay] = useState<{ name: string; yards: number; result: string } | null>(null);
  const [gameOver, setGameOver] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<ParticleSystem | null>(null);
  const fieldCache = useRef<ImageData | null>(null);
  const titleTimeRef = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => { titleTimeRef.current += 0.016; }, 16);
    return () => clearInterval(timer);
  }, []);

  const initTeam = useCallback(() => {
    setTeam({
      id: `team-${Date.now()}`,
      name: `${did.slice(0, 8)}'s Squad`,
      colors: { primary: '#FBBF24', secondary: '#0A0A0F' },
      ownerDid: did,
      players: [],
      baseballLineup: [],
      footballLineup: [],
      wins: 0, losses: 0, draws: 0, season: 1,
      trainingPoints: 5,
      createdAt: new Date().toISOString(),
    });
    setScreen('team-builder');
  }, [did]);

  const initSeason = useCallback(() => {
    if (!team || team.players.length < 11) return;
    const s = createSeason(team, 'gridiron');
    setSeason(s);
    store.save(`gridiron-season-${did}`, s);
    setScreen('season');
  }, [team, did]);

  const runSeasonGame = useCallback((gameId: string) => {
    if (!season || !team) return;
    const sched = season.schedule.find(g => g.id === gameId);
    if (!sched) return;
    const simulated = simulateFootballGame(team.players, 0.5, spoons);
    const result: GameResult = {
      homeScore: simulated.homeScore,
      awayScore: simulated.awayScore,
      winner: simulated.winner === 'home' ? team.id : sched.awayTeamId,
    };
    const newSeason = recordResult(season, gameId, result);
    if (simulated.winner === 'home') {
      actions.addLove(LOVE_REWARDS.gridiron_win);
      (async () => { await mintLOVE(LOVE_REWARDS.gridiron_win, 'gridiron_win'); })();
    }
    store.save(`gridiron-season-${did}`, newSeason);
    setSeason(newSeason);
    setScore(simulated.homeScore);
    setOppScore(simulated.awayScore);
    setGameOver(true);
  }, [season, team, spoons, did, actions, mintLOVE]);

  const callPlay = useCallback((play: PlayCall) => {
    if (state.phase !== 'playing' || gameOver) return;
    const fast = Math.max(0, Math.min(1, (5 - spoons) / 5));
    const qbBonus = team?.players?.[0]?.footballStats?.throwing ? (team.players[0].footballStats.throwing - 40) / 200 : 0;
    const roll = Math.random();
    const adjustedRisk = play.risk * (1 - fast * 0.3) - qbBonus * 0.1;
    let result: string;
    let gained: number;

    if (play.type === 'punt') {
      gained = -28 - Math.floor(Math.random() * 15);
      result = 'Punt';
      playTone(100, 0.3, 0.04);
    } else if (play.type === 'field_goal') {
      const fgRoll = Math.random();
      if (fgRoll < 0.65 + fast * 0.1) { gained = 3; result = 'FG Good!'; playTone(P31_HARMONIC, 0.8, 0.1); }
      else { gained = 0; result = 'FG Missed'; playTone(80, 0.4, 0.03); }
    } else if (roll < adjustedRisk) {
      gained = Math.floor(Math.random() * 3);
      result = Math.random() < 0.25 ? 'Fumble!' : `Loss ${gained}`;
      playTone(80, 0.3, 0.03);
    } else {
      gained = Math.floor(play.gainBase * (0.4 + Math.random() * 1.2));
      if (roll < 0.04 + fast * 0.03) { gained = 99; result = 'TOUCHDOWN!'; playTone(P31_GOAL, 1, 0.15); }
      else if (gained >= yardsToGo) { result = `First down! (+${gained})`; playTone(P31_FREQ, 0.4, 0.08); }
      else { result = `Gain ${gained}`; playTone(P31_FREQ, 0.3, 0.06); }
    }

    actions.addScore(gained > 0 ? gained : -2);
    if (gained > 20) actions.addLove(gained);
    setLastPlay({ name: play.name, yards: gained, result });
    setDriveLog(l => [...l, `${play.name}: ${result} (${gained} yds)`]);

    let newYardLine = yardLine - gained;
    let newDown = down + 1;
    let newYardsToGo = yardsToGo;
    let newScore = score;
    let newOppScore = oppScore;
    let newQuarter = quarter;
    let isGameOver = false;

    if (gained === 99 || newYardLine <= 0) {
      newScore += 6;
      playChord([P31_F.root, P31_F.fifth, P31_F.octave], 1, 0.12);
      actions.addLove(LOVE_REWARDS.gridiron_touchdown);
      newYardLine = 80; newDown = 1; newYardsToGo = 10;
      setDriveLog(l => [...l, '🏈 TOUCHDOWN!']);
      if (particlesRef.current) particlesRef.current.emit(200, 120, 40, { color: '#FBBF24' });
    } else if (gained >= yardsToGo) {
      newYardsToGo = 10; newDown = 1;
      playNote(P31_F.third, 0.3, 0.06);
    } else if (play.type === 'field_goal' && gained === 3) {
      newScore += 3;
      newYardLine = 80; newDown = 1; newYardsToGo = 10;
      playChord([P31_F.root, P31_F.fifth], 0.6, 0.08);
      if (particlesRef.current) particlesRef.current.emit(200, 120, 20, { color: '#00F0FF' });
    } else if (play.type === 'punt') {
      newYardLine = 80; newDown = 1; newYardsToGo = 10;
    }

    if (newDown > 4) {
      newYardLine = 80; newDown = 1; newYardsToGo = 10;
    }

    if (result === 'Fumble!') {
      newYardLine = 80; newDown = 1; newYardsToGo = 10;
      advanceQuarter();
      if (quarter >= 4) isGameOver = true;
    }

    setYardLine(newYardLine);
    setDown(newDown);
    setYardsToGo(newYardsToGo);
    setScore(newScore);
    setQuarter(newQuarter);
    setOppScore(newOppScore);

    if (isGameOver) {
      setGameOver(true);
      actions.complete();
    }
  }, [spoons, down, yardsToGo, yardLine, score, oppScore, quarter, gameOver, state.phase, team, actions]);

  const advanceQuarter = () => setQuarter(q => { const n = q + 1; if (n > 4) setGameOver(true); return Math.min(4, n); });

  useEffect(() => {
    (async () => {
      const saved = await store.load<Season>(`gridiron-season-${did}`);
      if (saved) { setSeason(saved); const savedTeam = await store.load<Team>(`gridiron-team-${did}`); if (savedTeam) setTeam(savedTeam); setScreen('season'); }
    })();
  }, [did]);

  useEffect(() => { if (team) store.save(`gridiron-team-${did}`, team); }, [team, did]);

  useEffect(() => { const jInterval = setInterval(() => actions.updateJitterbug(), 16); return () => clearInterval(jInterval); }, [actions]);

  function drawFieldStatic(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.25);
    skyGrad.addColorStop(0, '#1a0a2e');
    skyGrad.addColorStop(1, '#0a1a0a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h * 0.3);

    const turfGrad = ctx.createLinearGradient(0, h * 0.25, 0, h);
    turfGrad.addColorStop(0, '#0d2a0d');
    turfGrad.addColorStop(0.5, '#0a1f0a');
    turfGrad.addColorStop(1, '#071407');
    ctx.fillStyle = turfGrad;
    ctx.fillRect(0, h * 0.2, w, h * 0.8);

    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.015 + i * 0.003})`;
      ctx.fillRect(0, h * 0.25 + i * 8, w, 6);
    }

    for (let y = 10; y <= 90; y += 10) {
      const ly = y / 100 * h;
      ctx.strokeStyle = y % 20 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)';
      ctx.lineWidth = y % 20 === 0 ? 1.5 : 1;
      ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(w, ly); ctx.stroke();
    }

    ctx.fillStyle = 'rgba(0, 240, 255, 0.06)';
    ctx.fillRect(0, 0, w, 10);
    ctx.fillRect(0, h - 10, w, 10);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, w, 10);
    ctx.strokeRect(0, h - 10, w, 10);

    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    for (let x = 0; x < w; x += 40) {
      ctx.fillRect(x, 12, 2, h - 24);
    }
  }

  const onPhase = state.jitterbug?.phase ?? 0;
  const isNaN_phase = typeof onPhase !== 'number' || isNaN(onPhase);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = 400, h = 250;
    canvas.width = w; canvas.height = h;
    if (!particlesRef.current) particlesRef.current = new ParticleSystem(ctx);

    const animate = () => {
      ctx.clearRect(0, 0, w, h);

      if (!fieldCache.current || w !== fieldCache.current.width) {
        drawFieldStatic(ctx, w, h);
        try { fieldCache.current = ctx.getImageData(0, 0, w, h); } catch {}
      } else {
        ctx.putImageData(fieldCache.current!, 0, 0);
      }

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)'; ctx.lineWidth = 2;
      const fdY = (yardLine - yardsToGo) * (h / 100);
      ctx.beginPath(); ctx.moveTo(w * 0.15, fdY); ctx.lineTo(w * 0.85, fdY); ctx.stroke();
      ctx.fillStyle = '#00F0FF'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'right';
      ctx.shadowColor = '#00F0FF'; ctx.shadowBlur = 6;
      ctx.fillText('1st', w * 0.15 - 4, fdY + 3);
      ctx.shadowBlur = 0;

      const ballY = Math.max(6, Math.min(h - 6, yardLine * (h / 100)));
      ctx.shadowColor = '#FBBF24'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.ellipse(w / 2, ballY, 8, 5, 0, 0, Math.PI * 2); ctx.fillStyle = '#FBBF24'; ctx.fill();
      ctx.shadowBlur = 0;

      if (!isNaN_phase) {
        const phase = onPhase;
        const v = jitterbugVertices(phase);
        const e = jitterbugEdges(phase);
        if (v && e && v.length) {
          ctx.save(); ctx.translate(w / 2, ballY - 30);
          ctx.shadowColor = '#00F0FF'; ctx.shadowBlur = 8;
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)'; ctx.lineWidth = 1;
          for (const [a, b] of e) {
            const va = v[Math.min(a, v.length - 1)]; const vb = v[Math.min(b, v.length - 1)];
            if (!va || !vb) continue;
            ctx.beginPath(); ctx.moveTo(va.x * 12, va.y * 12); ctx.lineTo(vb.x * 12, vb.y * 12); ctx.stroke();
          }
          ctx.shadowBlur = 0;
          ctx.restore();
        }
      }

      if (lastPlay) {
        ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center';
        const isTd = lastPlay.result.includes('TOUCHDOWN');
        ctx.shadowColor = isTd ? '#FBBF24' : lastPlay.yards > 0 ? '#34D399' : '#FB7185';
        ctx.shadowBlur = isTd ? 12 : 6;
        ctx.fillStyle = isTd ? '#FBBF24' : lastPlay.yards > 0 ? '#34D399' : '#FB7185';
        ctx.fillText(lastPlay.result, w / 2, ballY - 45);
        ctx.shadowBlur = 0;
      }

      particlesRef.current?.update(0.016);
      particlesRef.current?.draw();

      requestAnimationFrame(animate);
    };
    const raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [yardLine, onPhase, isNaN_phase, lastPlay, down, yardsToGo]);

  const resetGame = useCallback(() => {
    setQuarter(1); setDown(1); setYardsToGo(10); setYardLine(80);
    setScore(0); setOppScore(0); setDriveLog([]); setLastPlay(null); setGameOver(false);
  }, []);

  const togglePlayer = (kid: PlayerCharacter) => {
    if (!team) return;
    const has = team.players.find(p => p.id === kid.id);
    let updated: Team;
    if (has) {
      updated = { ...team, players: team.players.filter(p => p.id !== kid.id), footballLineup: team.footballLineup.filter(l => l.playerId !== kid.id) };
    } else {
      if (team.players.length >= 11) return;
      const pos = FOOTBALL_POSITIONS[team.footballLineup.length % FOOTBALL_POSITIONS.length];
      updated = { ...team, players: [...team.players, kid], footballLineup: [...team.footballLineup, { playerId: kid.id, position: pos, depth: 1 }] };
    }
    setTeam(updated);
  };

  const updateFBPosition = (playerId: string, position: typeof FOOTBALL_POSITIONS[number]) => {
    if (!team) return;
    setTeam({ ...team, footballLineup: team.footballLineup.map(l => l.playerId === playerId ? { ...l, position } : l) });
  };

  const runPlayerTraining = (player: PlayerCharacter, stat: string) => {
    if (!team) return;
    const result = runTraining(player, stat, spoons);
    setTrainingSessions(s => [...s, { ...result, playerId: player.id, date: result.date, game: result.game }]);
    setTeam({ ...team, players: team.players.map(p => p.id === player.id ? result.player : p), trainingPoints: Math.max(0, team.trainingPoints - 1) });
  };

  const renderTitle = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#FBBF24', fontFamily: 'monospace' }}>🏈 Gridiron</div>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', maxWidth: 300 }}>Draft your franchise. Call the plays. Win the Super Bowl.</p>
      {season ? <button onClick={() => setScreen('season')} style={btnStyle(false, '#FBBF24')}>Continue Season</button> : null}
      <button onClick={initTeam} style={btnStyle(false, '#00F0FF')}>{season ? 'New Team' : 'Start New Team'}</button>
      {team ? <button onClick={() => { resetGame(); setScreen('title'); }} style={btnGhost()}>Play Exhibition</button> : null}
      {team ? <button onClick={() => setScreen('training')} style={btnGhost()}>Training Facility</button> : null}
      <canvas ref={canvasRef} style={{ width: 400, height: 250, borderRadius: 12, border: '1px solid rgba(0,240,255,0.1)', marginTop: 8 }} />
      <div style={{ display: 'flex', gap: 4 }}>
        {([0,1,2,3,4,5] as const).map(s => (
          <button key={s} onClick={() => setSpoons(s)} style={{
            width: 32, padding: '4px 0', borderRadius: 4, cursor: 'pointer', border: spoons === s ? `1px solid ${s <= 1 ? '#FB7185' : '#00F0FF'}` : '1px solid rgba(255,255,255,0.1)',
            background: spoons === s ? `${s <= 1 ? '#FB7185' : '#00F0FF'}20` : 'transparent',
            color: spoons === s ? (s <= 1 ? '#FB7185' : '#00F0FF') : 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'monospace',
          }}>{s === 0 ? '!' : s}</button>
        ))}
      </div>
    </div>
  );

  const renderTeamBuilder = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <button onClick={() => setScreen('title')} style={btnGhost()}>← Back</button>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#FBBF24', fontFamily: 'monospace' }}>Build Your Franchise</div>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Pick 11 players ({team?.players.length ?? 0}/11 selected)</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
        {kids.map(kid => {
          const selected = team?.players.find(p => p.id === kid.id);
          return (
            <button key={kid.id} onClick={() => togglePlayer(kid)} style={{
              ...glassStyle(), display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
              border: selected ? '1px solid rgba(0,240,255,0.4)' : undefined,
              background: selected ? 'rgba(0,240,255,0.08)' : undefined,
            }}>
              <span style={{ fontSize: 24 }}>{kid.avatar}</span>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#F5F5F7' }}>{kid.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                  THR:{kid.footballStats?.throwing ?? '--'} CTH:{kid.footballStats?.catching ?? '--'} SPD:{kid.footballStats?.speed ?? '--'}
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 2, flexWrap: 'wrap' }}>
                  {kid.traits.map(t => <span key={t.id} style={{ fontSize: 9, color: '#A78BFA', background: 'rgba(167,139,250,0.1)', padding: '1px 6px', borderRadius: 4 }}>{t.icon} {t.name}</span>)}
                </div>
              </div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>🥄{kid.spoon}</span>
              <span style={{ fontSize: 18, color: selected ? '#00F0FF' : 'rgba(255,255,255,0.15)' }}>{selected ? '✓' : '○'}</span>
            </button>
          );
        })}
      </div>
      {team && team.footballLineup.length > 0 && (
        <div style={{ ...glassStyle(), maxHeight: 240, overflowY: 'auto' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#FBBF24', marginBottom: 8, fontFamily: 'monospace' }}>Depth Chart</div>
          {team.footballLineup.map(slot => {
            const player = team.players.find(p => p.id === slot.playerId);
            if (!player) return null;
            return (
              <div key={slot.playerId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 16 }}>{player.avatar}</span>
                <span style={{ flex: 1, fontSize: 12, color: '#F5F5F7' }}>{player.name}</span>
                <select value={slot.position} onChange={e => updateFBPosition(slot.playerId, e.target.value as typeof FOOTBALL_POSITIONS[number])} style={{
                  padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent',
                  color: '#F5F5F7', fontSize: 11, fontFamily: 'monospace', cursor: 'pointer',
                }}>
                  {FOOTBALL_POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            );
          })}
        </div>
      )}
      <button onClick={initSeason} disabled={!team || team.players.length < 11} style={btnStyle(!team || team.players.length < 11, '#FBBF24')}>Start Season →</button>
    </div>
  );

  const renderTraining = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <button onClick={() => setScreen('title')} style={btnGhost()}>← Back</button>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#34D399', fontFamily: 'monospace' }}>Training Facility</div>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
        Sessions today: {trainingSessions.filter(s => s.date === new Date().toISOString().split('T')[0]).length} / 3
      </p>
      {team?.players.map(player => {
        const hasPos = team.footballLineup.find(l => l.playerId === player.id);
        if (!hasPos) return null;
        return (
          <details key={player.id} style={glassStyle()}>
            <summary style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#F5F5F7', fontFamily: 'monospace' }}>
              <span style={{ fontSize: 18 }}>{player.avatar}</span>
              {player.name} <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Lv.{xpToLevel(player.xp)} {player.xp}/{xpForLevel(xpToLevel(player.xp) + 1)}xp</span>
            </summary>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <StatBar label="Throwing" value={player.footballStats?.throwing ?? 0} /><StatBar label="Catching" value={player.footballStats?.catching ?? 0} color="#FBBF24" />
              <StatBar label="Speed" value={player.footballStats?.speed ?? 0} color="#34D399" /><StatBar label="Blocking" value={player.footballStats?.blocking ?? 0} color="#A78BFA" />
              <StatBar label="Tackling" value={player.footballStats?.tackling ?? 0} color="#FB7185" />
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <button onClick={() => runPlayerTraining(player, 'throwing')} style={btnGhost()}>Pass Accuracy</button>
                <button onClick={() => runPlayerTraining(player, 'catching')} style={btnGhost()}>Route Run</button>
                <button onClick={() => runPlayerTraining(player, 'tackling')} style={btnGhost()}>Tackle Drill</button>
              </div>
            </div>
          </details>
        );
      })}
      <canvas ref={canvasRef} style={{ width: 400, height: 250, borderRadius: 12, border: '1px solid rgba(0,240,255,0.1)' }} />
    </div>
  );

  const renderSeason = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <button onClick={() => setScreen('title')} style={btnGhost()}>← Back</button>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#FBBF24', fontFamily: 'monospace' }}>Season</div>
      {season && (
        <>
          <div style={glassStyle()}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#00F0FF', marginBottom: 8, fontFamily: 'monospace' }}>Standings</div>
            {season.standings.map(s => {
              const name = s.teamId === season.playerTeamId ? (team?.name ?? 'Your Team') : (season.teams.find(t => t.id === s.teamId)?.name ?? 'Unknown');
              const isPlayer = s.teamId === season.playerTeamId;
              return (
                <div key={s.teamId} style={{ display: 'grid', gridTemplateColumns: '1fr 40px 40px 40px', gap: 8, fontSize: 12, fontFamily: 'monospace', padding: '2px 0', color: isPlayer ? '#FBBF24' : 'rgba(255,255,255,0.7)' }}>
                  <span>{name}</span>
                  <span style={{ textAlign: 'right', color: '#34D399' }}>{s.wins}</span>
                  <span style={{ textAlign: 'right', color: '#FB7185' }}>{s.losses}</span>
                  <span style={{ textAlign: 'right', color: 'rgba(255,255,255,0.4)' }}>{s.draws}</span>
                </div>
              );
            })}
          </div>
          <div style={glassStyle()}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#FBBF24', marginBottom: 8, fontFamily: 'monospace' }}>
              Week {season.currentWeek} / {season.maxWeeks}
            </div>
            {getWeekGames(season, season.currentWeek).map(game => {
              const homeName = game.homeTeamId === season.playerTeamId ? (team?.name ?? 'You') : (season.teams.find(t => t.id === game.homeTeamId)?.name ?? '???');
              const awayName = game.awayTeamId === season.playerTeamId ? (team?.name ?? 'You') : (season.teams.find(t => t.id === game.awayTeamId)?.name ?? '???');
              const isPlayer = game.homeTeamId === season.playerTeamId || game.awayTeamId === season.playerTeamId;
              return (
                <div key={game.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'rgba(255,255,255,0.7)' }}>{homeName} vs {awayName}</span>
                  {!game.result && isPlayer ? (
                    <button onClick={() => runSeasonGame(game.id)} style={btnStyle(false, '#00F0FF')}>Sim</button>
                  ) : (
                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: game.result?.winner === season.playerTeamId ? '#34D399' : '#FB7185' }}>
                      {game.result ? `${game.result.homeScore}-${game.result.awayScore}` : '--'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {season.playoffBracket && (
            <div style={glassStyle()}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#FBBF24', marginBottom: 8, fontFamily: 'monospace' }}>Playoffs</div>
              {season.champion ? (
                <div style={{ color: '#FBBF24', fontSize: 16, fontWeight: 700, textAlign: 'center' }}>Champion: {season.champion === season.playerTeamId ? 'YOU!' : (season.teams.find(t => t.id === season.champion)?.name ?? '???')}</div>
              ) : (
                season.playoffBracket.map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16, justifyContent: 'center', fontSize: 12, padding: 4 }}>
                    <span>{m.teamA === season.playerTeamId ? '⭐ You' : (season.teams.find(t => t.id === m.teamA)?.name ?? 'TBD')}</span>
                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>vs</span>
                    <span>{m.teamB === season.playerTeamId ? '⭐ You' : (season.teams.find(t => t.id === m.teamB)?.name ?? 'TBD')}</span>
                  </div>
                ))
              )}
            </div>
          )}
          {gameOver && (
            <div style={glassStyle()}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#00F0FF', marginBottom: 8, fontFamily: 'monospace' }}>Last Game</div>
              <div style={{ fontSize: 18, fontWeight: 700, textAlign: 'center', color: '#FBBF24' }}>{score} - {oppScore}</div>
            </div>
          )}
        </>
      )}
      <canvas ref={canvasRef} style={{ width: 400, height: 250, borderRadius: 12, border: '1px solid rgba(0,240,255,0.1)' }} />
    </div>
  );

  const renderPlaybook = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {gameOver ? (
        <div style={{ fontSize: 18, fontWeight: 700, textAlign: 'center', color: '#FBBF24' }}>
          Final: {score} - {oppScore} &nbsp;
          <button onClick={resetGame} style={btnStyle(false, '#00F0FF')}>New Game</button>
          <button onClick={() => setScreen('title')} style={btnGhost()}>Exit</button>
        </div>
      ) : null}
      <div style={glassStyle()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: 'monospace', marginBottom: 8 }}>
          <span style={{ color: '#FBBF24' }}>Q{quarter}</span>
          <span>{down}th &amp; {yardsToGo}</span>
          <span style={{ color: '#00F0FF' }}>{score}-{oppScore}</span>
          <span style={{ color: '#34D399' }}>♥ {state.loveEarned}</span>
        </div>
        <canvas ref={canvasRef} style={{ width: 400, height: 250, borderRadius: 8, border: '1px solid rgba(0,240,255,0.1)' }} />
      </div>
      {lastPlay && (
        <div style={{ textAlign: 'center', color: lastPlay.result.includes('TOUCHDOWN') ? '#FBBF24' : lastPlay.yards > 0 ? '#34D399' : '#FB7185', fontSize: 14, fontWeight: 600 }}>{lastPlay.result}</div>
      )}
      {!gameOver && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {PLAYBOOK.filter(p => p.type === 'run').map(play => (
              <button key={play.name} onClick={() => callPlay(play)} style={{ ...btnStyle(false, '#34D399'), fontSize: 11, padding: '6px 8px' }} title={play.description}>{play.name}</button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {PLAYBOOK.filter(p => p.type === 'pass').map(play => (
              <button key={play.name} onClick={() => callPlay(play)} style={{ ...btnStyle(false, '#00F0FF'), fontSize: 11, padding: '6px 8px' }} title={play.description}>{play.name}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {PLAYBOOK.filter(p => p.type === 'trick' || p.type === 'punt' || p.type === 'field_goal').map(play => (
              <button key={play.name} onClick={() => callPlay(play)} style={{ ...btnStyle(false, '#FBBF24'), flex: 1, fontSize: 11, padding: '6px 8px' }} title={play.description}>{play.name}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px', maxWidth: 440, margin: '0 auto', fontFamily: 'monospace' }}>
      {screen === 'title' && renderTitle()}
      {screen === 'team-builder' && renderTeamBuilder()}
      {screen === 'training' && renderTraining()}
      {screen === 'season' && !gameOver && renderSeason()}
      {screen === 'title' && !season && renderPlaybook()}
    </div>
  );
}
