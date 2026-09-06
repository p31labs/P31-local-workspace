-- Run this once against the shared love-ledger D1 (592e3e2e-...)
-- via: wrangler d1 execute LOVE_DB --file src/schema.sql --remote

CREATE TABLE IF NOT EXISTS marketplace_listings (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  creator_did TEXT NOT NULL,
  content TEXT,
  status TEXT DEFAULT 'active',
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS marketplace_purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id TEXT NOT NULL,
  buyer_did TEXT NOT NULL,
  price REAL,
  purchased_at INTEGER
);

-- worlds table for roblox-bridge
CREATE TABLE IF NOT EXISTS worlds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  creator_did TEXT,
  created_at INTEGER
);
