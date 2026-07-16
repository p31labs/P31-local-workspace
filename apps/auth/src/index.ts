import { Hono } from 'hono';
import { cors } from 'hono/cors';

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  AUTH_SECRET: string;
  ALLOWED_ORIGINS: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({
  origin: (origin, c) => {
    const allowed = (c.env.ALLOWED_ORIGINS || '').split(',').map((s: string) => s.trim());
    return allowed.includes(origin) ? origin : allowed[0] || '*';
  },
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.get('/health', (c) => c.json({ status: 'ok', service: 'p31-auth', timestamp: Date.now() }));

// Root landing page (valid HTML for accessibility audits: title + lang)
app.get('/', (c) => c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>P31 Auth</title>
</head>
<body style="background:#0a0e14;color:#e2e8f0;font-family:system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;margin:0">
  <div style="text-align:center;max-width:480px;padding:32px">
    <h1 style="color:#00F0FF;font-size:24px;margin-bottom:8px">P31 Auth</h1>
    <p style="color:#cbd5e1;font-size:14px;line-height:1.6">JWT authentication service for the P31 Adaptive Exocortex.</p>
    <p style="color:#94a3b8;font-size:13px;margin-top:16px">POST to <code>/auth/login</code> to obtain a token. GET <code>/health</code> for status.</p>
  </div>
</body>
</html>`));

// ── JWT helpers ────────────────────────────────────────────────────────
async function signJWT(payload: Record<string, unknown>, secret: string, expiresIn = 86400): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresIn };
  const enc = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const bodyB64 = btoa(JSON.stringify(body)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const data = enc.encode(`${headerB64}.${bodyB64}`);
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, data);
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${headerB64}.${bodyB64}.${sigB64}`;
}

async function verifyJWT(token: string, secret: string): Promise<Record<string, unknown> | null> {
  try {
    const [headerB64, bodyB64, sigB64] = token.split('.');
    const enc = new TextEncoder();
    const data = enc.encode(`${headerB64}.${bodyB64}`);
    const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const sigBytes = Uint8Array.from(atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, data);
    if (!valid) return null;
    const body = JSON.parse(atob(bodyB64.replace(/-/g, '+').replace(/_/g, '/')));
    if (body.exp && body.exp < Math.floor(Date.now() / 1000)) return null;
    return body;
  } catch {
    return null;
  }
}

// ── Auth routes ────────────────────────────────────────────────────────
app.post('/auth/login', async (c) => {
  try {
    const { pseudonym, did } = await c.req.json<{ pseudonym?: string; did?: string }>();
    if (!pseudonym && !did) return c.json({ error: 'pseudonym or did required' }, 400);

    const userId = did || `pseudo:${pseudonym}`;
    const secret = c.env.JWT_SECRET;
    if (!secret) return c.json({ error: 'JWT_SECRET not configured' }, 500);
    const token = await signJWT({ sub: userId, pseudonym: pseudonym || userId }, secret);

    // Upsert user record
    await c.env.DB.prepare('INSERT OR REPLACE INTO users (id, pseudonym, did, last_login) VALUES (?, ?, ?, ?)')
      .bind(userId, pseudonym || null, did || null, new Date().toISOString())
      .run();

    return c.json({ token, userId, pseudonym: pseudonym || userId });
  } catch (err) {
    return c.json({ error: 'internal error' }, 500);
  }
});

app.get('/auth/verify', async (c) => {
  const auth = c.req.header('Authorization');
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'missing token' }, 401);
  const secret = c.env.JWT_SECRET;
  if (!secret) return c.json({ error: 'JWT_SECRET not configured' }, 500);
  const payload = await verifyJWT(auth.slice(7), secret);
  if (!payload) return c.json({ error: 'invalid token' }, 401);
  return c.json({ valid: true, userId: payload.sub, pseudonym: payload.pseudonym });
});

app.post('/auth/refresh', async (c) => {
  const auth = c.req.header('Authorization');
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'missing token' }, 401);
  const secret = c.env.JWT_SECRET;
  if (!secret) return c.json({ error: 'JWT_SECRET not configured' }, 500);
  const payload = await verifyJWT(auth.slice(7), secret);
  if (!payload) return c.json({ error: 'invalid token' }, 401);
  const token = await signJWT({ sub: payload.sub, pseudonym: payload.pseudonym }, secret);
  return c.json({ token });
});

// ── User profile ───────────────────────────────────────────────────────
app.get('/auth/profile/:id', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(c.req.param('id')).all();
  if (!results.length) return c.json({ error: 'not found' }, 404);
  return c.json(results[0]);
});

// ── 404 ────────────────────────────────────────────────────────────────
app.notFound((c) => c.json({ error: 'not found' }, 404));

export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Env) {
    // Clean up expired tokens / stale users monthly
    await env.DB.prepare("DELETE FROM users WHERE last_login < date('now', '-90 days')").run();
  },
};
