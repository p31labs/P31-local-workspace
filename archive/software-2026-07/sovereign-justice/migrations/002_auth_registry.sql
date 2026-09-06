CREATE TABLE IF NOT EXISTS auth_registry (
  did TEXT PRIMARY KEY,
  public_key_hex TEXT NOT NULL,
  label TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_auth_registry_active ON auth_registry(active);

-- Seed test key from validation run
INSERT OR IGNORE INTO auth_registry (did, public_key_hex, label)
VALUES ('did:test:alice', '0x3ac75c3f7e0c53e336821832d847e7e897fb92ebdf911940199c42bfeea07ce3', 'test key for CWP-077 validation');
