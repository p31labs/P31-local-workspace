/**
 * PGLite database singleton for Spaceship Earth.
 * Uses IndexedDB persistence via `dataDir: 'idb://...'`.
 * P0: Without dataDir, data is lost on page refresh (in-memory default).
 */

import { PGlite } from '@electric-sql/pglite';

const DB_NAME = 'idb://spaceship-earth';

let _instance: PGlite | null = null;

export async function getDB(): Promise<PGlite> {
  if (_instance) return _instance;

  _instance = new PGlite(DB_NAME);
  await _instance.ready;
  return _instance;
}

export function getDBSync(): PGlite | null {
  return _instance;
}

export async function closeDB(): Promise<void> {
  if (!_instance) return;
  await _instance.close();
  _instance = null;
}

export async function runMigrations(db: PGlite): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS ledger (
      id TEXT PRIMARY KEY,
      actor_did TEXT NOT NULL,
      entry_type TEXT NOT NULL,
      payload TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS rules (
      id TEXT PRIMARY KEY,
      tier TEXT NOT NULL DEFAULT 'global',
      rule_text TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS zones (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      energy TEXT NOT NULL DEFAULT 'balanced',
      parent_id TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);
}
