import { useEffect, useState } from 'react';

export interface SpoonState {
  level: number;
  maxLevel: number;
  jitterFactor: number;
  recoveryMinutes: number;
  source: 'manual' | 'phos' | 'default';
}

export interface SpoonStore {
  state: SpoonState;
  listeners: Set<(state: SpoonState) => void>;
  subscribe(listener: (state: SpoonState) => void): () => void;
  setLevel(level: number, source?: SpoonState['source']): void;
  reset(): void;
}

export function createSpoonStore(initialLevel = 4, initialMax = 12): SpoonStore {
  const listeners = new Set<(state: SpoonState) => void>();

  const jitterFactor = (spoons: number, maxSpoons: number): number => {
    if (spoons <= 0) return 0;
    if (spoons >= maxSpoons) return 1;
    return Math.min(1, Math.max(0, (spoons - 4) / (maxSpoons - 4)));
  };

  const state: SpoonState = {
    level: initialLevel,
    maxLevel: initialMax,
    jitterFactor: jitterFactor(initialLevel, initialMax),
    recoveryMinutes: Math.round((initialMax - initialLevel) * 4),
    source: 'default',
  };

  return {
    state,
    listeners,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setLevel(level, source = 'manual') {
      state.level = Math.max(0, Math.min(state.maxLevel, level));
      state.jitterFactor = jitterFactor(state.level, state.maxLevel);
      state.recoveryMinutes = Math.round((state.maxLevel - state.level) * 4);
      state.source = source;
      listeners.forEach(fn => fn({ ...state }));
    },
    reset() {
      this.setLevel(7, 'default');
    },
  };
}

let globalStore: SpoonStore | null = null;

export function getSpoonStore(): SpoonStore {
  if (!globalStore) {
    globalStore = createSpoonStore();
  }
  return globalStore;
}

export function useSpoonStore(store = getSpoonStore()) {
  const [state, setState] = useState(store.state);

  useEffect(() => {
    const unsubscribe = store.subscribe(setState);
    return unsubscribe;
  }, [store]);

  return {
    state,
    setLevel: (level: number, source?: SpoonState['source']) => store.setLevel(level, source),
    reset: () => store.reset(),
  };
}
