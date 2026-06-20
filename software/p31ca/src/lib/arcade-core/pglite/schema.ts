export const SCHEMA = `
  CREATE TABLE IF NOT EXISTS arcade_players (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'default',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS arcade_games (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    spoon_difficulty INTEGER DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS arcade_sessions (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL,
    game_id TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    duration INTEGER DEFAULT 0,
    spoons_used INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES arcade_players(id),
    FOREIGN KEY (game_id) REFERENCES arcade_games(id)
  );

  CREATE TABLE IF NOT EXISTS arcade_high_scores (
    id TEXT PRIMARY KEY,
    game_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES arcade_games(id),
    FOREIGN KEY (player_id) REFERENCES arcade_players(id)
  );

  CREATE INDEX IF NOT EXISTS idx_arcade_sessions_game ON arcade_sessions(game_id);
  CREATE INDEX IF NOT EXISTS idx_arcade_high_scores_game ON arcade_high_scores(game_id);
`;

export const GAME_INSERT = `
  INSERT INTO arcade_games (id, title, slug, spoon_difficulty)
  VALUES ($1, $2, $3, $4)
  ON CONFLICT (slug) DO NOTHING
`;

export const GET_HIGH_SCORES = `
  SELECT s.score, s.created_at, p.name
  FROM arcade_high_scores s
  JOIN arcade_players p ON s.player_id = p.id
  WHERE s.game_id = (SELECT id FROM arcade_games WHERE slug = $1)
  ORDER BY s.score DESC
  LIMIT 10
`;

export const SAVE_HIGH_SCORE = `
  INSERT INTO arcade_high_scores (id, game_id, player_id, score)
  VALUES ($1, (SELECT id FROM arcade_games WHERE slug = $2), $3, $4)
`;

export const SAVE_SESSION = `
  INSERT INTO arcade_sessions (id, player_id, game_id, score, spoons_used, duration)
  VALUES ($1, $2, (SELECT id FROM arcade_games WHERE slug = $3), $4, $5, $6)
`;

export const GET_PLAYER = `
  SELECT id FROM arcade_players WHERE id = $1
`;

export const CREATE_PLAYER = `
  INSERT INTO arcade_players (id, name) VALUES ($1, $2)
`;
