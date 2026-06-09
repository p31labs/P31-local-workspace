-- P31 LABS: D1 RELATIONAL SCHEMA
-- Target: 100,000 writes/day free tier via db.batch()
-- Execute via: npx wrangler d1 execute p31-state-db --file=schema.sql

DROP TABLE IF EXISTS genesis_telemetry;
DROP TABLE IF EXISTS bonding_rooms;
DROP TABLE IF EXISTS bonding_players;

-- WCD-46: Genesis Block Telemetry (Daubert-Standard Immutable Ledger)
CREATE TABLE genesis_telemetry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload TEXT NOT NULL,
    cf_ray TEXT,
    tls_version TEXT,
    hash_chain TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_telemetry_player ON genesis_telemetry(player_id);
CREATE INDEX idx_telemetry_session ON genesis_telemetry(session_id);

-- WCD-51: Multiplayer State Synchronization (Replacing KV)
CREATE TABLE bonding_rooms (
    room_id TEXT PRIMARY KEY,
    state_json TEXT NOT NULL,
    molecule_id TEXT,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bonding_players (
    player_id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    state_json TEXT NOT NULL,
    last_ping DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(room_id) REFERENCES bonding_rooms(room_id) ON DELETE CASCADE
);

CREATE INDEX idx_players_room ON bonding_players(room_id);