import { useState, useCallback } from 'react';
import {
  GameState, Unit, Pos, GRID_SIZE,
  createUnit, inRange, tileAt,
} from '../../../engine/strategy-board/types.ts';
import { computeAiMove } from '../../../engine/strategy-board/ai.ts';

const CELL = 56;
const COLORS = {
  p1: '#4db8a8', p2: '#cc6247',
  grass: '#2d3a2e', forest: '#1f4a2a',
  selected: 'rgba(205,168,82,0.4)',
  canMove: 'rgba(77,184,168,0.25)',
  canAttack: 'rgba(204,98,71,0.35)',
};

const UNIT_EMOJI: Record<string, string> = { soldier: '⚔️', tank: '🛡️', archer: '🏹' };

function initState(): GameState {
  const units: Unit[] = [];
  for (let i = 0; i < 3; i++) {
    units.push(createUnit(`p1-s${i}`, 'soldier', { x: i * 2 + 1, y: 7 }, 1));
    units.push(createUnit(`p1-t${i}`, 'tank', { x: i * 2 + 1, y: 6 }, 1));
  }
  for (let i = 0; i < 3; i++) {
    units.push(createUnit(`p2-s${i}`, 'soldier', { x: i * 2 + 1, y: 0 }, 2));
    units.push(createUnit(`p2-t${i}`, 'tank', { x: i * 2 + 1, y: 1 }, 2));
  }
  return {
    grid: Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill('grass')),
    units, turn: 1, selected: null,
    phase: 'move', winner: null,
    movesLeft: 1, message: 'Your turn — select a unit',
  };
}

function unitAt(units: Unit[], pos: Pos, player?: number): Unit | null {
  return units.find(u =>
    u.hp > 0 && u.pos.x === pos.x && u.pos.y === pos.y &&
    (player === undefined || u.player === player)
  ) ?? null;
}

function canMoveTo(pos: Pos, units: Unit[], grid: string[][]): boolean {
  if (pos.x < 0 || pos.x >= GRID_SIZE || pos.y < 0 || pos.y >= GRID_SIZE) return false;
  if (unitAt(units, pos)) return false;
  return true;
}

interface Props {
  onScoreChange?: (delta: number) => void;
  onComplete?: () => void;
}

export function StrategyBoardGame({ onScoreChange, onComplete }: Props) {
  const [state, setState] = useState<GameState>(initState);

  const alive = (p: number) => state.units.filter(u => u.player === p && u.hp > 0);

  const handleCellClick = useCallback((x: number, y: number) => {
    if (state.turn === 2 || state.winner) return;

    const clickedUnit = unitAt(state.units, { x, y });

    if (state.phase === 'move') {
      if (clickedUnit && clickedUnit.player === 1) {
        setState(s => ({ ...s, selected: clickedUnit.id, message: `Selected ${clickedUnit.type}` }));
        return;
      }
      if (state.selected) {
        const sel = state.units.find(u => u.id === state.selected);
        if (sel && canMoveTo({ x, y }, state.units, state.grid) && inRange(sel.pos, { x, y }, sel.mov)) {
          setState(s => ({
            ...s,
            units: s.units.map(u => u.id === sel.id ? { ...u, pos: { x, y } } : u),
            selected: null,
            phase: 'attack',
            message: `Moved ${sel.type} — click an enemy to attack, or end turn`,
          }));
        } else {
          setState(s => ({ ...s, selected: null, message: 'Cannot move there' }));
        }
        return;
      }
      setState(s => ({ ...s, message: 'Click one of your units to select it' }));
    }

    if (state.phase === 'attack') {
      const sel = state.units.find(u => u.id === state.selected);
      if (!sel) return;
      const target = unitAt(state.units, { x, y }, 2);
      if (target && inRange(sel.pos, target.pos, sel.range)) {
        const newHp = target.hp - sel.atk;
        const killed = newHp <= 0;
        setState(s => {
          const units = s.units.map(u => u.id === target.id ? { ...u, hp: Math.max(0, newHp) } : u);
          const playerLeft = alive(1).length;
          const aiLeft = units.filter(u => u.player === 2 && u.hp > 0).length;
          const won = aiLeft === 0;
          const lost = playerLeft === 0;
          return {
            ...s,
            units,
            selected: null,
            phase: 'move',
            turn: won || lost ? s.turn : 2,
            winner: won ? 1 : lost ? 2 : null,
            message: killed
              ? `Enemy ${target.type} destroyed!${won ? ' YOU WIN!' : ''}`
              : `Attacked ${target.type} (${newHp} HP left)`,
          };
        });
        if (killed) {
          const aiRemaining = state.units.filter(u => u.player === 2 && u.id !== target.id && u.hp > 0).length;
          const won = aiRemaining === 0;
          if (won) {
            const score = alive(1).reduce((sum, u) => sum + u.hp * 50, 0);
            onScoreChange?.(score);
            setTimeout(() => onComplete?.(), 1500);
          }
        }
        return;
      }
      setState(s => ({
        ...s, selected: null, phase: 'move',
        message: 'No enemy there — select a unit to move',
      }));
    }
  }, [state, onScoreChange, onComplete]);

  const endTurn = useCallback(() => {
    setState(s => ({ ...s, turn: 2, phase: 'ai', message: 'AI is thinking...' }));
    setTimeout(() => {
      setState(prev => {
        if (prev.winner) return prev;
        let units = [...prev.units];
        let changed = true;
        while (changed) {
          const move = computeAiMove(units, units.filter(u => u.player === 1));
          if (!move) break;
          changed = false;
          if (move.action === 'attack') {
            units = units.map(u =>
              u.pos.x === move.target.x && u.pos.y === move.target.y && u.player === 1
                ? { ...u, hp: u.hp - 1 }
                : u
            );
            changed = true;
          } else if (move.action === 'move') {
            units = units.map(u =>
              u.id === move.unitId ? { ...u, pos: move.target } : u
            );
            changed = true;
          }
        }
        const playerLeft = units.filter(u => u.player === 1 && u.hp > 0).length;
        const lost = playerLeft === 0;
        if (lost) {
          return { ...prev, units, winner: 2, phase: 'done', message: 'AI wins!' };
        }
        return { ...prev, units, turn: 1, phase: 'move', message: 'Your turn — select a unit' };
      });
    }, 600);
  }, []);

  const reset = useCallback(() => {
    setState(initState());
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 16 }}>
      <div style={{
        fontFamily: "'Press Start 2P', cursive", fontSize: 9,
        color: state.turn === 1 ? COLORS.p1 : state.turn === 2 ? COLORS.p2 : '#cda852',
        textAlign: 'center', minHeight: 24,
      }}>
        {state.winner ? (state.winner === 1 ? '🎉 YOU WIN!' : '😞 AI WINS') : state.message}
      </div>

      <div style={{
        position: 'relative', width: GRID_SIZE * CELL, height: GRID_SIZE * CELL,
        border: '2px solid rgba(255,255,255,0.1)', borderRadius: 8, overflow: 'hidden',
      }}>
        <svg width={GRID_SIZE * CELL} height={GRID_SIZE * CELL} style={{ display: 'block' }}>
          {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
            const x = i % GRID_SIZE, y = Math.floor(i / GRID_SIZE);
            const tile = tileAt({ x, y });
            return (
              <rect
                key={i} x={x * CELL} y={y * CELL}
                width={CELL} height={CELL}
                fill={tile === 'grass' ? COLORS.grass : COLORS.forest}
                stroke="rgba(255,255,255,0.04)"
                strokeWidth={0.5}
                onClick={() => handleCellClick(x, y)}
                style={{ cursor: 'pointer' }}
              />
            );
          })}

          {state.units.filter(u => u.hp > 0).map(u => {
            const isSelected = u.id === state.selected;
            return (
              <g key={u.id} onClick={() => handleCellClick(u.pos.x, u.pos.y)} style={{ cursor: 'pointer' }}>
                {u.player === 1 && isSelected && (
                  <rect
                    x={u.pos.x * CELL - 1} y={u.pos.y * CELL - 1}
                    width={CELL + 2} height={CELL + 2}
                    fill="none" stroke={COLORS.selected} strokeWidth={2} rx={4}
                  />
                )}
                {isSelected && (
                  u.hp > 0 && state.phase === 'attack' &&
                  state.units.filter(e => e.player === 2 && e.hp > 0 && inRange(u.pos, e.pos, u.range))
                    .map(e => (
                      <rect
                        key={`range-${e.id}`}
                        x={e.pos.x * CELL} y={e.pos.y * CELL}
                        width={CELL} height={CELL}
                        fill={COLORS.canAttack} rx={4}
                      />
                    ))
                )}
                <circle
                  cx={u.pos.x * CELL + CELL / 2}
                  cy={u.pos.y * CELL + CELL / 2}
                  r={20}
                  fill={u.player === 1 ? COLORS.p1 : COLORS.p2}
                  opacity={0.15}
                />
                <text
                  x={u.pos.x * CELL + CELL / 2}
                  y={u.pos.y * CELL + CELL / 2 + 6}
                  textAnchor="middle" fontSize={22}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {UNIT_EMOJI[u.type]}
                </text>
                <text
                  x={u.pos.x * CELL + CELL / 2}
                  y={u.pos.y * CELL + CELL - 4}
                  textAnchor="middle" fontSize={8}
                  fill={u.hp <= 1 ? '#cc6247' : '#e8e6e3'}
                  fontFamily="'Press Start 2P', cursive"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {'♥'.repeat(u.hp)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        {!state.winner && state.turn === 1 && (
          <button onClick={endTurn} style={btnStyle}>
            End Turn →
          </button>
        )}
        {state.winner && (
          <button onClick={reset} style={{ ...btnStyle, background: '#cda852', color: '#0f1115' }}>
            Play Again
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 24, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
        <span style={{ color: COLORS.p1 }}>You: {alive(1).length}</span>
        <span style={{ color: COLORS.p2 }}>AI: {alive(2).length}</span>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '8px 20px', border: 'none', borderRadius: 6,
  background: 'rgba(255,255,255,0.08)', color: '#e8e6e3',
  fontFamily: "'Press Start 2P', cursive", fontSize: 8,
  cursor: 'pointer',
};
