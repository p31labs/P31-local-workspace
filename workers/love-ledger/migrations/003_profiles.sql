-- Profiles table for P31 sovereign identity
-- Applied to shared love-ledger D1 (592e3e2e-3203-4e0a-8342-9e85215ec8a6)
-- Run: wrangler d1 execute love-ledger --file=./migrations/003_profiles.sql

CREATE TABLE IF NOT EXISTS profiles (
  did TEXT PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  preferences TEXT,
  trust_tier TEXT DEFAULT 'basic',
  care_score REAL DEFAULT 0.5,
  sbt_token_id INTEGER,
  updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_profiles_trust_tier ON profiles(trust_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_sbt_token ON profiles(sbt_token_id);
