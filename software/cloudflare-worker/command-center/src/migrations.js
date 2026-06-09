/**
 * D1 Schema Migration Runner
 * Ensures database schema is up-to-date on deploy
 */

export const MIGRATIONS = [
  {
    version: 1,
    name: 'Create events table',
    sql: `CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts TEXT NOT NULL,
      actor TEXT,
      action TEXT NOT NULL,
      target TEXT,
      diff_uri TEXT,
      req_uri TEXT,
      resp_uri TEXT,
      sig TEXT,
      legal_hold BOOLEAN DEFAULT 0
    );`,
  },
  {
    version: 2,
    name: 'Create indexes for events',
    sql: `CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);
          CREATE INDEX IF NOT EXISTS idx_events_action ON events(action);
          CREATE INDEX IF NOT EXISTS idx_events_target ON events(target);`,
  },
  {
    version: 3,
    name: 'Create budgets table',
    sql: `CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      limit_usd REAL,
      limit_stablecoin REAL,
      spent_usd DEFAULT 0,
      spent_stablecoin REAL DEFAULT 0,
      alert_pct INTEGER DEFAULT 90,
      last_checked TEXT
    );`,
  },
  {
    version: 4,
    name: 'Create fleet_status table',
    sql: `CREATE TABLE IF NOT EXISTS fleet_status (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated TEXT NOT NULL
    );`,
  },
  {
    version: 5,
    name: 'Create forensic_artifacts table',
    sql: `CREATE TABLE IF NOT EXISTS forensic_artifacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER,
      r2_uri TEXT NOT NULL,
      content_type TEXT,
      size_bytes INTEGER,
      hmac_sig TEXT,
      retention_cold TEXT,
      FOREIGN KEY (event_id) REFERENCES events(id)
    );`,
  },
];

export async function runMigrations(db) {
  // Create migrations table if not exists
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      name TEXT,
      applied_at TEXT
    );`
  ).run();

  const applied = await db.prepare('SELECT version FROM _migrations ORDER BY version').all();
  const appliedVersions = applied.results ? applied.results.map(r => r.version) : [];

  for (const migration of MIGRATIONS) {
    if (!appliedVersions.includes(migration.version)) {
      console.log(`[MIGRATION] Applying ${migration.version}: ${migration.name}`);
      await db.batch(
        migration.sql.split(';').filter(s => s.trim()).map(s => db.prepare(s))
      );
      await db.prepare(
        'INSERT INTO _migrations (version, name, applied_at) VALUES (?, ?, ?)'
      ).bind(migration.version, migration.name, new Date().toISOString()).run();
      console.log(`[MIGRATION] Applied ${migration.version}`);
    }
  }
}
