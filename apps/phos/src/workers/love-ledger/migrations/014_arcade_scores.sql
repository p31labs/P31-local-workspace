-- CWP-2026-053: Arcade score persistence + credit minting
CREATE TABLE IF NOT EXISTS arcade_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  did TEXT NOT NULL,
  game_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  credits_earned INTEGER DEFAULT 0,
  verified INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_arcade_scores_did ON arcade_scores(did);
CREATE INDEX IF NOT EXISTS idx_arcade_scores_game ON arcade_scores(game_id);
CREATE INDEX IF NOT EXISTS idx_arcade_scores_created ON arcade_scores(created_at);
CREATE INDEX IF NOT EXISTS idx_arcade_scores_game_score ON arcade_scores(game_id, score DESC);
