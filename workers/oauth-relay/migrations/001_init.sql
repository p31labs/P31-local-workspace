-- P31 OAuth Relay — D1 schema
-- Apply with: wrangler d1 execute p31-oauth --remote --file=migrations/001_init.sql

CREATE TABLE IF NOT EXISTS oauth_sessions (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  code_verifier TEXT NOT NULL,
  state TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS oauth_tokens (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at INTEGER NOT NULL,
  did_key TEXT NOT NULL,
  per_user_salt TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_oauth_sessions_provider ON oauth_sessions (provider, expires_at);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_provider_user ON oauth_tokens (provider, provider_user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_did ON oauth_tokens (did_key);
