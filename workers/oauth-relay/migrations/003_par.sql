-- P31 OAuth Relay — PAR (Pushed Authorization Requests, RFC 9126)
-- Apply with: wrangler d1 execute p31-oauth --remote --file=migrations/003_par.sql

CREATE TABLE IF NOT EXISTS par_requests (
  request_uri TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  request_payload TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_par_client ON par_requests (client_id, expires_at);
