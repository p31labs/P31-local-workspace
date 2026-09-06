import { create } from 'zustand';

export type SceneKind = 'tetra' | 'posner' | 'cradle';

interface SpoonState {
  spoons: number;
  setSpoons: (level: number) => void;
  cycleSpoons: () => void;
}

const SPOON_KEY = 'p31:spoons';

function readInitial(): number {
  const raw = localStorage.getItem(SPOON_KEY);
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 && n <= 5 ? n : 3;
}

function apply(level: number) {
  document.documentElement.setAttribute('data-spoons', String(level));
  const themeMap: Record<number, string> = { 0: 'crisis', 1: 'sanctuary', 2: 'sanctuary', 3: 'bridge', 4: 'quantum', 5: 'quantum' };
  document.documentElement.setAttribute('data-theme', themeMap[level] || 'quantum');
  localStorage.setItem(SPOON_KEY, String(level));
}

export const useSpoonStore = create<SpoonState>((set, get) => ({
  spoons: readInitial(),
  setSpoons: (level) => {
    const clamped = Math.max(0, Math.min(5, Math.round(level)));
    apply(clamped);
    set({ spoons: clamped });
  },
  cycleSpoons: () => {
    const next = (get().spoons + 1) % 6;
    get().setSpoons(next);
  },
}));
