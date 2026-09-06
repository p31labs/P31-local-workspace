/**
 * secret-rotator — P31 Secret Vault rotation Worker (CWP-2026-014).
 *
 * Rotates LOVE_AUTH_SECRET (and future Secrets Store secrets) without a
 * per-Worker redeploy: bound Workers read the secret at runtime via
 * `await env.LOVE_AUTH_SECRET.get()`, so updating the value in the store
 * propagates everywhere on the next cold start.
 *
 * Two entry points:
 *   - scheduled(): quarterly cron (day 1 of every 3rd month) — automatic rotation.
 *   - POST /admin/rotate: emergency "break-glass" rotation (Bearer ADMIN_TOKEN).
 *
 * Every rotation is audit-logged to the shared love-ledger D1
 * (secret_rotation_log) with a SHA-256 hash of the new value (never the value).
 */

interface Env {
  ACCOUNT_ID: string;
  STORE_ID: string;
  LOVE_AUTH_SECRET_ID: string;
  CF_API_TOKEN: string; // secret: token with "Secrets Store Write"
  ADMIN_TOKEN: string; // secret: guards /admin/rotate
  ROTATION_DB: D1Database;
}

function genSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256hex(s: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Update a Secrets Store secret's value via the Cloudflare REST API.
// PUT /accounts/{account}/secrets_store/stores/{store}/secrets/{id}
async function updateSecretValue(env: Env, secretId: string, value: string): Promise<void> {
  const url =
    `https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}` +
    `/secrets_store/stores/${env.STORE_ID}/secrets/${secretId}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${env.CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ value }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Cloudflare secrets_store update ${res.status}: ${text.slice(0, 300)}`);
  }
}

async function logRotation(env: Env, row: {
  secret_name: string;
  old_secret_hash: string | null;
  new_secret_hash: string | null;
  rotated_by: string;
  status: string;
  error?: string;
}): Promise<void> {
  await env.ROTATION_DB.prepare(
    `INSERT INTO secret_rotation_log
       (id, secret_name, old_secret_hash, new_secret_hash, rotated_by, rotated_at, status, error)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      crypto.randomUUID(),
      row.secret_name,
      row.old_secret_hash,
      row.new_secret_hash,
      row.rotated_by,
      Date.now(),
      row.status,
      row.error ?? null,
    )
    .run();
}

async function rotate(env: Env, rotatedBy: string): Promise<{ ok: boolean; error?: string }> {
  const newSecret = genSecret();
  const newHash = await sha256hex(newSecret);
  try {
    await updateSecretValue(env, env.LOVE_AUTH_SECRET_ID, newSecret);
    await logRotation(env, {
      secret_name: 'LOVE_AUTH_SECRET',
      old_secret_hash: null, // store is zero-read; previous value is not retrievable
      new_secret_hash: newHash,
      rotated_by: rotatedBy,
      status: 'success',
    });
    return { ok: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await logRotation(env, {
      secret_name: 'LOVE_AUTH_SECRET',
      old_secret_hash: null,
      new_secret_hash: newHash,
      rotated_by: rotatedBy,
      status: 'failed',
      error,
    }).catch(() => {});
    return { ok: false, error };
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname === '/admin/rotate') {
      const auth = request.headers.get('Authorization');
      if (auth !== `Bearer ${env.ADMIN_TOKEN}`) {
        return new Response('Unauthorized', { status: 401 });
      }
      const rotatedBy = (await request.json().catch(() => ({})) as any)?.rotated_by ?? 'admin';
      const result = await rotate(env, rotatedBy);
      return Response.json(result, { status: result.ok ? 200 : 500 });
    }
    if (request.method === 'GET' && url.pathname === '/health') {
      return Response.json({ status: 'ok', service: 'secret-rotator' });
    }
    return new Response('secret-rotator', { status: 200 });
  },

  async scheduled(_event: unknown, env: Env): Promise<void> {
    await rotate(env, 'cron');
  },
};
