import { useCallback, useEffect, useRef, useState } from 'react';
import { useSpoonStore, getSpoonStore, type SpoonState } from './spoonStore.ts';
import { emit, on } from './eventBus.ts';
import { useGameSave, type GameSaveState } from './useGameSave.ts';

export type GameStatus = 'idle' | 'running' | 'paused' | 'complete' | 'failed';

export interface GameEngineState {
  status: GameStatus;
  score: number;
  highScore: number;
  spoons: number;
  isLowSpoon: boolean;
}

export interface GameEngineOptions {
  slug: string;
  title: string;
  initialSpoons?: number;
  autoSave?: boolean;
}

export interface GameEngine {
  state: GameEngineState;
  start: () => void;
  pause: () => void;
  resume: () => void;
  complete: () => Promise<void>;
  reset: () => void;
  addScore: (delta: number) => void;
  setStatus: (status: GameStatus) => void;
}

export function useGameEngine(options: GameEngineOptions): GameEngine {
  const { slug, title, initialSpoons = 4, autoSave = true } = options;
  const { state: spoonState, setLevel, consumeSpoons, recoverSpoons } = useSpoonStore();
  const { getSaveState, saveScore, saveSession } = useGameSave(slug, title);

  const [engineState, setEngineState] = useState<GameEngineState>(() => ({
    status: 'idle',
    score: 0,
    highScore: getSaveState()?.highScore ?? 0,
    spoons: initialSpoons,
    isLowSpoon: false,
  }));

  const statusRef = useRef(engineState.status);
  const scoreRef = useRef(engineState.score);

  useEffect(() => {
    statusRef.current = engineState.status;
    scoreRef.current = engineState.score;
  }, [engineState.status, engineState.score]);

  useEffect(() => {
    if (engineState.spoons <= 2 && engineState.status === 'running') {
      setEngineState(s => ({ ...s, isLowSpoon: true }));
      emit('p31:spoon:requested', { reason: 'low_spoons', game: slug });
    } else {
      setEngineState(s => ({ ...s, isLowSpoon: false }));
    }
  }, [engineState.spoons, engineState.status, slug]);

  useEffect(() => {
    if (engineState.status === 'complete' && autoSave) {
      const currentSave = getSaveState();
      if (engineState.score > currentSave?.highScore) {
        saveScore(engineState.score);
      }
    }
  }, [engineState.status, engineState.score, autoSave, getSaveState, saveScore]);

  const start = useCallback(() => {
    setEngineState(s => ({ ...s, status: 'running' }));
    if (typeof window !== 'undefined') {
      emit('game:started', { game: slug, spoons: engineState.spoons });
    }
  }, [slug, engineState.spoons]);

  const pause = useCallback(() => {
    setEngineState(s => ({ ...s, status: 'paused' }));
    saveSession('paused', engineState.score);
  }, [saveSession, engineState.score]);

  const resume = useCallback(() => {
    setEngineState(s => ({ ...s, status: 'running' }));
  }, []);

  const complete = useCallback(async () => {
    setEngineState(s => ({ ...s, status: 'complete' }));
    emit('game:completed', { game: slug, score: engineState.score, spoons: engineState.spoons });
    const sessionId = await saveSession('complete', engineState.score);
    if (engineState.score > engineState.highScore) {
      setEngineState(s => ({ ...s, highScore: engineState.score }));
    }
    return sessionId;
  }, [slug, engineState.score, engineState.spoons, engineState.highScore, saveSession]);

  const reset = useCallback(() => {
    setEngineState({
      status: 'idle',
      score: 0,
      highScore: getSaveState()?.highScore ?? 0,
      spoons: initialSpoons,
      isLowSpoon: false,
    });
  }, [initialSpoons, getSaveState]);

  const addScore = useCallback((delta: number) => {
    setEngineState(s => {
      const newScore = s.score + delta;
      return { ...s, score: newScore };
    });
  }, []);

  const setStatus = useCallback((status: GameStatus) => {
    setEngineState(s => ({ ...s, status }));
  }, []);

  return {
    state: engineState,
    start,
    pause,
    resume,
    complete,
    reset,
    addScore,
    setStatus,
  };
}
