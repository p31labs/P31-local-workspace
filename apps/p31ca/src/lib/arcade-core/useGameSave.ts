import { useEffect, useState, useCallback, useRef } from 'react';
import { getPGlite, getOrCreatePlayer } from './pglite/client';
import { GET_HIGH_SCORES, SAVE_HIGH_SCORE, SAVE_SESSION } from './pglite/schema';
import { useSpoonStore } from './spoonStore';

export interface SaveState {
  highScore: number;
  recentScores: Array<{ score: number; date: string }>;
}

let cachedState: SaveState | null = null;

export function getSaveState(): SaveState {
  return cachedState ?? { highScore: 0, recentScores: [] };
}

export function useGameSave(gameSlug: string, playerId = 'default') {
  const [highScore, setHighScore] = useState(0);
  const [recentScores, setRecentScores] = useState<Array<{ score: number; date: string }>>([]);
  const [loading, setLoading] = useState(true);
  const { state: spoonState } = useSpoonStore();
  const loadedRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const db = await getPGlite();
      await getOrCreatePlayer(db, playerId);
      const result = await db.query(GET_HIGH_SCORES, [gameSlug]);
      const rows = result.rows as Array<{ score: number; created_at: string }>;
      const scores = rows.map(r => ({ score: r.score, date: r.created_at }));
      setRecentScores(scores);
      if (rows.length > 0) setHighScore(rows[0].score);
      cachedState = { highScore: rows[0]?.score ?? 0, recentScores: scores };
    } catch {
      try {
        const local = parseInt(localStorage.getItem(`p31-${gameSlug}-high`) || '0', 10);
        setHighScore(local);
        cachedState = { highScore: local, recentScores: [] };
      } catch {}
    } finally {
      setLoading(false);
      loadedRef.current = true;
    }
  }, [gameSlug, playerId]);

  const saveScore = useCallback(
    async (score: number, duration = 0): Promise<boolean> => {
      try {
        const db = await getPGlite();
        await getOrCreatePlayer(db, playerId);
        const sessionId = crypto.randomUUID();
        await db.query(SAVE_SESSION, [sessionId, playerId, gameSlug, score, spoonState.level, duration]);

        if (score > (cachedState?.highScore ?? 0)) {
          await db.query(SAVE_HIGH_SCORE, [crypto.randomUUID(), gameSlug, playerId, score]);
          localStorage.setItem(`p31-${gameSlug}-high`, String(score));
        }
        await refresh();
        return true;
      } catch {
        const current = parseInt(localStorage.getItem(`p31-${gameSlug}-high`) || '0', 10);
        if (score > current) {
          localStorage.setItem(`p31-${gameSlug}-high`, String(score));
          setHighScore(score);
        }
        return false;
      }
    },
    [gameSlug, playerId, spoonState.level, refresh]
  );

  useEffect(() => {
    if (!loadedRef.current) refresh();
  }, [refresh]);

  return { highScore, recentScores, loading, saveScore, refresh };
}
