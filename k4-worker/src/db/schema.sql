-- K₄ Cage Worker schema (SQLite / D1 compatible).
-- Applied with: wrangler d1 execute k4-cage-db --remote --file=src/db/schema.sql

CREATE TABLE IF NOT EXISTS system_nodes (
  node_id TEXT PRIMARY KEY,
  did TEXT UNIQUE NOT NULL,
  node_type TEXT NOT NULL CHECK(node_type IN ('PARENT_A','PARENT_B','CHILD','SYSTEM_CORE')),
  display_name TEXT,
  quantum_pubkey_mldsa TEXT,
  classical_pubkey_ed25519 TEXT,
  api_key TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS relational_edges (
  edge_id TEXT PRIMARY KEY,
  source_node_id TEXT NOT NULL,
  target_node_id TEXT NOT NULL,
  edge_type TEXT NOT NULL,
  impedance_score REAL NOT NULL DEFAULT 0.5,
  threshold_current REAL NOT NULL DEFAULT 0.65,
  threshold_base REAL NOT NULL DEFAULT 0.65,
  last_interaction_at TEXT,
  interaction_count INTEGER NOT NULL DEFAULT 0,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY (source_node_id) REFERENCES system_nodes(node_id),
  FOREIGN KEY (target_node_id) REFERENCES system_nodes(node_id)
);

CREATE TABLE IF NOT EXISTS structural_packets (
  packet_id TEXT PRIMARY KEY,
  edge_id TEXT NOT NULL,
  sender_did TEXT NOT NULL,
  category TEXT NOT NULL,
  action TEXT NOT NULL,
  object_id TEXT NOT NULL,
  payload_plaintext_hash TEXT,
  nsp_mode INTEGER NOT NULL DEFAULT 0,
  tone_score REAL NOT NULL DEFAULT 0,
  impedance_contribution REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (edge_id) REFERENCES relational_edges(edge_id)
);

CREATE TABLE IF NOT EXISTS bonding_events (
  event_id TEXT PRIMARY KEY,
  room_code TEXT NOT NULL,
  child_did TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_json TEXT,
  server_hash TEXT,
  server_verified INTEGER NOT NULL DEFAULT 0,
  cf_ray TEXT,
  cf_tls_version TEXT,
  cf_country TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS did_nonces (
  nonce TEXT PRIMARY KEY,
  did TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nodes_did ON system_nodes(did);
CREATE INDEX IF NOT EXISTS idx_edges_source ON relational_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_edges_target ON relational_edges(target_node_id);
CREATE INDEX IF NOT EXISTS idx_packets_edge ON structural_packets(edge_id);
CREATE INDEX IF NOT EXISTS idx_packets_status ON structural_packets(status);
CREATE INDEX IF NOT EXISTS idx_events_room ON bonding_events(room_code);
CREATE INDEX IF NOT EXISTS idx_nonces_did ON did_nonces(did);
