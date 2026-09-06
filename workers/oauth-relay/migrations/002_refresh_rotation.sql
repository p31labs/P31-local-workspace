ALTER TABLE oauth_tokens ADD COLUMN refresh_token_used INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_refresh ON oauth_tokens (provider, provider_user_id, refresh_token_used);
