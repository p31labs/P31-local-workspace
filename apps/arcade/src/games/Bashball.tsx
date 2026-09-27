import { useRef, useEffect, useState, useCallback } from 'react';
import { usePlayer } from '../components/PlayerProvider';
import { useGameEngine } from '@p31ca/game-engine/react';
import { jitterbugVertices, jitterbugEdges } from '@p31ca/game-engine';
import type { PlayerCharacter, Team, Season, BaseballLineupSlot, AtBatResult, SimulatedGame, InningResult, GameResult, TrainingSession } from './common/index.js';
import { generateKids, runTraining, createSeason, getWeekGames, recordResult, simulateBashballGame, BASEBALL_POSITIONS, store, LOVE_REWARDS, xpToLevel, xpForLevel, ParticleSystem } from './common/index.js';
import { playNote, playChord, playPad, playRiser, P31_F } from './common/sound.js';

const P31_FREQ = 172.35;
const P31_HARMONIC = 517.05;
const P31_GOAL = 863;

type Screen = 'title' | 'team-builder' | 'training' | 'season';

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

const FIELD_POSITIONS: Record<string, { x: number; y: number }> = {
  P:  { x: 200, y: 320 },
  C:  { x: 200, y: 430 },
  '1B': { x: 310, y: 370 },
  '2B': { x: 230, y: 250 },
  '3B': { x: 90, y: 370 },
  SS:  { x: 170, y: 250 },
  LF:  { x: 50, y: 180 },
  CF:  { x: 200, y: 130 },
  RF:  { x: 350, y: 180 },
};

function drawFieldStatic(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.45);
  skyGrad.addColorStop(0, '#1a0a2e');
  skyGrad.addColorStop(0.5, '#2d1b69');
  skyGrad.addColorStop(1, '#0a1a0a');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  const grassGrad = ctx.createRadialGradient(w / 2, h * 0.55, 40, w / 2, h * 0.55, 350);
  grassGrad.addColorStop(0, '#0d2a0d');
  grassGrad.addColorStop(1, '#061206');
  ctx.fillStyle = grassGrad;
  ctx.fillRect(0, h * 0.3, w, h * 0.7);

  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.01 + i * 0.001})`;
    ctx.fillRect(0, h * 0.3 + i * 20, w, 2);
  }

  const bx = [200, 80, 200, 320];
  const by = [430, 280, 130, 280];
  const dirtGrad = ctx.createRadialGradient(200, 310, 20, 200, 310, 200);
  dirtGrad.addColorStop(0, '#6b4423');
  dirtGrad.addColorStop(0.3, '#5a3a1c');
  dirtGrad.addColorStop(0.6, '#4a2c0f');
  dirtGrad.addColorStop(1, 'rgba(42,22,5,0)');
  ctx.fillStyle = dirtGrad;
  ctx.beginPath();
  ctx.moveTo(200, 310);
  for (let i = 0; i < 4; i++) { ctx.lineTo(bx[i], by[i]); }
  ctx.closePath(); ctx.fill();

  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      ctx.strokeStyle = 'rgba(160,120,60,0.15)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bx[i], by[i]); ctx.lineTo(bx[j], by[j]); ctx.stroke();
    }
  }

  ctx.strokeStyle = 'rgba(160,120,60,0.3)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(200, 310); ctx.lineTo(200, 430); ctx.stroke();

  for (let i = 0; i < 4; i++) {
    ctx.shadowColor = '#FBBF24'; ctx.shadowBlur = 6;
    ctx.fillStyle = '#f5f0e8';
    ctx.beginPath();
    const bs = 12, bh = bs * 0.7;
    ctx.moveTo(bx[i] - bs, by[i] - bh); ctx.lineTo(bx[i] + bs, by[i] - bh);
    ctx.lineTo(bx[i] + bs * 0.8, by[i] + bh); ctx.lineTo(bx[i] - bs * 0.8, by[i] + bh);
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(180,140,100,0.4)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(20, 120); ctx.lineTo(380, 120);
  ctx.arc(200, 120, 30, Math.PI, 0);
  ctx.lineTo(380, 120); ctx.stroke();

  for (let i = 0; i < 3; i++) {
    const tx = 30 + i * 60;
    ctx.fillStyle = '#1a3a0a';
    ctx.beginPath(); ctx.arc(tx, 100, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0d2005';
    ctx.beginPath(); ctx.arc(tx, 95, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a1a0a'; ctx.fillRect(tx - 4, 100, 8, 20);
  }

  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(340, 440, 50, 30);
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.strokeRect(340, 440, 50, 30);
}

function drawPlayerSprite(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, size = 10, isHome = false) {
  ctx.save(); ctx.translate(x, y);
  const s = size;
  const skinBase = '#e8c99b';
  const skinDark = '#c4925a';
  const jersey = color;
  const pants = isHome ? '#f5f0e8' : '#555';

  ctx.fillStyle = pants;
  ctx.fillRect(-s * 0.5, s * 0.3, s, s * 0.6);

  ctx.fillStyle = jersey;
  ctx.fillRect(-s * 0.6, -s * 0.15, s * 1.2, s * 0.55);

  ctx.fillStyle = skinBase;
  ctx.beginPath(); ctx.arc(0, -s * 0.4, s * 0.45, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = jersey;
  ctx.beginPath();
  ctx.arc(-s * 0.05, -s * 0.55, s * 0.5, Math.PI, 0);
  ctx.closePath(); ctx.fill();
  ctx.fillRect(-s * 0.45, -s * 0.58, s * 0.9, 4);

  ctx.fillStyle = pants;
  ctx.fillRect(-s * 0.4, s * 0.6, s * 0.25, s * 0.3);
  ctx.fillRect(s * 0.15, s * 0.6, s * 0.25, s * 0.3);

  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(-s * 0.15, -s * 0.42, s * 0.08, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(s * 0.15, -s * 0.42, s * 0.08, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

export default function Bashball() {
  const { spoons, setSpoons, did, mintLOVE } = usePlayer();
  const { state, actions } = useGameEngine({ type: 'bashball', spoons,
    onComplete: (data) => { playPad(P31_GOAL, 2, 0.15); mintLOVE(data.loveEarned, 'bashball_game'); },
  });

  const [screen, setScreen] = useState<Screen>('title');
  const [kids] = useState(() => generateKids('bashball'));
  const [team, setTeam] = useState<Team | null>(null);
  const [season, setSeason] = useState<Season | null>(null);
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [lastGameScore, setLastGameScore] = useState<{ home: number; away: number; hits: number } | null>(null);
  const [flashingScore, setFlashingScore] = useState(false);
  const [titleTime, setTitleTime] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldCache = useRef<ImageData | null>(null);
  const particlesRef = useRef<ParticleSystem | null>(null);

  const initTeam = useCallback(() => {
    setTeam({
      id: `team-${Date.now()}`,
      name: `${did.slice(0, 8)}'s Squad`,
      colors: { primary: '#00F0FF', secondary: '#0A0A0F' },
      ownerDid: did, players: [], baseballLineup: [], footballLineup: [],
      wins: 0, losses: 0, draws: 0, season: 1, trainingPoints: 5,
      createdAt: new Date().toISOString(),
    });
    setScreen('team-builder');
  }, [did]);

  const initSeason = useCallback(() => {
    if (!team || team.players.length < 9) return;
    const s = createSeason(team, 'bashball');
    setSeason(s);
    store.save(`bashball-season-${did}`, s);
    setScreen('season');
  }, [team, did]);

  const playGame = useCallback((gameId: string) => {
    if (!season || !team) return;
    const sched = season.schedule.find(g => g.id === gameId);
    if (!sched) return;
    playRiser(100, 400, 0.6);
    const pitcher = team.players.find(p => team.baseballLineup.find(l => l.position === 'P')?.playerId === p.id) ?? team.players[0];
    const simulated = simulateBashballGame(team.players, pitcher, { hitting: 40, power: 40, speed: 40, fielding: 40, pitching: 40 + Math.floor(Math.random() * 30) }, 0.5, spoons);
    const result: GameResult = {
      homeScore: simulated.homeScore, awayScore: simulated.awayScore,
      winner: simulated.winner === 'home' ? team.id : sched.awayTeamId,
      playerHits: simulated.homeHits, playerRuns: simulated.homeScore,
    };
    const newSeason = recordResult(season, gameId, result);
    if (simulated.winner === 'home') {
      actions.addLove(LOVE_REWARDS.bashball_win);
      (async () => { await mintLOVE(LOVE_REWARDS.bashball_win, 'bashball_win'); })();
      playChord([P31_F.root, P31_F.fifth, P31_F.octave], 1.5, 0.08);
    } else {
      playNote(P31_F.root, 0.4, 0.05);
    }
    store.save(`bashball-season-${did}`, newSeason);
    setSeason(newSeason);
    setLastGameScore({ home: simulated.homeScore, away: simulated.awayScore, hits: simulated.homeHits });

    if (simulated.highlights.some(h => h.includes('HOME RUN'))) {
      setFlashingScore(true);
      if (particlesRef.current) {
        particlesRef.current.emit(200, 300, 60, { color: '#FBBF24' });
      }
    }
    if (simulated.winner === 'home') {
      setTimeout(() => setFlashingScore(false), 2000);
    }
  }, [season, team, spoons, did, actions, mintLOVE]);

  useEffect(() => {
    (async () => {
      const saved = await store.load<Season>(`bashball-season-${did}`);
      if (saved) { setSeason(saved); const t = await store.load<Team>(`bashball-team-${did}`); if (t) setTeam(t); setScreen('season'); }
    })();
  }, [did]);
  useEffect(() => { if (team) store.save(`bashball-team-${did}`, team); }, [team, did]);
  useEffect(() => { const i = setInterval(() => actions.updateJitterbug(), 16); return () => clearInterval(i); }, [actions]);

  useEffect(() => {
    const timer = setInterval(() => setTitleTime(t => t + 0.016), 16);
    return () => clearInterval(timer);
  }, []);

  const onPhase = state.jitterbug?.phase ?? 0;
  const isNaN_phase = typeof onPhase !== 'number' || isNaN(onPhase);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = 400, h = 500;
    canvas.width = w; canvas.height = h;

    if (!particlesRef.current) particlesRef.current = new ParticleSystem(ctx);

    if (screen !== 'training') {
      fieldCache.current = null;
    }

    const animate = () => {
      ctx.clearRect(0, 0, w, h);

      if (!fieldCache.current || w !== fieldCache.current.width || h !== fieldCache.current.height) {
        drawFieldStatic(ctx, w, h);
        try { fieldCache.current = ctx.getImageData(0, 0, w, h); } catch {}
      } else {
        ctx.putImageData(fieldCache.current!, 0, 0);
      }

      if (!isNaN_phase) {
        const verts = jitterbugVertices(onPhase);
        const jedges = jitterbugEdges(onPhase);
        if (verts && jedges && verts.length) {
          ctx.save(); ctx.translate(200, 310);
          const breathe = 1 + Math.sin(titleTime * 0.8) * 0.03;
          ctx.scale(breathe, breathe);
          ctx.shadowColor = '#FBBF24'; ctx.shadowBlur = 10;
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)'; ctx.lineWidth = 2;
          for (const [a, b] of jedges) {
            const va = verts[Math.min(a, verts.length - 1)];
            const vb = verts[Math.min(b, verts.length - 1)];
            if (!va || !vb) continue;
            ctx.beginPath(); ctx.moveTo(va.x * 25, va.y * 25); ctx.lineTo(vb.x * 25, vb.y * 25); ctx.stroke();
          }
          ctx.shadowBlur = 0;
          for (const v of verts) {
            ctx.beginPath(); ctx.arc(v.x * 25, v.y * 25, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = '#FBBF24'; ctx.shadowColor = '#FBBF24'; ctx.shadowBlur = 8; ctx.fill();
            ctx.shadowBlur = 0;
          }
          ctx.restore();
        }
      }

      if (team?.baseballLineup) {
        for (const slot of team.baseballLineup) {
          const pos = FIELD_POSITIONS[slot.position];
          if (!pos) continue;
          const player = team.players.find(p => p.id === slot.playerId);
          if (!player) continue;
          const bounce = Math.sin(titleTime * 2 + slot.battingOrder) * 0.7;
          drawPlayerSprite(ctx, pos.x, pos.y + bounce, team.colors.primary, 9);
        }
      }

      particlesRef.current?.update(0.016);
      particlesRef.current?.draw();

      if (lastGameScore) {
        ctx.font = 'bold 16px monospace'; ctx.textAlign = 'center';
        const glowAlpha = flashingScore ? 0.5 + Math.sin(titleTime * 8) * 0.3 : 0.3;
        ctx.shadowColor = flashingScore ? '#FBBF24' : '#00F0FF';
        ctx.shadowBlur = flashingScore ? 16 : 8;
        ctx.fillStyle = flashingScore ? '#FBBF24' : '#00F0FF';
        ctx.fillText(`${lastGameScore.home} - ${lastGameScore.away}`, w / 2, 22);
        ctx.shadowBlur = 0;
        ctx.font = '9px monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText(`${lastGameScore.hits} hits`, w / 2, 36);
      }

      requestAnimationFrame(animate);
    };
    const raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [onPhase, isNaN_phase, titleTime, team, lastGameScore, flashingScore, screen]);

  const togglePlayer = (kid: PlayerCharacter) => {
    if (!team) return;
    const has = team.players.find(p => p.id === kid.id);
    let updated: Team;
    if (has) {
      updated = { ...team, players: team.players.filter(p => p.id !== kid.id), baseballLineup: team.baseballLineup.filter(l => l.playerId !== kid.id) };
    } else {
      if (team.players.length >= 9) return;
      const nextOrder = team.baseballLineup.length + 1;
      const pos = BASEBALL_POSITIONS[team.baseballLineup.length % 9];
      updated = { ...team, players: [...team.players, kid], baseballLineup: [...team.baseballLineup, { playerId: kid.id, position: pos, battingOrder: nextOrder }] };
    }
    setTeam(updated);
  };

  const updatePosition = (playerId: string, position: typeof BASEBALL_POSITIONS[number]) => {
    if (!team) return;
    setTeam({ ...team, baseballLineup: team.baseballLineup.map(l => l.playerId === playerId ? { ...l, position } : l) });
  };

  const moveUp = (playerId: string) => {
    if (!team) return;
    const idx = team.baseballLineup.findIndex(l => l.playerId === playerId);
    if (idx <= 0) return;
    const nl = [...team.baseballLineup];
    [nl[idx - 1].battingOrder, nl[idx].battingOrder] = [nl[idx].battingOrder, nl[idx - 1].battingOrder];
    [nl[idx - 1], nl[idx]] = [nl[idx], nl[idx - 1]];
    setTeam({ ...team, baseballLineup: nl });
  };

  const moveDown = (playerId: string) => {
    if (!team) return;
    const idx = team.baseballLineup.findIndex(l => l.playerId === playerId);
    if (idx < 0 || idx >= team.baseballLineup.length - 1) return;
    const nl = [...team.baseballLineup];
    [nl[idx].battingOrder, nl[idx + 1].battingOrder] = [nl[idx + 1].battingOrder, nl[idx].battingOrder];
    [nl[idx], nl[idx + 1]] = [nl[idx + 1], nl[idx]];
    setTeam({ ...team, baseballLineup: nl });
  };

  const runPlayerTraining = (player: PlayerCharacter, stat: string) => {
    if (!team) return;
    const result = runTraining(player, stat, spoons);
    setTrainingSessions(s => [...s, { ...result, playerId: player.id, date: result.date, game: result.game }]);
    setTeam({ ...team, players: team.players.map(p => p.id === player.id ? result.player : p), trainingPoints: Math.max(0, team.trainingPoints - 1) });
    if (result.result === 'critical') playChord([P31_F.root, P31_F.third, P31_F.octave], 0.5, 0.06);
    else if (result.result === 'success') playNote(P31_F.third, 0.3, 0.05);
    else playNote(P31_F.root, 0.2, 0.03);
  };

  const renderTitle = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      <div style={{ fontSize: 32, fontWeight: 800, color: '#FBBF24', fontFamily: 'monospace', letterSpacing: 2, textShadow: '0 0 30px rgba(251,191,36,0.3)' }}>⚾ BASHBALL</div>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', maxWidth: 300 }}>Draft your team. Train your players. Win the season.</p>
      {season ? <button onClick={() => setScreen('season')} style={btnStyle(false, '#FBBF24')}>Continue Season</button> : null}
      <button onClick={initTeam} style={btnStyle(false, '#00F0FF')}>{season ? 'New Team' : 'Start New Team'}</button>
      {team ? <button onClick={() => setScreen('training')} style={btnGhost()}>Training Facility</button> : null}
      <canvas ref={canvasRef} style={{ width: 400, height: 500, borderRadius: 16, border: '1px solid rgba(0,240,255,0.15)', marginTop: 8, boxShadow: '0 0 30px rgba(0,240,255,0.08)' }} />
      <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
        {([0,1,2,3,4,5] as const).map(s => (
          <button key={s} onClick={() => { setSpoons(s); playNote(P31_F.root + s * 10, 0.1, 0.04); }} style={{
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
      <div style={{ fontSize: 20, fontWeight: 700, color: '#00F0FF', fontFamily: 'monospace' }}>Build Your Team</div>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Pick 9 players ({team?.players.length ?? 0}/9 selected)</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
        {kids.map(kid => {
          const selected = team?.players.find(p => p.id === kid.id);
          return (
            <button key={kid.id} onClick={() => togglePlayer(kid)} style={{
              ...glassStyle(), display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'left',
              border: selected ? '1px solid rgba(0,240,255,0.5)' : undefined,
              background: selected ? 'rgba(0,240,255,0.08)' : undefined,
            }}>
              <span style={{ fontSize: 24 }}>{kid.avatar}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#F5F5F7' }}>{kid.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{kid.bio.slice(0, 60)}...</div>
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
      {team && team.players.length > 0 && (
        <div style={{ ...glassStyle(), maxHeight: 320, overflowY: 'auto' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#FBBF24', marginBottom: 8, fontFamily: 'monospace' }}>Lineup &amp; Positions</div>
          {[...team.baseballLineup].sort((a,b) => a.battingOrder - b.battingOrder).map((slot) => {
            const player = team.players.find(p => p.id === slot.playerId);
            if (!player) return null;
            return (
              <div key={slot.playerId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color: '#00F0FF', fontFamily: 'monospace', fontSize: 12 }}>#{slot.battingOrder}</span>
                <span style={{ fontSize: 16 }}>{player.avatar}</span>
                <span style={{ flex: 1, fontSize: 12, color: '#F5F5F7' }}>{player.name}</span>
                <select value={slot.position} onChange={e => updatePosition(slot.playerId, e.target.value as typeof BASEBALL_POSITIONS[number])} style={{
                  padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.15)', background: '#0A0A0F',
                  color: '#F5F5F7', fontSize: 11, fontFamily: 'monospace', cursor: 'pointer',
                }}>
                  {BASEBALL_POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <button onClick={() => moveUp(slot.playerId)} style={{ ...btnGhost(), padding: '2px 6px', fontSize: 10 }}>↑</button>
                <button onClick={() => moveDown(slot.playerId)} style={{ ...btnGhost(), padding: '2px 6px', fontSize: 10 }}>↓</button>
              </div>
            );
          })}
        </div>
      )}
      <button onClick={initSeason} disabled={!team || team.players.length < 9} style={btnStyle(!team || team.players.length < 9, '#FBBF24')}>Start Season →</button>
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
        const member = team.baseballLineup.find(l => l.playerId === player.id);
        if (!member) return null;
        return (
          <details key={player.id} style={glassStyle()}>
            <summary style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#F5F5F7', fontFamily: 'monospace' }}>
              <span style={{ fontSize: 18 }}>{player.avatar}</span>
              {player.name} <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Lv.{xpToLevel(player.xp)} {player.xp}/{xpForLevel(xpToLevel(player.xp) + 1)}xp</span>
            </summary>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <StatBar label="Hitting" value={player.stats.hitting} />
              <StatBar label="Power" value={player.stats.power} color="#FBBF24" />
              <StatBar label="Speed" value={player.stats.speed} color="#34D399" />
              <StatBar label="Fielding" value={player.stats.fielding} color="#A78BFA" />
              <StatBar label="Pitching" value={player.stats.pitching} color="#FB7185" />
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <button onClick={() => runPlayerTraining(player, 'hitting')} style={btnGhost()}>Hit Target</button>
                <button onClick={() => runPlayerTraining(player, 'fielding')} style={btnGhost()}>Field Drill</button>
                <button onClick={() => runPlayerTraining(player, 'pitching')} style={btnGhost()}>Pitch Precision</button>
              </div>
            </div>
          </details>
        );
      })}
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 36px 36px 36px', gap: 8, fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 4, padding: '0 4px' }}>
              <span>Team</span><span style={{ textAlign: 'right' }}>W</span><span style={{ textAlign: 'right' }}>L</span><span style={{ textAlign: 'right' }}>D</span>
            </div>
            {season.standings.map(s => {
              const name = s.teamId === season.playerTeamId ? (team?.name ?? 'Your Team') : (season.teams.find(t => t.id === s.teamId)?.name ?? 'Unknown');
              const isPlayer = s.teamId === season.playerTeamId;
              return (
                <div key={s.teamId} style={{ display: 'grid', gridTemplateColumns: '1fr 36px 36px 36px', gap: 8, fontSize: 12, fontFamily: 'monospace', padding: '3px 4px', color: isPlayer ? '#FBBF24' : 'rgba(255,255,255,0.7)', background: isPlayer ? 'rgba(251,191,36,0.06)' : undefined, borderRadius: 4 }}>
                  <span>{isPlayer ? '⭐ ' : ''}{name}</span>
                  <span style={{ textAlign: 'right', color: '#34D399' }}>{s.wins}</span>
                  <span style={{ textAlign: 'right', color: '#FB7185' }}>{s.losses}</span>
                  <span style={{ textAlign: 'right', color: 'rgba(255,255,255,0.3)' }}>{s.draws}</span>
                </div>
              );
            })}
          </div>
          <div style={glassStyle()}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#FBBF24', marginBottom: 8, fontFamily: 'monospace' }}>Week {season.currentWeek} / {season.maxWeeks}</div>
            {getWeekGames(season, season.currentWeek).map(game => {
              const homeName = game.homeTeamId === season.playerTeamId ? (team?.name ?? 'You') : (season.teams.find(t => t.id === game.homeTeamId)?.name ?? '???');
              const awayName = game.awayTeamId === season.playerTeamId ? (team?.name ?? 'You') : (season.teams.find(t => t.id === game.awayTeamId)?.name ?? '???');
              const isPlayer = game.homeTeamId === season.playerTeamId || game.awayTeamId === season.playerTeamId;
              return (
                <div key={game.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'rgba(255,255,255,0.7)' }}>{homeName} vs {awayName}</span>
                  {!game.result && isPlayer ? (
                    <button onClick={() => playGame(game.id)} style={{
                      ...btnStyle(false, '#00F0FF'), fontSize: 11, padding: '6px 14px', boxShadow: '0 0 16px rgba(0,240,255,0.25)',
                    }}>Play!</button>
                  ) : (
                    <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 600, color: game.result?.winner === season.playerTeamId ? '#34D399' : '#FB7185' }}>
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
                <div style={{ color: '#FBBF24', fontSize: 16, fontWeight: 700, textAlign: 'center' }}>Champion: {season.champion === season.playerTeamId ? (team?.name ?? 'YOU!') : (season.teams.find(t => t.id === season.champion)?.name ?? '???')}</div>
              ) : (
                season.playoffBracket.map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16, justifyContent: 'center', fontSize: 12, padding: 4, color: 'rgba(255,255,255,0.7)' }}>
                    <span style={{ fontWeight: m.teamA === season.playerTeamId ? 700 : 400, color: m.teamA === season.playerTeamId ? '#FBBF24' : undefined }}>
                      {m.teamA === season.playerTeamId ? '⭐ You' : (season.teams.find(t => t.id === m.teamA)?.name ?? 'TBD')}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>vs</span>
                    <span style={{ fontWeight: m.teamB === season.playerTeamId ? 700 : 400, color: m.teamB === season.playerTeamId ? '#FBBF24' : undefined }}>
                      {m.teamB === season.playerTeamId ? '⭐ You' : (season.teams.find(t => t.id === m.teamB)?.name ?? 'TBD')}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
          {lastGameScore && (
            <div style={glassStyle()}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#00F0FF', marginBottom: 8, fontFamily: 'monospace' }}>Last Game</div>
              <div style={{ fontSize: 22, fontWeight: 800, textAlign: 'center', color: flashingScore ? '#FBBF24' : '#F5F5F7', textShadow: flashingScore ? '0 0 20px rgba(251,191,36,0.5)' : undefined }}>
                {lastGameScore.home} - {lastGameScore.away}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                {lastGameScore.hits} hits
              </div>
            </div>
          )}
        </>
      )}
      <canvas ref={canvasRef} style={{ width: 400, height: 500, borderRadius: 16, border: '1px solid rgba(0,240,255,0.15)', boxShadow: '0 0 30px rgba(0,240,255,0.08)' }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px', maxWidth: 440, margin: '0 auto', fontFamily: 'monospace' }}>
      {screen === 'title' && renderTitle()}
      {screen === 'team-builder' && renderTeamBuilder()}
      {screen === 'training' && renderTraining()}
      {screen === 'season' && renderSeason()}
    </div>
  );
}
