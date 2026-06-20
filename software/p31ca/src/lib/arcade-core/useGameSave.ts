import { useEffect, useState, useCallback, useRef } from 'react';
import { getPGlite, getOrCreatePlayer } from './client';
import { GET_HIGH_SCORES, SAVE_HIGH_SCORE, SAVE_SESSION } from './schema';
import { useSpoonStore } from '../spoonStore';

export function useGameSave(gameSlug: string, playerId = 'default') {
  const [highScore, setHighScore] = useState(0);
  const [recentScores, setRecentScores] = useState<Array<{ score: number; date: string }>>([]);
  const [loading, setLoading] = useState(true);
  const { state: spoonState } = useSpoonStore();

  const loadScores = useCallback(async () => {
    try {
      const db = await getPGlite();
      await getOrCreatePlayer(db, playerId);
      const result = await db.query(GET_HIGH_SCORES, [gameSlug]);
      const rows = result.rows as Array<{ score: number; created_at: string }>;
      setRecentScores(rows.map(r => ({ score: r.score, date: r.created_at })));
      if (rows.length > 0) setHighScore(rows[0].score);
    } catch {
      try {
        const local = localStorage.getItem(`p31-${gameSlug}-high`);
        if (local) setHighScore(parseInt(local, 10));
      } catch {}
    } finally {
      setLoading(false);
    }
  }, [gameSlug, playerId]);

  const saveScore = useCallback(
    async (score: number, duration = 0): Promise<boolean> => {
      try {
        const db = await getPGlite();
        await getOrCreatePlayer(db, playerId);
        const sessionId = crypto.randomUUID();
        await db.query(SAVE_SESSION, [
          sessionId,
          playerId,
          gameSlug,
          score,
          spoonState.level,
          duration,
        ]);

        if (score > highScore) {
          await db.query(SAVE_HIGH_SCORE, [
            crypto.randomUUID(),
            gameSlug,
            playerId,
            score,
          ]);
          setHighScore(score);
          localStorage.setItem(`p31-${gameSlug}-high`, String(score));
        }
        await loadScores();
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
    [gameSlug, highScore, playerId, spoonState.level, loadScores]
  );

  useEffect(() => {
    loadScores();
  }, [loadScores]);

  return { highScore, recentScores, loading, saveScore };
}
