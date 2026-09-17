/**
 * Operator control plane — admin-only, audited.
 * quarantine: KV kill-switch flag read by /api/eye (and available to dispatch).
 * rollback:   Cloudflare Workers version rollback via the CF API.
 */

const CF_API = 'https://api.cloudflare.com/client/v4';

/**
 * Rollback is restricted to known fleet surfaces. `command-center` is excluded
 * so the deck can never roll back the surface you are operating it from.
 */
const ROLLBACK_ALLOWLIST = new Set([
  'mesh',
  'k4-cage',
  'k4-personal',
  'k4-hubs',
  'p31-dispatch',
  'p31-passport',
  'spaceship-relay',
  'p31-social-engine',
  'p31-telemetry',
  'genesis-gate',
  'p31-bonding-relay',
  'carrie-agent',
  'carrie-wellness',
  'p31-signaling',
  'fawn-guard',
]);

async function audit(env, auth, action, name, result, reason) {
  if (!env?.EPCP_DB) return;
  try {
    await env.EPCP_DB.prepare(
      `CREATE TABLE IF NOT EXISTS operator_audit (
         ts TEXT, actor TEXT, action TEXT, target TEXT, result TEXT, reason TEXT
       )`,
    ).run();
    await env.EPCP_DB.prepare(
      'INSERT INTO operator_audit (ts, actor, action, target, result, reason) VALUES (?, ?, ?, ?, ?, ?)',
    )
      .bind(new Date().toISOString(), auth?.email || 'unknown', action, name, result, reason || '')
      .run();
  } catch {
    /* audit is best-effort; never block the action */
  }
}

export async function handleQuarantine(request, env, auth) {
  let body;
  try {
    body = await request.json();
  } catch {
    return { status: 400, body: { ok: false, error: 'invalid JSON body' } };
  }
  const name = String(body?.name || '').trim();
  if (!name) return { status: 400, body: { ok: false, error: 'name required' } };
  if (!env?.STATUS_KV) return { status: 503, body: { ok: false, error: 'STATUS_KV not bound' } };

  const key = `quarantine:${name}`;
  const release = body?.release === true;
  const reason = String(body?.reason || '').trim();
  if (!release && !reason) {
    return { status: 400, body: { ok: false, error: 'reason required to quarantine' } };
  }

  if (release) {
    await env.STATUS_KV.delete(key);
    await audit(env, auth, 'quarantine.release', name, 'ok', reason);
    return { status: 200, body: { ok: true, message: `released ${name}` } };
  }

  await env.STATUS_KV.put(
    key,
    JSON.stringify({ by: auth?.email || 'unknown', at: new Date().toISOString(), reason }),
  );
  await audit(env, auth, 'quarantine', name, 'ok', reason);
  return { status: 200, body: { ok: true, message: `quarantined ${name}` } };
}

export async function handleRollback(request, env, auth) {
  let body;
  try {
    body = await request.json();
  } catch {
    return { status: 400, body: { ok: false, error: 'invalid JSON body' } };
  }
  const name = String(body?.name || '').trim();
  if (!name) return { status: 400, body: { ok: false, error: 'name required' } };
  const reason = String(body?.reason || '').trim();
  if (!reason) return { status: 400, body: { ok: false, error: 'reason required to roll back' } };
  if (name === 'command-center' || !ROLLBACK_ALLOWLIST.has(name)) {
    return { status: 403, body: { ok: false, error: `${name} is not in the rollback allowlist` } };
  }
  if (!env?.CF_API_TOKEN || !env?.CF_ACCOUNT_ID) {
    return { status: 503, body: { ok: false, error: 'CF_API_TOKEN / CF_ACCOUNT_ID not configured' } };
  }

  const headers = { Authorization: `Bearer ${env.CF_API_TOKEN}`, 'Content-Type': 'application/json' };
  const base = `${CF_API}/accounts/${env.CF_ACCOUNT_ID}/workers/scripts/${encodeURIComponent(name)}`;

  try {
    const depRes = await fetch(`${base}/deployments`, { headers, signal: AbortSignal.timeout(15000) });
    const dep = await depRes.json();
    if (!dep.success) throw new Error(dep.errors?.[0]?.message || 'failed to read deployments');

    const versions = dep.result?.deployments?.[0]?.versions || [];
    const current = versions[0]?.version_id;
    const previous = versions[1]?.version_id;
    if (!previous) throw new Error('no previous version available to roll back to');

    const postRes = await fetch(`${base}/deployments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        strategy: 'percentage',
        versions: [{ version_id: previous, percentage: 100 }],
      }),
      signal: AbortSignal.timeout(20000),
    });
    const posted = await postRes.json();
    if (!posted.success) throw new Error(posted.errors?.[0]?.message || 'rollback failed');

    await audit(env, auth, 'rollback', name, 'ok', `from ${current} to ${previous}`);
    return { status: 200, body: { ok: true, message: `rolled back to ${previous}` } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await audit(env, auth, 'rollback', name, 'error', msg);
    return { status: 500, body: { ok: false, error: msg } };
  }
}
