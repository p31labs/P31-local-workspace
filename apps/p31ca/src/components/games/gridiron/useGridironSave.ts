import { useCallback, useEffect, useRef, useState } from 'react';
import { SeasonRecord } from '../../../engine/gridiron/types.ts';

const SAVE_KEY = 'p31-gridiron-save';

export interface GridironSave {
  teamName: string;
  seasonRecord: SeasonRecord;
  gamesPlayed: number;
  version: number;
}

export interface GridironSaveAPI {
  save: GridironSave | null;
  loading: boolean;
  persist: (data: Omit<GridironSave, 'version'>) => void;
  clear: () => void;
}

export function useGridironSave(): GridironSaveAPI {
  const [save, setSave] = useState<GridironSave | null>(null);
  const [loading, setLoading] = useState(true);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as GridironSave;
        if (parsed.version === 1 && parsed.teamName) {
          setSave(parsed);
        }
      }
    } catch {
      // corrupt save — ignore
    }
    setLoading(false);
    loaded.current = true;
  }, []);

  const persist = useCallback((data: Omit<GridironSave, 'version'>) => {
    const payload: GridironSave = { ...data, version: 1 };
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
