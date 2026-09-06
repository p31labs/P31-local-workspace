/**
 * P31 OAuth Relay — OAuth 2.1 relay worker for the Sovereign Shell.
 *
 * Implements Authorization Code + PKCE (S256 only) for Google and GitHub.
 * Exchanges provider tokens for did:key identity via PBKDF2 + Ed25519 derivation.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';

import type { Env, Provider, OAuthSession, OAuthToken, PARRequest, PARResponse } from './types';
import { googleProvider } from './providers/google';
import { githubProvider } from './providers/github';
import {
  deriveDidKey,
  generateSalt,
  base58Encode,
  generateDPoPProof,
  verifyDPoPProof,
  generateNonce,
} from './crypto';

const SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour for stored tokens
const PAR_TTL_MS = 10 * 60 * 1000; // 10 minutes for pushed authorization requests

function getProvider(name: string) {
  switch (name) {
    case 'google':
      return googleProvider;
    case 'github':
      return githubProvider;
    default:
      return null;
  }
}

function getClientSecret(clientId: string, env: Env): string | null {
  if (clientId === 'shell' || clientId === env.SHELL_ORIGIN) {
    return env.SHELL_ORIGIN;
  }
  if (clientId === env.GOOGLE_CLIENT_ID) {
    return env.GOOGLE_CLIENT_SECRET;
  }
  if (clientId === env.GITHUB_CLIENT_ID) {
    return env.GITHUB_CLIENT_SECRET;
  }
  return null;
}

function securityHeaders(origin: string): Record<string, string> {
  return {
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'bluetooth=(), tools=(self)',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'oauth-relay' });
});

// PAR endpoint (RFC 9126) — Pushed Authorization Requests
app.post('/oauth/par', async (c) => {
  const authHeader = c.req.header('Authorization');

  let clientId: string | null = null;
  let clientSecret: string | null = null;

  if (authHeader?.startsWith('Basic ')) {
    const decoded = atob(authHeader.slice(6));
    const colonIdx = decoded.indexOf(':');
    if (colonIdx === -1) {
      return c.json({ error: 'Invalid Authorization header format' }, 401);
    }
    clientId = decoded.slice(0, colonIdx);
    clientSecret = decoded.slice(colonIdx + 1);
  } else {
    const body = await c.req.json<{ client_id?: string; client_secret?: string }>();
    clientId = body.client_id || null;
    clientSecret = body.client_secret || null;
  }

  if (!clientId || !clientSecret) {
    return c.json({ error: 'Missing client_id or client_secret' }, 401);
  }

  const expectedSecret = getClientSecret(clientId, c.env);
  if (!expectedSecret || clientSecret !== expectedSecret) {
    return c.json({ error: 'Invalid client credentials' }, 401);
  }

  const body = await c.req.json<PARRequest>();

  const requiredParams: (keyof PARRequest)[] = ['redirect_uri', 'provider', 'state', 'code_challenge'];
  for (const param of requiredParams) {
    if (!body[param]) {
      return c.json({ error: `Missing required parameter: ${String(param)}` }, 400);
    }
  }

  if (!['google', 'github'].includes(body.provider)) {
    return c.json({ error: 'Invalid provider' }, 400);
  }

  if (body.code_challenge_method && body.code_challenge_method !== 'S256') {
    return c.json({ error: 'Unsupported code_challenge_method' }, 400);
  }

  const requestUri = crypto.randomUUID();
  const now = Date.now();
  const expiresAt = now + PAR_TTL_MS;

  await c.env.DB.prepare(
    `INSERT INTO par_requests (request_uri, client_id, request_payload, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(requestUri, clientId, JSON.stringify(body), now, expiresAt)
    .run();

  return c.json({ request_uri: requestUri, expires_in: PAR_TTL_MS / 1000 }, 200);
});

// Initiate OAuth flow — direct params or request_uri (PAR)
app.get('/oauth/authorize', async (c) => {
  let providerName: string;
  let redirect: string;
  let codeVerifier: string;
  let state: string;
  let codeChallenge: string;

  const requestUri = c.req.query('request_uri');

  if (requestUri) {
    const parRecord = await c.env.DB.prepare(
      `SELECT * FROM par_requests WHERE request_uri = ?`,
    )
      .bind(requestUri)
      .first<{ client_id: string; request_payload: string; created_at: number; expires_at: number }>();

    if (!parRecord) {
      return c.json({ error: 'Invalid request_uri' }, 400);
    }

    if (Date.now() > parRecord.expires_at) {
      await c.env.DB.prepare(`DELETE FROM par_requests WHERE request_uri = ?`)
        .bind(requestUri)
        .run();
      return c.json({ error: 'PAR request expired' }, 410);
    }

    const payload = JSON.parse(parRecord.request_payload) as PARRequest;
    providerName = payload.provider;
    redirect = payload.redirect_uri;
    state = payload.state;

    const encoder = new TextEncoder();
    const verifierData = encoder.encode(state);
    const challengeBuffer = await crypto.subtle.digest('SHA-256', verifierData);
    codeChallenge = btoa(String.fromCharCode(...new Uint8Array(challengeBuffer)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    codeVerifier = state;

    await c.env.DB.prepare(`DELETE FROM par_requests WHERE request_uri = ?`)
      .bind(requestUri)
      .run();
  } else {
    providerName = c.req.query('provider') || '';
    redirect = c.req.query('redirect') || '';

    if (!providerName || !redirect) {
      return c.json({ error: 'Missing provider or redirect parameter' }, 400);
    }

    if (!['google', 'github'].includes(providerName)) {
      return c.json({ error: 'Invalid provider' }, 400);
    }

    // Generate PKCE verifier and state
    codeVerifier = base58Encode(crypto.getRandomValues(new Uint8Array(32)));
    const stateBytes = crypto.getRandomValues(new Uint8Array(16));
    state = base58Encode(stateBytes);

    const encoder = new TextEncoder();
    const verifierData = encoder.encode(codeVerifier);
    const challengeBuffer = await crypto.subtle.digest('SHA-256', verifierData);
    codeChallenge = btoa(String.fromCharCode(...new Uint8Array(challengeBuffer)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  const provider = getProvider(providerName);
  if (!provider) {
    return c.json({ error: 'Unknown provider' }, 400);
  }

  const clientId = provider.getClientId(c.env);
  if (!clientId) {
    return c.json({ error: 'Provider not configured' }, 503);
  }

  const sessionId = crypto.randomUUID();
  const now = Date.now();

  await c.env.DB.prepare(
    `INSERT INTO oauth_sessions (id, provider, code_verifier, state, redirect_uri, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(sessionId, providerName, codeVerifier, state, redirect, now, now + SESSION_TTL_MS)
    .run();

  const authUrl = new URL(provider.authUrl);
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', `${new URL(c.req.url).origin}/oauth/callback`);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', provider.scopes.join(' '));
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  return Response.redirect(authUrl.toString(), 302);
});

// OAuth callback — exchanges code for token
app.get('/oauth/callback', async (c) => {
  const url = new URL(c.req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) {
    return c.json({ error: `Provider returned error: ${error}` }, 400);
  }

  if (!code || !state) {
    return c.json({ error: 'Missing code or state' }, 400);
  }

  // Find session by state
  const session = await c.env.DB.prepare(
    `SELECT * FROM oauth_sessions WHERE state = ?`,
  )
    .bind(state)
    .first<OAuthSession>();

  if (!session) {
    return c.json({ error: 'Invalid state' }, 400);
  }

  if (Date.now() > session.expires_at) {
    await c.env.DB.prepare(`DELETE FROM oauth_sessions WHERE id = ?`)
      .bind(session.id)
      .run();
    return c.json({ error: 'Session expired' }, 410);
  }

  const provider = getProvider(session.provider);
  if (!provider) {
    return c.json({ error: 'Unknown provider' }, 400);
  }

  // Exchange code for token
  const tokenRes = await fetch(provider.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: new URLSearchParams({
      client_id: provider.getClientId(c.env),
      client_secret: provider.getClientSecret(c.env),
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${new URL(c.req.url).origin}/oauth/callback`,
      code_verifier: session.code_verifier,
    }).toString(),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text().catch(() => '');
    console.error(`Token exchange failed for ${session.provider}:`, tokenRes.status, body);
    return c.json({ error: 'Token exchange failed' }, 500);
  }

  const tokenData = await tokenRes.json<{
    access_token?: string;
    refresh_token?: string;
    error?: string;
  }>();

  if (!tokenData.access_token) {
    return c.json({ error: 'No access token received' }, 500);
  }

  // Fetch user info
  const userinfoRes = await fetch(provider.userinfoUrl, {
    headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
  });

  const userinfo = await userinfoRes.json<Record<string, unknown>>();

  const providerUserId = (userinfo.sub ?? userinfo.id ?? userinfo.login) as string;

  // Derive did:key from access token
  const salt = generateSalt();
  const didKey = await deriveDidKey(tokenData.access_token, salt);

  // Store token
  const tokenId = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT OR REPLACE INTO oauth_tokens
       (id, provider, provider_user_id, access_token, refresh_token, refresh_token_used, expires_at, did_key, per_user_salt, created_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
  )
    .bind(
      tokenId,
      session.provider,
      providerUserId,
      tokenData.access_token,
      tokenData.refresh_token ?? null,
      Date.now() + TOKEN_TTL_MS,
      didKey,
      base58Encode(salt),
      Date.now(),
    )
    .run();

  // Clean up session
  await c.env.DB.prepare(`DELETE FROM oauth_sessions WHERE id = ?`)
    .bind(session.id)
    .run();

  // Issue DPoP nonce for subsequent token request
  const dpopNonce = generateNonce();

  // Redirect back to shell
  const shellRedirect = new URL(session.redirect_uri);
  shellRedirect.searchParams.set('did', didKey);
  shellRedirect.searchParams.set('provider', session.provider);
  shellRedirect.searchParams.set('user_id', providerUserId);
  shellRedirect.searchParams.set('token_id', tokenId);
  shellRedirect.searchParams.set('dpop_nonce', dpopNonce);

  return Response.redirect(shellRedirect.toString(), 302);
});

// Token exchange — shell client polls this after redirect
app.post('/oauth/token', async (c) => {
  const body = await c.req.json<{
    token_id?: string;
    state?: string;
  }>();

  if (!body.token_id) {
    return c.json({ error: 'Missing token_id' }, 400);
  }

  const token = await c.env.DB.prepare(
    `SELECT * FROM oauth_tokens WHERE id = ?`,
  )
    .bind(body.token_id)
    .first<OAuthToken>();

  if (!token) {
    return c.json({ error: 'Token not found' }, 404);
  }

  if (Date.now() > token.expires_at) {
    await c.env.DB.prepare(`DELETE FROM oauth_tokens WHERE id = ?`)
      .bind(body.token_id)
      .run();
    return c.json({ error: 'Token expired' }, 410);
  }

  // Verify DPoP proof if provided
  const dpopHeader = c.req.header('DPoP');
  let dpopJkt: string | null = null;
  let dpopNonce = generateNonce();

  if (dpopHeader) {
    const tokenUrl = `${new URL(c.req.url).origin}/oauth/token`;
    const result = await verifyDPoPProof(dpopHeader, 'POST', tokenUrl, token.access_token, undefined);
    if (!result.valid) {
      return c.json({ error: 'Invalid DPoP proof' }, 401);
    }
    dpopJkt = result.jkt;

    // Update token with dpop_jkt if not already set
    if (!token.dpop_jkt) {
      await c.env.DB.prepare(`UPDATE oauth_tokens SET dpop_jkt = ? WHERE id = ?`)
        .bind(dpopJkt, token.id)
        .run();
    }
  }

  const response = {
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    did_key: token.did_key,
    provider: token.provider,
    provider_user_id: token.provider_user_id,
    expires_at: token.expires_at,
    dpop_jkt: dpopJkt,
  };

  return c.json(response, 200, { 'DPoP-Nonce': dpopNonce });
});

// Refresh token — rotates refresh token, detects replay
app.post('/oauth/refresh', async (c) => {
  const body = await c.req.json<{
    token_id?: string;
    refresh_token?: string;
  }>();

  if (!body.token_id && !body.refresh_token) {
    return c.json({ error: 'Missing token_id or refresh_token' }, 400);
  }

  // Find existing token
  let token: OAuthToken | undefined;
  if (body.token_id) {
    token = await c.env.DB.prepare(`SELECT * FROM oauth_tokens WHERE id = ?`)
      .bind(body.token_id).first<OAuthToken>();
  } else if (body.refresh_token) {
    token = await c.env.DB.prepare(`SELECT * FROM oauth_tokens WHERE refresh_token = ?`)
      .bind(body.refresh_token).first<OAuthToken>();
  }

  if (!token) {
    return c.json({ error: 'Token not found' }, 404);
  }

  // Replay detection — already used refresh token
  if (token.refresh_token_used) {
    console.error(`Refresh token replay detected for ${token.provider} user ${token.provider_user_id}`);
    await c.env.DB.prepare(`DELETE FROM oauth_tokens WHERE id = ?`).bind(token.id).run();
    return c.json({ error: 'Refresh token reuse detected — all tokens revoked' }, 401);
  }

  if (!token.refresh_token) {
    return c.json({ error: 'No refresh token available' }, 400);
  }

  const provider = getProvider(token.provider);
  if (!provider) {
    return c.json({ error: 'Unknown provider' }, 500);
  }

  // Exchange refresh token for new access token
  const tokenRes = await fetch(provider.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: new URLSearchParams({
      client_id: provider.getClientId(c.env),
      client_secret: provider.getClientSecret(c.env),
      grant_type: 'refresh_token',
      refresh_token: token.refresh_token,
    }).toString(),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text().catch(() => '');
    console.error(`Refresh token exchange failed for ${token.provider}:`, tokenRes.status, body);
    return c.json({ error: 'Refresh token exchange failed' }, 500);
  }

  const tokenData = await tokenRes.json<{
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  }>();

  if (!tokenData.access_token) {
    return c.json({ error: 'No access token received' }, 500);
  }

  // Mark old refresh token as used (rotation)
  const newRefreshToken = tokenData.refresh_token || token.refresh_token;
  const newExpiresAt = Date.now() + ((tokenData.expires_in || 3600) * 1000);

  await c.env.DB.prepare(
    `UPDATE oauth_tokens SET access_token = ?, refresh_token = ?, refresh_token_used = 1, expires_at = ? WHERE id = ?`
  )
    .bind(tokenData.access_token, newRefreshToken, newExpiresAt, token.id)
    .run();

  return c.json({
    access_token: tokenData.access_token,
    refresh_token: newRefreshToken,
    did_key: token.did_key,
    provider: token.provider,
    expires_at: newExpiresAt,
  });
});

// User info endpoint
app.get('/oauth/userinfo', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401);
  }

  const tokenId = authHeader.slice(7);

  const token = await c.env.DB.prepare(
    `SELECT * FROM oauth_tokens WHERE id = ?`,
  )
    .bind(tokenId)
    .first<OAuthToken>();

  if (!token) {
    return c.json({ error: 'Token not found' }, 404);
  }

  if (Date.now() > token.expires_at) {
    await c.env.DB.prepare(`DELETE FROM oauth_tokens WHERE id = ?`)
      .bind(tokenId)
      .run();
    return c.json({ error: 'Token expired' }, 410);
  }

  // Verify DPoP proof if token has dpop_jkt (sender-constraint required)
  const dpopHeader = c.req.header('DPoP');
  const tokenUrl = `${new URL(c.req.url).origin}/oauth/userinfo`;

  if (token.dpop_jkt) {
    if (!dpopHeader) {
      return c.json({ error: 'DPoP proof required' }, 401);
    }
    const result = await verifyDPoPProof(dpopHeader, 'GET', tokenUrl, token.access_token);
    if (!result.valid || result.jkt !== token.dpop_jkt) {
      return c.json({ error: 'Invalid DPoP proof' }, 401);
    }
  }

  const provider = getProvider(token.provider);
  if (!provider) {
    return c.json({ error: 'Unknown provider' }, 500);
  }

  const userinfoRes = await fetch(provider.userinfoUrl, {
    headers: { 'Authorization': `Bearer ${token.access_token}` },
  });

  if (!userinfoRes.ok) {
    return c.json({ error: 'Failed to fetch user info' }, 502);
  }

  const userinfo = await userinfoRes.json();

  return c.json({
    provider: token.provider,
    did_key: token.did_key,
    user: userinfo,
  });
});

// 404 fallback
app.notFound((c) => {
  return c.json({ error: 'Not found', path: new URL(c.req.url).pathname }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;
