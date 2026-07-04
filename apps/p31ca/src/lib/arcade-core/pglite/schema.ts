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

  CREATE TABLE IF NOT EXISTS simulation_teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    game_slug TEXT NOT NULL,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS simulation_players (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL REFERENCES simulation_teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position TEXT,
    power INTEGER DEFAULT 50,
    speed INTEGER DEFAULT 50,
    contact INTEGER DEFAULT 50,
    eye INTEGER DEFAULT 50,
    stamina INTEGER DEFAULT 50,
    strength INTEGER DEFAULT 50,
    agility INTEGER DEFAULT 50,
    throwing INTEGER DEFAULT 50,
    blocking INTEGER DEFAULT 50,
    tackling INTEGER DEFAULT 50,
    coverage INTEGER DEFAULT 50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS team_inventories (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL REFERENCES simulation_teams(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    item_type TEXT NOT NULL,
    stat_boost JSON DEFAULT '{}',
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS simulation_games (
    id TEXT PRIMARY KEY,
    game_slug TEXT NOT NULL,
    home_team_id TEXT NOT NULL REFERENCES simulation_teams(id),
    away_team_id TEXT NOT NULL REFERENCES simulation_teams(id),
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    play_by_play JSON DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS league_records (
    id TEXT PRIMARY KEY,
    game_slug TEXT NOT NULL,
    season TEXT NOT NULL,
    standings JSON NOT NULL DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS card_games (
    id TEXT PRIMARY KEY,
    game_slug TEXT NOT NULL,
    player_id TEXT,
    card_state JSON NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_sim_teams_game ON simulation_teams(game_slug);
  CREATE INDEX IF NOT EXISTS idx_sim_players_team ON simulation_players(team_id);
  CREATE INDEX IF NOT EXISTS idx_sim_games_home ON simulation_games(home_team_id);
  CREATE INDEX IF NOT EXISTS idx_sim_games_away ON simulation_games(away_team_id);
  CREATE INDEX IF NOT EXISTS idx_league_game_slug ON league_records(game_slug);
  CREATE INDEX IF NOT EXISTS idx_card_games_player ON card_games(player_id);
  CREATE INDEX IF NOT EXISTS idx_card_games_slug ON card_games(game_slug);
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

export const INSERT_TEAM = `
  INSERT INTO simulation_teams (id, name, game_slug, wins, losses)
  VALUES ($1, $2, $3, $4, $5)
  ON CONFLICT (id) DO NOTHING
`;

export const GET_TEAM = `
  SELECT * FROM simulation_teams WHERE id = $1
`;

export const GET_TEAMS_BY_GAME = `
  SELECT * FROM simulation_teams WHERE game_slug = $1 ORDER BY wins DESC
`;

export const UPSERT_PLAYER = `
  INSERT INTO simulation_players (id, team_id, name, position, power, speed, contact, eye, stamina, strength, agility, throwing, blocking, tackling, coverage)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
  ON CONFLICT (id) DO UPDATE SET
    team_id = EXCLUDED.team_id,
    name = EXCLUDED.name,
    position = EXCLUDED.position,
    stamina = EXCLUDED.stamina
`;

export const GET_ROSTER = `
  SELECT * FROM simulation_players WHERE team_id = $1 ORDER BY position, name
`;

export const SAVE_GAME_RESULT = `
  INSERT INTO simulation_games (id, game_slug, home_team_id, away_team_id, home_score, away_score, play_by_play)
  VALUES ($1, $2, $3, $4, $5, $6, $7)
`;

export const UPSERT_LEAGUE_RECORD = `
  INSERT INTO league_records (id, game_slug, season, standings)
  VALUES ($1, $2, $3, $4)
  ON CONFLICT (id) DO UPDATE SET standings = EXCLUDED.standings
`;

export const SAVE_CARD_GAME = `
  INSERT INTO card_games (id, game_slug, player_id, card_state)
  VALUES ($1, $2, $3, $4)
  ON CONFLICT (id) DO UPDATE SET
    card_state = EXCLUDED.card_state,
    updated_at = CURRENT_TIMESTAMP
`;

export const GET_CARD_GAME = `
  SELECT * FROM card_games WHERE id = $1
`;

export const GET_ACTIVE_CARD_GAMES = `
  SELECT * FROM card_games WHERE player_id = $1 ORDER BY updated_at DESC LIMIT 5
`;

export const GET_ALL_GAME_TOP_SCORES = `
  SELECT ag.slug, ag.title, hs.score, hs.created_at
  FROM arcade_games ag
  LEFT JOIN arcade_high_scores hs ON hs.game_id = ag.id
  WHERE ag.slug != 'hub'
  ORDER BY ag.title, hs.score DESC
`;
