import { useCallback, useEffect, useRef, useState } from 'react';
import { TeamState, LeagueStandings, LeagueTier } from '../../../engine/bashball/types.ts';

const SAVE_KEY = 'p31-bashball-save';

export interface BashballSave {
  teamState: TeamState;
  leagueStandings: LeagueStandings | null;
  gamesPlayed: number;
  version: number;
}

export interface BashballSaveAPI {
  save: BashballSave | null;
  loading: boolean;
  persist: (data: Omit<BashballSave, 'version'>) => void;
  clear: () => void;
}

export function useBashballSave(): BashballSaveAPI {
  const [save, setSave] = useState<BashballSave | null>(null);
  const [loading, setLoading] = useState(true);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as BashballSave;
        if (parsed.version === 1 && parsed.teamState?.roster?.length) {
          setSave(parsed);
        }
      }
    } catch {
      // corrupt save — ignore
    }
    setLoading(false);
    loaded.current = true;
  }, []);

  const persist = useCallback((data: Omit<BashballSave, 'version'>) => {
    const payload: BashballSave = { ...data, version: 1 };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    } catch {
      // storage full — silently fail
    }
    setSave(payload);
  }, []);

  const clear = useCallback(() => {
    try { localStorage.removeItem(SAVE_KEY); } catch {}
    setSave(null);
  }, []);

  return { save, loading, persist, clear };
}
