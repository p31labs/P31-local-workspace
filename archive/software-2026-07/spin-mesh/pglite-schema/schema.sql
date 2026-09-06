-- SpIn Mesh — PGLite schema
-- SQLite dialect; loaded by local node via @electric-sql/pglite

-- Resources table: stores the canonical JSON‑LD document
CREATE TABLE IF NOT EXISTS resources (
    id TEXT PRIMARY KEY,               -- urn:uuid:...
    doc JSONB NOT NULL,                -- full SpInResource JSON‑LD
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Joy attestations: encrypted blobs attached to a resource release
CREATE TABLE IF NOT EXISTS attestations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    nonce BYTEA NOT NULL,              -- 12‑byte GCM nonce
    blob BYTEA NOT NULL,               -- AES‑GCM ciphertext
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Intents: what a user wants in exchange
CREATE TABLE IF NOT EXISTS intents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,             -- DID or local UUID
    resource_id TEXT NOT NULL,         -- item I own
    desired_resource_id TEXT NOT NULL, -- item I want
    expires_at TIMESTAMP,              -- optional TTL
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, resource_id)       -- one intent per owned item
);

-- Cycle locks: TTC cycles locked by matchmaking DO
CREATE TABLE IF NOT EXISTS cycle_locks (
    cycle_id TEXT PRIMARY KEY,         -- SHA‑256 of sorted participant list
    participants JSONB NOT NULL,       -- array of user_ids
    resource_ids JSONB NOT NULL,       -- locked resource IDs (same order)
    locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'locked' CHECK(status IN ('locked','completed','canceled'))
);

-- Handovers: physical meet coordination
CREATE TABLE IF NOT EXISTS handovers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cycle_id TEXT NOT NULL UNIQUE REFERENCES cycle_locks(cycle_id),
    midpoint_lat REAL NOT NULL,
    midpoint_lon REAL NOT NULL,
    geohash5 CHAR(5) NOT NULL,        -- 5‑char precision (~5 km)
    venues JSONB,                      -- suggested public locations
    x3dh_secret BLOB,                 -- shared group secret (ephemeral)
    completed_at TIMESTAMP,
    destroyed_at TIMESTAMP             -- set after handover_complete
);

-- L.O.V.E. soulbound tokens (EigenTrust weight increase)
CREATE TABLE IF NOT EXISTS love_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    giver_user_id TEXT NOT NULL,
    receiver_user_id TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    minted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(giver_user_id, resource_id) -- one token per item given
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_intents_user ON intents(user_id);
CREATE INDEX IF NOT EXISTS idx_intents_desired ON intents(desired_resource_id);
CREATE INDEX IF NOT EXISTS idx_attestations_resource ON attestations(resource_id);
