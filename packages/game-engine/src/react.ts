import { useRef, useEffect, useCallback } from 'react';
import {
  createJitterbug, tickJitterbug, setJitterbugTarget,
  spoonMorphSpeed, gatedPrimitives, gatedGameConfig, spoonXpMultiplier,
  type JitterbugState, type GatedGameConfig,
} from './index.js';

export type GameType = 'bashball' | 'gridiron' | 'geodesic' | 'strategy' | 'cards' | 'liquid' | 'jitterbug';

export interface UseGameEngineOptions {
  type: GameType;
  spoons: number;
  onComplete?: (data: { score: number; loveEarned: number }) => void;
  onMilestone?: (data: { name: string; love: number }) => void;
}

export interface GameState {
  phase: 'loading' | 'playing' | 'paused' | 'complete';
  score: number;
  loveEarned: number;
  level: number;
  timeRemaining: number | null;
  jitterbug: JitterbugState;
  gated: GatedGameConfig;
}

export interface GameActions {
  addScore: (points: number) => void;
  addLove: (amount: number) => void;
  setPhase: (phase: GameState['phase']) => void;
  nextLevel: () => void;
  setTimeRemaining: (ms: number | null) => void;
  updateJitterbug: () => void;
  complete: () => void;
}

export function useGameEngine({ spoons, onComplete, onMilestone }: UseGameEngineOptions): { state: GameState; actions: GameActions } {
  const stateRef = useRef<GameState>({
    phase: 'playing',
    score: 0,
    loveEarned: 0,
    level: 1,
    timeRemaining: null,
    jitterbug: createJitterbug({ spoons, phase: 0 }),
    gated: gatedGameConfig(spoons, 'seedling'),
  });

  const callbacksRef = useRef({ onComplete, onMilestone });
  callbacksRef.current = { onComplete, onMilestone };

  useEffect(() => {
    stateRef.current = {
      ...stateRef.current,
      jitterbug: createJitterbug({ spoons, phase: stateRef.current.jitterbug.phase }),
      gated: gatedGameConfig(spoons, 'seedling'),
    };
  }, [spoons]);

  const actions: GameActions = {
    addScore: (points) => {
      const xpMul = spoonXpMultiplier(spoons);
      stateRef.current.score += Math.round(points * xpMul);
    },
    addLove: (amount) => {
      stateRef.current.loveEarned += amount;
      callbacksRef.current.onMilestone?.({ name: 'love_milestone', love: amount });
    },
    setPhase: (phase) => { stateRef.current.phase = phase; },
    nextLevel: () => { stateRef.current.level += 1; },
    setTimeRemaining: (ms) => { stateRef.current.timeRemaining = ms; },
    updateJitterbug: () => {
      const j = stateRef.current?.jitterbug;
      if (!j || typeof j.phase !== 'number' || isNaN(j.phase)) return;
      if (Math.abs(j.targetPhase - j.phase) < 0.005) {
        stateRef.current.jitterbug = setJitterbugTarget(j, Math.abs(j.targetPhase) < 0.01 ? 1.0 : 0.0, spoons);
      }
      stateRef.current.jitterbug = tickJitterbug(stateRef.current.jitterbug, 0.016);
    },
    complete: () => {
      stateRef.current.phase = 'complete';
      callbacksRef.current.onComplete?.({
        score: stateRef.current.score,
        loveEarned: stateRef.current.loveEarned,
      });
    },
  };

  return { state: stateRef.current, actions };
}

export { createJitterbug, jitterbugVertices, jitterbugEdges, spoonMorphSpeed, gatedPrimitives, gatedGameConfig, spoonXpMultiplier };
export type { JitterbugState, GatedGameConfig };
