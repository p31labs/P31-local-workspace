/**
 * P31 Bouncer — minimal gate agent + public secrets index (names only).
 * Secrets: BOUNCER_GATE_TOKEN (wrangler secret put BOUNCER_GATE_TOKEN)
 */
import manifest from './secrets-index.json';

const JSON_HDR = { 'content-type': 'application/json; charset=utf-8' };

function cors(env) {
  const raw = env.ALLOWED_ORIGINS || '*';
  const allow = raw.split(',').map((s) => s.trim()).filter(Boolean);
  const origin = allow.includes('*') ? '*' : allow.join(', ');
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function json(data, status, env, extra = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status: status || 200,
    headers: { ...JSON_HDR, ...cors(env), ...extra },
  });
}

function bearer(request) {
  const h = request.headers.get('Authorization') || '';
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1].trim() : null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors(env) });
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      return json(
        { ok: true, service: 'p31-bouncer', ts: new Date().toISOString() },
        200,
        env,
      );
    }

    if (request.method === 'GET' && url.pathname === '/') {
      return json(
        {
          service: 'P31 Bouncer',
          version: manifest.version || '1.0.0',
          docs: 'SECURITY_SECRETS_MANIFEST.md in repo',
          routes: ['GET /health', 'GET /v1/secrets-index', 'GET /v1/gate (Bearer)'],
        },
        200,
        env,
      );
    }

    if (request.method === 'GET' && url.pathname === '/v1/secrets-index') {
      return json(manifest, 200, env);
    }

    if (request.method === 'GET' && url.pathname === '/v1/gate') {
      const token = bearer(request);
      const expected = env.BOUNCER_GATE_TOKEN;
      if (!expected) {
        return json(
          { error: 'not_configured', hint: 'wrangler secret put BOUNCER_GATE_TOKEN' },
          503,
          env,
        );
      }
      if (!token || token !== expected) {
        return json({ error: 'unauthorized' }, 401, env);
      }
      return json(
        {
          ok: true,
          authorized: true,
          ts: new Date().toISOString(),
        },
        200,
        env,
      );
    }

    return json({ error: 'not_found', path: url.pathname }, 404, env);
  },
};
