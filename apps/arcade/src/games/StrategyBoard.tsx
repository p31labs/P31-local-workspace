import { useRef, useEffect, useState, useCallback } from 'react';
import { usePlayer } from '../components/PlayerProvider';
import { useGameEngine } from '@p31/game-engine/react';
import { jitterbugVertices, jitterbugEdges } from '@p31/game-engine';
import { LOVE_REWARDS, store, xpToLevel, xpForLevel, ParticleSystem } from './common/index.js';
import { playNote, playChord, playRiser, P31_F } from './common/sound.js';

const P31_FREQ = 172.35;
const P31_WIN = 517.05;
const P31_XP = 258.65;

type UnitType = 'infantry' | 'cavalry' | 'archer' | 'siege';
type PlayerSide = 'player' | 'enemy';
type Screen = 'title' | 'camp' | 'battle' | 'victory';

interface Unit {
  id: string;
  name: string;
  type: UnitType;
  side: PlayerSide;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  moveRange: number;
  atkRange: number;
  xp: number;
  level: number;
  row: number;
  col: number;
  hasMoved: boolean;
  hasAttacked: boolean;
}

interface Mission {
  id: number;
  name: string;
  description: string;
  enemyUnits: Unit[];
  rewardLove: number;
  rewardXp: number;
  unlockedTypes: UnitType[];
}

const UNIT_DEF: Record<UnitType, { maxHp: number; attack: number; defense: number; moveRange: number; atkRange: number; emoji: string; name: string }> = {
  infantry: { maxHp: 60, attack: 30, defense: 20, moveRange: 2, atkRange: 1, emoji: '⚔️', name: 'Infantry' },
  cavalry:   { maxHp: 45, attack: 35, defense: 10, moveRange: 3, atkRange: 1, emoji: '🐴', name: 'Cavalry' },
  archer:    { maxHp: 35, attack: 25, defense: 5,  moveRange: 2, atkRange: 3, emoji: '🏹', name: 'Archer' },
  siege:     { maxHp: 80, attack: 50, defense: 30, moveRange: 1, atkRange: 4, emoji: '🏰', name: 'Siege' },
};

const MISSIONS: Mission[] = [
  { id: 1, name: 'The Bridge', description: 'Hold the bridge crossing. Enemy infantry approach.', enemyUnits: [], rewardLove: 50, rewardXp: 100, unlockedTypes: ['infantry'] },
  { id: 2, name: 'Wolf Den', description: 'Clear the den of wolves. Cavalry flank from the sides.', enemyUnits: [], rewardLove: 75, rewardXp: 150, unlockedTypes: ['infantry'] },
  { id: 3, name: 'Archer\'s Pass', description: 'Enemy archers hold the high ground.', enemyUnits: [], rewardLove: 100, rewardXp: 200, unlockedTypes: ['infantry', 'cavalry'] },
  { id: 4, name: 'Cavalry Charge', description: 'Hold the line against mounted foes.', enemyUnits: [], rewardLove: 120, rewardXp: 240, unlockedTypes: ['infantry', 'cavalry'] },
  { id: 5, name: 'Siegeworks', description: 'Heavy siege engines bombard your position.', enemyUnits: [], rewardLove: 150, rewardXp: 300, unlockedTypes: ['infantry', 'cavalry', 'archer'] },
  { id: 6, name: 'Twin Forts', description: 'Two forts must fall. Split your forces.', enemyUnits: [], rewardLove: 180, rewardXp: 360, unlockedTypes: ['infantry', 'cavalry', 'archer'] },
  { id: 7, name: 'Dark Marsh', description: 'Movement slowed in the bog. Archers rain fire.', enemyUnits: [], rewardLove: 200, rewardXp: 420, unlockedTypes: ['infantry', 'cavalry', 'archer', 'siege'] },
  { id: 8, name: 'King\'s Road', description: 'Protect the caravan. Ambushers everywhere.', enemyUnits: [], rewardLove: 250, rewardXp: 500, unlockedTypes: ['infantry', 'cavalry', 'archer', 'siege'] },
  { id: 9, name: 'Citadel Gates', description: 'Breach the outer walls. Heavy infantry guard.', enemyUnits: [], rewardLove: 300, rewardXp: 600, unlockedTypes: ['infantry', 'cavalry', 'archer', 'siege'] },
  { id: 10, name: 'Throne Room', description: 'The final assault. All enemy types defend the throne.', enemyUnits: [], rewardLove: 400, rewardXp: 800, unlockedTypes: ['infantry', 'cavalry', 'archer', 'siege'] },
  { id: 11, name: 'Dragon\'s Peak', description: 'A dragon guards the peak. Bring everything.', enemyUnits: [], rewardLove: 500, rewardXp: 1000, unlockedTypes: ['infantry', 'cavalry', 'archer', 'siege'] },
  { id: 12, name: 'Final Stand', description: 'The last battle. Victory or defeat.', enemyUnits: [], rewardLove: 600, rewardXp: 1200, unlockedTypes: ['infantry', 'cavalry', 'archer', 'siege'] },
];

function playTone(freq: number, dur: number, vol = 0.1) {
  playNote(freq, dur, vol);
}

import { glassStyle, btnStyle, btnGhost } from './common/styles';

function createUnit(type: UnitType, side: PlayerSide, row: number, col: number, level = 1): Unit {
  const def = UNIT_DEF[type];
  const bonus = (level - 1) * 5;
  return {
    id: `${side}-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: def.name, type, side,
    hp: def.maxHp + bonus, maxHp: def.maxHp + bonus,
    attack: def.attack + bonus, defense: def.defense + bonus,
    moveRange: def.moveRange, atkRange: def.atkRange,
    xp: 0, level,
    row, col,
    hasMoved: false, hasAttacked: false,
  };
}

function generateEnemies(mission: number, spoons: number): Unit[] {
  const baseCount = 3 + Math.floor(mission / 3);
  const types: UnitType[] = ['infantry', 'cavalry', 'archer', 'siege'];
  const enemies: Unit[] = [];
  for (let i = 0; i < baseCount; i++) {
    const type = types[Math.min(3, Math.floor(i + mission / 4)) % types.length];
    const level = Math.max(1, Math.floor(mission / 3) + (spoons > 3 ? 1 : 0));
    const row = 1 + Math.floor(Math.random() * 2);
    const col = 1 + Math.floor(Math.random() * 6);
    enemies.push(createUnit(type, 'enemy', row, col, level));
  }
  return enemies;
}

function manhattan(a: { row: number; col: number }, b: { row: number; col: number }): number {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

function inRange(unit: Unit, target: { row: number; col: number }, range: number): boolean {
  return manhattan(unit, target) <= range;
}

function findTarget(units: Unit[], attacker: Unit): Unit | null {
  const enemies = units.filter(u => u.side !== attacker.side && u.hp > 0);
  if (!enemies.length) return null;
  const inR = enemies.filter(e => inRange(attacker, e, attacker.atkRange));
  if (inR.length) return inR.sort((a, b) => b.hp - a.hp)[0];
  return enemies.sort((a, b) => manhattan(attacker, a) - manhattan(attacker, b))[0];
}

function canMoveTo(units: Unit[], unit: Unit, row: number, col: number, maxRange: number): boolean {
  if (row < 0 || row >= 8 || col < 0 || col >= 8) return false;
  if (manhattan(unit, { row, col }) > maxRange) return false;
  return !units.some(u => u.side === unit.side && u.hp > 0 && u.row === row && u.col === col && u.id !== unit.id);
}

function adjPositions(row: number, col: number): [number, number][] {
  return [[row-1,col],[row+1,col],[row,col-1],[row,col+1]];
}

export default function StrategyBoard() {
  const { spoons, setSpoons, mintLOVE } = usePlayer();
  const { state, actions } = useGameEngine({ type: 'strategy', spoons,
    onComplete: (data) => { playChord([P31_F.root, P31_F.fifth, P31_F.octave], 1.5, 0.12); mintLOVE(data.loveEarned, 'strategy_game'); },
  });

  const [screen, setScreen] = useState<Screen>('title');
  const [campaignProgress, setCampaignProgress] = useState(1);
  const [roster, setRoster] = useState<Unit[]>(() => [createUnit('infantry', 'player', 6, 2), createUnit('infantry', 'player', 7, 3), createUnit('infantry', 'player', 6, 5)]);
  const [unlockedTypes, setUnlockedTypes] = useState<UnitType[]>(['infantry']);
  const [allUnits, setAllUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [moveMode, setMoveMode] = useState(false);
  const [atkMode, setAtkMode] = useState(false);
  const [turn, setTurn] = useState<'player' | 'enemy'>('player');
  const [message, setMessage] = useState('');
  const [totalLove, setTotalLove] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<ParticleSystem | null>(null);
  const fieldCache = useRef<ImageData | null>(null);

  const spawnParticles = (x: number, y: number, count: number, color: string) => {
    if (particlesRef.current) particlesRef.current.emit(x, y, count, { color });
  };

  const startMission = useCallback((missionId: number) => {
    const mission = MISSIONS[missionId - 1];
    if (!mission) return;
    const enemies = generateEnemies(missionId, spoons);
    const ours = roster.filter(u => u.hp > 0).map(u => ({ ...u, hasMoved: false, hasAttacked: false }));
    setAllUnits([...ours, ...enemies]);
    setTurn('player');
    setSelectedUnit(null);
    setMoveMode(false);
    setAtkMode(false);
    setMessage(mission.description);
    playNote(P31_F.root, 0.25, 0.05);
    setScreen('battle');
  }, [roster, spoons]);

  const handleTileClick = useCallback((row: number, col: number) => {
    if (turn !== 'player' || screen !== 'battle') return;

    if (atkMode && selectedUnit) {
      const attacker = allUnits.find(u => u.id === selectedUnit);
      if (!attacker) return;
      const target = allUnits.find(u => u.side !== attacker.side && u.hp > 0 && u.row === row && u.col === col);
      if (target && inRange(attacker, target, attacker.atkRange)) {
        const dmg = Math.max(1, attacker.attack - target.defense / 2 + Math.floor(Math.random() * 10));
        const updated = allUnits.map(u => {
          if (u.id === target.id) return { ...u, hp: Math.max(0, u.hp - dmg) };
          if (u.id === attacker.id) return { ...u, hasAttacked: true, xp: u.xp + 15 };
          return u;
        });
        setAllUnits(updated);
        spawnParticles(50 + col * 50, 60 + row * 50, 8, '#FB7185');
        playNote(P31_F.third, 0.15, 0.07);
        setMessage(`${attacker.name} deals ${dmg} damage to ${target.name}`);
        setSelectedUnit(null); setAtkMode(false); setMoveMode(false);
        checkWinCondition(updated);
        checkTurnEnd(updated);
        return;
      }
      setAtkMode(false); setSelectedUnit(null); setMoveMode(false);
      return;
    }

    if (moveMode && selectedUnit) {
      const unit = allUnits.find(u => u.id === selectedUnit);
      if (!unit) return;
      if (canMoveTo(allUnits, unit, row, col, unit.moveRange)) {
        const updated = allUnits.map(u => u.id === unit.id ? { ...u, row, col, hasMoved: true } : u);
        setAllUnits(updated);
        playNote(P31_F.root, 0.1, 0.04);
        setMoveMode(false);
        const moved = updated.find(u => u.id === unit.id)!;
        const hasTarget = allUnits.some(u => u.side === 'enemy' && u.hp > 0 && inRange(moved, u, moved.atkRange));
        if (hasTarget) {
          setAtkMode(true);
          setMessage('Select a target to attack or click to pass');
        } else {
          setSelectedUnit(null);
          checkTurnEnd(updated);
        }
        return;
      }
      setMoveMode(false); setSelectedUnit(null);
      return;
    }

    const clicked = allUnits.find(u => u.side === 'player' && u.hp > 0 && u.row === row && u.col === col);
    if (clicked && !clicked.hasMoved) {
      setSelectedUnit(clicked.id);
      setMoveMode(true);
      setAtkMode(false);
      setMessage(`${clicked.name} selected. Click tile to move.`);
      return;
    }
    if (clicked && clicked.hasMoved && !clicked.hasAttacked) {
      setSelectedUnit(clicked.id);
      setAtkMode(true);
      setMoveMode(false);
      setMessage(`${clicked.name} selected. Click enemy to attack.`);
      return;
    }
    setSelectedUnit(null); setMoveMode(false); setAtkMode(false);
  }, [allUnits, selectedUnit, moveMode, atkMode, turn, screen]);

  const endPlayerTurn = useCallback(() => {
    setTurn('enemy');
    setSelectedUnit(null); setMoveMode(false); setAtkMode(false);
    setMessage('Enemy turn...');
    setTimeout(() => doEnemyTurn(), 500);
  }, [allUnits]);

  const checkTurnEnd = useCallback((units: Unit[]) => {
    const canAct = units.some(u => u.side === 'player' && u.hp > 0 && (!u.hasMoved || !u.hasAttacked));
    if (!canAct) endPlayerTurn();
  }, [endPlayerTurn]);

  const checkWinCondition = useCallback((units: Unit[]) => {
    const playerAlive = units.some(u => u.side === 'player' && u.hp > 0);
    const enemyAlive = units.some(u => u.side === 'enemy' && u.hp > 0);
    if (!enemyAlive) {
      const mission = MISSIONS[campaignProgress - 1];
      const love = mission.rewardLove + spoons * 20;
      actions.addLove(love);
      setTotalLove(l => l + love);
      (async () => { await mintLOVE(love, 'strategy_mission'); })();
      setMessage(`Victory! +${love} LOVE`);
      const updatedRoster = units.filter(u => u.side === 'player').map(u => {
        const newXp = u.xp + mission.rewardXp;
        const newLevel = xpToLevel(newXp);
        return { ...u, xp: newXp, level: newLevel, hp: u.hp };
      });
      setRoster(updatedRoster);
      const types = mission.unlockedTypes;
      if (types.length > unlockedTypes.length) setUnlockedTypes(types);
      spawnParticles(200, 300, 50, '#FBBF24');
      playChord([P31_F.root, P31_F.third, P31_F.fifth], 1.5, 0.15);
      setTimeout(() => {
        setScreen('victory');
        setCampaignProgress(p => Math.min(12, p + 1));
      }, 1200);
    } else if (!playerAlive) {
      setMessage('Defeat! Your forces have fallen.');
      playNote(80, 0.5, 0.05);
      setTimeout(() => setScreen('camp'), 1500);
    }
  }, [campaignProgress, spoons, actions, mintLOVE, unlockedTypes]);

  const doEnemyTurn = () => {
    const updated = [...allUnits];
    const enemies = updated.filter(u => u.side === 'enemy' && u.hp > 0);
    for (const enemy of enemies) {
      const target = findTarget(updated, enemy);
      if (!target) continue;
      if (inRange(enemy, target, enemy.atkRange)) {
        const dmg = Math.max(1, enemy.attack - target.defense / 2 + Math.floor(Math.random() * 6));
        const tgt = updated.find(u => u.id === target.id);
        if (tgt) tgt.hp = Math.max(0, tgt.hp - dmg);
        spawnParticles(50 + target.col * 50, 60 + target.row * 50, 5, '#FB7185');
      } else {
        const adj = adjPositions(enemy.row, enemy.col);
        let best = adj.find(([r, c]) => canMoveTo(updated, enemy, r, c, 1) && manhattan({row:r,col:c}, target) < manhattan(enemy, target));
        if (best) { enemy.row = best[0]; enemy.col = best[1]; }
      }
    }
    setAllUnits(updated.map(u => ({ ...u, hasMoved: false, hasAttacked: false })));
    setTurn('player');
    setMessage('Your turn. Select a unit.');
    checkWinCondition(updated);
  };

  const addToRoster = (type: UnitType) => {
    if (!unlockedTypes.includes(type)) return;
    const newUnit = createUnit(type, 'player', 6 + roster.length, 1 + roster.length % 4);
    setRoster([...roster, newUnit]);
    playNote(P31_F.octave, 0.25, 0.05);
  };

  useEffect(() => { const i = setInterval(() => actions.updateJitterbug(), 16); return () => clearInterval(i); }, [actions]);

  const onPhase = state.jitterbug?.phase ?? 0;
  const isNaN_phase = typeof onPhase !== 'number' || isNaN(onPhase);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = 400, h = 450, gridS = 50, ox = 0, oy = 50;
    canvas.width = w; canvas.height = h;
    if (!particlesRef.current) particlesRef.current = new ParticleSystem(ctx);

    const staticCacheKey = `${screen}`;
    const prevCache = fieldCache.current;

    const animate = () => {
      ctx.clearRect(0, 0, w, h);

      const needRedraw = !prevCache || prevCache.width !== w;
      if (needRedraw) {
        const bgGrad = ctx.createRadialGradient(w/2, h/2, 50, w/2, h/2, 350);
        bgGrad.addColorStop(0, '#0a0a0f');
        bgGrad.addColorStop(1, '#050510');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        if (!isNaN_phase) {
          const v = jitterbugVertices(onPhase);
          const e = jitterbugEdges(onPhase);
          if (v && e && v.length) {
            ctx.save(); ctx.translate(w / 2, h / 2); ctx.scale(20, 20);
            ctx.strokeStyle = 'rgba(167, 139, 250, 0.06)'; ctx.lineWidth = 0.06;
            for (const [a, b] of e) {
              const va = v[Math.min(a, v.length - 1)]; const vb = v[Math.min(b, v.length - 1)];
              if (!va || !vb) continue;
              ctx.beginPath(); ctx.moveTo(va.x, va.y); ctx.lineTo(vb.x, vb.y); ctx.stroke();
            }
            ctx.restore();
          }
        }
        try { fieldCache.current = ctx.getImageData(0, 0, w, h); } catch {}
      } else {
        ctx.putImageData(prevCache!, 0, 0);
      }

      const units = screen === 'battle' ? allUnits : [];
      const sel = selectedUnit ? units.find(u => u.id === selectedUnit) : null;

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const x = ox + c * gridS, y = oy + r * gridS;
          const isDark = (r + c) % 2 === 0;
          ctx.fillStyle = isDark ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.04)';
          ctx.fillRect(x, y, gridS, gridS);
          ctx.strokeStyle = 'rgba(167,139,250,0.08)'; ctx.lineWidth = 0.5;
          ctx.strokeRect(x, y, gridS, gridS);

          if (moveMode && sel && canMoveTo(units, sel, r, c, sel.moveRange)) {
            ctx.shadowColor = '#00F0FF'; ctx.shadowBlur = 8;
            ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
            ctx.fillRect(x, y, gridS, gridS);
            ctx.shadowBlur = 0;
          }
          if (atkMode && sel) {
            const enemyOnTile = units.find(u => u.side !== sel.side && u.hp > 0 && u.row === r && u.col === c);
            if (enemyOnTile && inRange(sel, enemyOnTile, sel.atkRange)) {
              ctx.shadowColor = '#FB7185'; ctx.shadowBlur = 10;
              ctx.fillStyle = 'rgba(251, 113, 133, 0.25)';
              ctx.fillRect(x, y, gridS, gridS);
              ctx.shadowBlur = 0;
            }
          }
        }
      }

      for (const u of units) {
        if (u.hp <= 0) continue;
        const cx = ox + u.col * gridS + gridS / 2, cy = oy + u.row * gridS + gridS / 2;
        const isPlayer = u.side === 'player';
        const isSel = sel && u.id === sel.id;

        ctx.shadowColor = isPlayer ? '#00F0FF' : '#FB7185';
        ctx.shadowBlur = isSel ? 14 : 6;
        ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.fillStyle = isPlayer ? '#00F0FF' : '#FB7185';
        ctx.fill();
        ctx.shadowBlur = 0;
        if (isSel) { ctx.strokeStyle = '#FBBF24'; ctx.lineWidth = 2; ctx.stroke(); }

        ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#0A0A0F';
        ctx.fillText(UNIT_DEF[u.type].emoji, cx, cy);

        const hpPct = u.hp / u.maxHp;
        const barY = cy + 22;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(cx - 15, barY, 30, 4);
        ctx.fillStyle = hpPct > 0.5 ? '#34D399' : hpPct > 0.25 ? '#FBBF24' : '#FB7185';
        ctx.fillRect(cx - 15, barY, 30 * hpPct, 4);
      }

      particlesRef.current?.update(0.016);
      particlesRef.current?.draw();

      requestAnimationFrame(animate);
    };
    const raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [allUnits, selectedUnit, moveMode, atkMode, onPhase, isNaN_phase, screen]);

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (screen !== 'battle') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const gridS = 50, ox = 0, oy = 50;
    const col = Math.floor((x - ox) / gridS);
    const row = Math.floor((y - oy) / gridS);
    handleTileClick(row, col);
  };

  const renderTitle = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#A78BFA', fontFamily: 'monospace' }}>♟️ Strategy Board</div>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', maxWidth: 300 }}>
        Deploy your units. Conquer 12 missions. Win the war.
      </p>
      <button onClick={() => setScreen('camp')} style={btnStyle(false, '#A78BFA')}>Open Campaign</button>
      <canvas ref={canvasRef} style={{ width: 400, height: 450, borderRadius: 16, border: '1px solid rgba(167,139,250,0.2)', boxShadow: '0 0 30px rgba(167,139,250,0.08)' }} />
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

  const renderCamp = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <button onClick={() => setScreen('title')} style={btnGhost()}>← Back</button>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#A78BFA', fontFamily: 'monospace' }}>Campaign</div>
      <div style={{ ...glassStyle(), display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#FBBF24', marginBottom: 4, fontFamily: 'monospace' }}>Your Roster</div>
        {roster.map(u => (
          <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: u.hp > 0 ? '#F5F5F7' : 'rgba(255,255,255,0.3)' }}>
            <span style={{ fontSize: 16 }}>{UNIT_DEF[u.type].emoji}</span>
            <span style={{ flex: 1 }}>{u.name}</span>
            <span>Lv.{u.level}</span>
            <span style={{ color: u.hp > 0 ? '#34D399' : '#FB7185' }}>HP {u.hp}/{u.maxHp}</span>
            <span style={{ color: '#FBBF24', width: 40, textAlign: 'right' }}>{u.attack}ATK</span>
          </div>
        ))}
      </div>
      {unlockedTypes.length < 4 && (
        <div style={{ ...glassStyle(), display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', width: '100%' }}>Recruit ({unlockedTypes.join(', ')})</span>
          {(['infantry','cavalry','archer','siege'] as UnitType[]).map(t =>
            unlockedTypes.includes(t) ? <button key={t} onClick={() => addToRoster(t)} style={btnGhost()}>{UNIT_DEF[t].emoji} {UNIT_DEF[t].name}</button> : null
          )}
        </div>
      )}
      <div style={{ fontSize: 14, fontWeight: 600, color: '#A78BFA', marginBottom: 4, fontFamily: 'monospace' }}>Missions</div>
      {MISSIONS.map(m => {
        const done = campaignProgress > m.id;
        const current = campaignProgress === m.id;
        return (
          <button key={m.id} onClick={() => startMission(m.id)} disabled={!current} style={{
            ...glassStyle(), cursor: current ? 'pointer' : 'default', opacity: done ? 0.4 : current ? 1 : 0.25,
            border: current ? '1px solid rgba(167,139,250,0.4)' : undefined, textAlign: 'left',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: done ? '#34D399' : current ? '#F5F5F7' : '#444' }}>#{m.id} {m.name}</span>
              <span style={{ fontSize: 11, color: '#FBBF24' }}>♥{m.rewardLove}</span>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{m.description}</div>
          </button>
        );
      })}
    </div>
  );

  const renderBattle = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
      <div style={{ ...glassStyle(), width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: 'monospace' }}>
        <span style={{ color: turn === 'player' ? '#00F0FF' : '#FB7185' }}>{turn === 'player' ? 'Your turn' : 'Enemy turn'}</span>
        <span style={{ color: '#34D399' }}>♥ {totalLove + state.loveEarned}</span>
        {turn === 'player' && allUnits.some(u => u.side === 'player' && u.hp > 0 && (u.hasMoved || u.hasAttacked)) && (
          <button onClick={endPlayerTurn} style={{ ...btnGhost(), padding: '2px 10px', fontSize: 11 }}>End Turn</button>
        )}
      </div>
      <canvas ref={canvasRef} onClick={onCanvasClick} style={{ width: 400, height: 450, borderRadius: 12, border: '1px solid rgba(167,139,250,0.15)', boxShadow: '0 0 20px rgba(167,139,250,0.06)', cursor: turn === 'player' ? 'pointer' : 'default' }} />
      {message ? <div style={{ padding: '6px 14px', borderRadius: 6, background: 'rgba(167,139,250,0.1)', color: '#A78BFA', fontSize: 12, fontFamily: 'monospace', textAlign: 'center' }}>{message}</div> : null}
      <button onClick={() => { setScreen('camp'); setAllUnits([]); }} style={btnGhost()}>Retreat to Camp</button>
    </div>
  );

  const renderVictory = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#FBBF24', fontFamily: 'monospace' }}>Victory!</div>
      {campaignProgress > 12 ? (
        <>
          <p style={{ color: '#F5F5F7', fontSize: 14 }}>Campaign Complete! You conquered all 12 missions.</p>
          <p style={{ color: '#FBBF24', fontSize: 18 }}>Total: {totalLove} LOVE</p>
          <button onClick={() => { actions.complete(); }} style={btnStyle(false, '#FBBF24')}>Claim Rewards</button>
        </>
      ) : (
        <>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Mission {campaignProgress - 1} complete!</p>
          <button onClick={() => { setRoster(roster.map(u => ({ ...u, hp: u.maxHp, hasMoved: false, hasAttacked: false }))); setScreen('camp'); }} style={btnStyle(false, '#A78BFA')}>Continue Campaign</button>
        </>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px', maxWidth: 440, margin: '0 auto', fontFamily: 'monospace' }}>
      {screen === 'title' && renderTitle()}
      {screen === 'camp' && renderCamp()}
      {screen === 'battle' && renderBattle()}
      {screen === 'victory' && renderVictory()}
    </div>
  );
}
