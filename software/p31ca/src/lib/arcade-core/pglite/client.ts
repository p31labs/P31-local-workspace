import { PGlite } from '@electric-sql/pglite';
import { SCHEMA, GAME_INSERT } from './schema';
import { ARCADE_GAMES, type ArcadeGame } from '../theme';

let instance: PGlite | null = null;
let initPromise: Promise<PGlite> | null = null;

export async function getPGlite(): Promise<PGlite> {
  if (instance) return instance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const db = new PGlite();
    await db.exec(SCHEMA);

    for (const game of ARCADE_GAMES) {
      if (game.id === 'hub') continue;
      try {
        await db.query(GAME_INSERT, [
          game.id,
          game.title,
          game.id,
          game.spoonDifficulty || 3,
        ]);
      } catch {
        // duplicate slug — silently skip
      }
    }

    instance = db;
    return db;
  })();

  return initPromise;
}

export async function getOrCreatePlayer(db: PGlite, playerId: string, name = 'default'): Promise<string> {
  const existing = await db.query<{ id: string }>(`SELECT id FROM arcade_players WHERE id = $1`, [playerId]);
  if (existing.rows.length > 0) return existing.rows[0].id;
  await db.query(`INSERT INTO arcade_players (id, name) VALUES ($1, $2)`, [playerId, name]);
  return playerId;
}
