-- worlds table for the Game Builder (roblox-bridge / game-builder integration).
-- Safely idempotent: the worker also guards with ensureWorldsTable() at runtime.
CREATE TABLE IF NOT EXISTS worlds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  creator_did TEXT DEFAULT 'anonymous',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_worlds_created ON worlds(created_at DESC);
