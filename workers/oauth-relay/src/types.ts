export interface Env {
  DB: D1Database;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  SHELL_ORIGIN: string;
}

export interface OAuthSession {
  id: string;
  provider: string;
  code_verifier: string;
  state: string;
  redirect_uri: string;
  created_at: number;
  expires_at: number;
}

export interface OAuthToken {
  id: string;
  provider: string;
  provider_user_id: string;
  access_token: string;
  refresh_token: string | null;
  refresh_token_used: number;
  expires_at: number;
  did_key: string;
  per_user_salt: string;
  dpop_jkt: string | null;
  created_at: number;
}

export interface ProviderConfig {
  authUrl: string;
  tokenUrl: string;
  userinfoUrl: string;
  scopes: string[];
  getClientId: (env: Env) => string;
  getClientSecret: (env: Env) => string;
}

export type Provider = 'google' | 'github';

export interface PARRequest {
  client_id: string;
  redirect_uri: string;
  provider: string;
  state: string;
  code_challenge: string;
  code_challenge_method?: string;
}

export interface PARResponse {
  request_uri: string;
  expires_in: number;
}
