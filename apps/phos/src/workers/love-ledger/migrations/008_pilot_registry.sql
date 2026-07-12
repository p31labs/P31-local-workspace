-- Migration 008: Pilot registry and node registry tables.
-- Separates pilot-specific metadata from core love_accounts.

CREATE TABLE IF NOT EXISTS pilot_registry (
  did TEXT PRIMARY KEY,
  family_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',  -- pending | active | completed
  onboarded_at INTEGER,           -- unix timestamp
  active_nodes INTEGER DEFAULT 0,
  mesh_health REAL DEFAULT 0.0,
  metadata TEXT,                  -- JSON blob for extensibility
  FOREIGN KEY (did) REFERENCES love_accounts(did)
);

CREATE TABLE IF NOT EXISTS node_registry (
  node_id TEXT PRIMARY KEY,
  family_did TEXT NOT NULL,
  last_seen INTEGER NOT NULL,
  firmware_version TEXT,
  battery_level INTEGER,
  FOREIGN KEY (family_did) REFERENCES love_accounts(did)
);

CREATE INDEX idx_node_registry_family ON node_registry (family_did);
CREATE INDEX idx_pilot_registry_status ON pilot_registry (status);
