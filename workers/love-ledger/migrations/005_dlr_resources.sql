-- DID-Linked Resources (DLR) table
-- W3C CCG: DLR specification — Final Report status
-- Enables publishing Verifiable Credentials as linked resources

CREATE TABLE IF NOT EXISTS dlr_resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  resource_id TEXT NOT NULL UNIQUE,
  did TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'application/vc+ld+json',
  resource_data TEXT NOT NULL,
  integrity_proof TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_dlr_did ON dlr_resources(did);
CREATE INDEX IF NOT EXISTS idx_dlr_resource ON dlr_resources(resource_id);
