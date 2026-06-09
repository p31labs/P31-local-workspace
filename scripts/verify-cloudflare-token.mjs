#!/usr/bin/env node
/**
 * Verify Cloudflare API token + optional account ID (local or CI).
 *
 *   CLOUDFLARE_API_TOKEN=xxx node scripts/verify-cloudflare-token.mjs
 *   CLOUDFLARE_ACCOUNT_ID=yyy  # optional — checks account is visible to this token
 *
 * Exit 0 = token valid; 1 = missing token, HTTP error, or account mismatch.
 */

const BASE = 'https://api.cloudflare.com/client/v4';

function must(name) {
  const v = process.env[name];
  if (!v || !String(v).trim()) {
    console.error(`[cf:verify] Missing env: ${name}`);
    process.exit(1);
  }
  return v.trim();
}

async function main() {
  const token = must('CLOUDFLARE_API_TOKEN');
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const verifyRes = await fetch(`${BASE}/user/tokens/verify`, { headers });
  const verifyJson = await verifyRes.json().catch(() => ({}));

  if (!verifyRes.ok) {
    console.error('[cf:verify] Token verify failed:', verifyRes.status, verifyJson);
    process.exit(1);
  }

  const status = verifyJson.result?.status;
  if (status && status !== 'active') {
    console.error('[cf:verify] Token status is not active:', status);
    process.exit(1);
  }

  console.log('[cf:verify] Token OK (status:', status || 'unknown', ')');

  if (accountId) {
    const accRes = await fetch(`${BASE}/accounts/${accountId}`, { headers });
    const accJson = await accRes.json().catch(() => ({}));
    if (!accRes.ok) {
      console.error('[cf:verify] Account check failed:', accRes.status, accJson);
      process.exit(1);
    }
    const name = accJson.result?.name || accountId;
    console.log('[cf:verify] Account OK:', name);
  } else {
    console.log('[cf:verify] CLOUDFLARE_ACCOUNT_ID not set — skipping account check');
  }

  console.log('[cf:verify] Done.');
}

main().catch((e) => {
  console.error('[cf:verify]', e);
  process.exit(1);
});
