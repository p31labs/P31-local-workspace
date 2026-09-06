import { create } from 'zustand';

export type Spoons = 0 | 1 | 2 | 3 | 4 | 5;

interface SpoonState {
  spoons: Spoons;
  setSpoons: (s: Spoons) => void;
}

const KEY = 'p31:spoons';

function readSp(): Spoons {
  const raw = localStorage.getItem(KEY);
  if (!raw) return 3;
  const n = parseInt(raw, 10);
  if (n === 0) return 3;
  return (n >= 1 && n <= 5 ? n : 3) as Spoons;
}

export const useSpoonStore = create<SpoonState>((set) => ({
  spoons: readSp(),
  setSpoons: (s) => {
    localStorage.setItem(KEY, String(s));
    const themeMap: Record<number, string> = { 0:'crisis', 1:'sanctuary', 2:'sanctuary', 3:'bridge', 4:'quantum', 5:'quantum' };
    document.documentElement.setAttribute('data-spoons', String(s));
    document.documentElement.setAttribute('data-theme', themeMap[s] || 'bridge');
    set({ spoons: s });
    import('../lib/telemetry').then((m) => m.trackEvent('spoons', 'set', String(s)));
  },
}));
