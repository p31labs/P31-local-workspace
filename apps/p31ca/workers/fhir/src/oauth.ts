// workers/fhir/src/oauth.ts
// Epic SMART on FHIR OAuth 2.0 — authorization code + token refresh
// Doc: https://fhir.epic.com/Documentation?docId=oauth2

import type { Env, TokenRow } from './types';
import { auditLog } from './audit';

export function buildAuthURL(env: Env, state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.EPIC_CLIENT_ID,
    redirect_uri: env.FHIR_REDIRECT_URI,
    scope: 'openid fhirUser patient/Observation.read patient/MedicationRequest.read offline_access',
    state,
    aud: env.EPIC_FHIR_BASE_URL,
  });
  return `${env.EPIC_OAUTH_BASE_URL}/authorize?${params}`;
}

export async function exchangeCode(
  env: Env,
  code: string
): Promise<{ accessToken: string; refreshToken: string; patientId: string; expiresAt: number }> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: env.FHIR_REDIRECT_URI,
    client_id: env.EPIC_CLIENT_ID,
    client_secret: env.EPIC_CLIENT_SECRET,
  });

  const res = await fetch(`${env.EPIC_OAUTH_BASE_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }

  const data = await res.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    patient: string;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    patientId: data.patient,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

export async function getValidToken(env: Env): Promise<{ accessToken: string; patientId: string } | null> {
  const row = await env.DB.prepare(
    'SELECT * FROM fhir_tokens WHERE id = ?'
  ).bind('singleton').first<TokenRow>();

  if (!row) return null;

  // Refresh if expiring within 5 minutes
  if (row.expires_at - Date.now() < 300_000) {
    return await refreshToken(env, row.refresh_token, row.patient_id);
  }

  return { accessToken: row.access_token, patientId: row.patient_id };
}

async function refreshToken(
  env: Env,
  refreshToken: string,
  patientId: string
): Promise<{ accessToken: string; patientId: string } | null> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: env.EPIC_CLIENT_ID,
    client_secret: env.EPIC_CLIENT_SECRET,
  });

  try {
    const res = await fetch(`${env.EPIC_OAUTH_BASE_URL}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    const newRefresh = data.refresh_token ?? refreshToken;
    const expiresAt = Date.now() + data.expires_in * 1000;

    await env.DB.prepare(
      `INSERT OR REPLACE INTO fhir_tokens
       (id, access_token, refresh_token, expires_at, patient_id, updated_at)
       VALUES ('singleton', ?, ?, ?, ?, ?)`
    ).bind(data.access_token, newRefresh, expiresAt, patientId, Date.now()).run();

    await auditLog(env, 'system', 'token_refresh', 'success');

    return { accessToken: data.access_token, patientId };
  } catch (err) {
    await auditLog(env, 'system', 'token_refresh', 'error', {
      detail: err instanceof Error ? err.message : 'Unknown error',
    });
    return null;
  }
}

export async function storeTokens(
  env: Env,
  accessToken: string,
  refreshToken: string,
  patientId: string,
  expiresAt: number
): Promise<void> {
  await env.DB.prepare(
    `INSERT OR REPLACE INTO fhir_tokens
     (id, access_token, refresh_token, expires_at, patient_id, updated_at)
     VALUES ('singleton', ?, ?, ?, ?, ?)`
  ).bind(accessToken, refreshToken, expiresAt, patientId, Date.now()).run();
}
