/**
 * Dispatch Router — Multi-tenant routing for P31 family apps.
 *
 * Routes requests to the app-supervisor with DID-based tenant isolation.
 * Adds per-family headers for audit logging and cost attribution.
 *
 * Routes:
 *   GET /:family/:app       — Serve a family's deployed app
 *   POST /:family/create    — Deploy a new app for a family
 *   GET /:family            — List a family's deployed apps
 *   GET /health             — Router health
 */

interface Env {
  APP_SUPERVISOR: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Family-DID',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ ok: true, service: 'dispatch-router' }), {
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    // Parse route: /:familyDid/apps/:appId or /:familyDid/apps
    const parts = url.pathname.split('/').filter(Boolean);

    // Root info
    if (parts.length === 0) {
      return new Response(JSON.stringify({
        service: 'P31 Family Dispatch Router',
        usage: {
          'GET /:familyDid': 'List family apps',
          'POST /:familyDid/create': 'Deploy family app { name, html, css, js }',
          'GET /:familyDid/apps/:appId': 'Serve family app',
        },
        auth: 'Include X-Family-DID header with all requests',
      }), { headers: { 'Content-Type': 'application/json', ...cors } });
    }

    // Extract family DID from path
    const familyDid = decodeURIComponent(parts[0]);

    if (!familyDid || familyDid.length < 5) {
      return new Response(JSON.stringify({ error: 'Invalid family DID in URL path' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    // Sanitize DID for use in storage keys
    const safeDid = familyDid.replace(/[^a-zA-Z0-9:._-]/g, '_').slice(0, 64);

    // ── Route: POST /:family/create → POST /apps/create ──
    if (parts.length === 2 && parts[1] === 'create' && request.method === 'POST') {
      try {
        const body = await request.json() as any;
        const proxyReq = new Request('https://placeholder/apps/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Family-DID': safeDid,
            'X-Tenant-ID': safeDid,
          },
          body: JSON.stringify({
            ...body,
            creator: body.creator || safeDid,
          }),
        });
        return env.APP_SUPERVISOR.fetch(proxyReq);
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500, headers: { 'Content-Type': 'application/json', ...cors },
        });
      }
    }

    // ── Route: GET /:family → GET /apps (list, filtered by family) ──
    if (parts.length === 1 && request.method === 'GET') {
      const proxyReq = new Request('https://placeholder/apps', {
        headers: { 'X-Family-DID': safeDid, 'X-Tenant-ID': safeDid },
      });
      return env.APP_SUPERVISOR.fetch(proxyReq);
    }

    // ── Route: GET /:family/apps/:appId → GET /apps/:appId ──
    if (parts.length >= 3 && parts[1] === 'apps' && request.method === 'GET') {
      const appId = parts[2];
      const proxyReq = new Request(`https://placeholder/apps/${appId}`, {
        headers: { 'X-Family-DID': safeDid, 'X-Tenant-ID': safeDid },
      });
      return env.APP_SUPERVISOR.fetch(proxyReq);
    }

    // ── Route: POST /:family/apps/:appId/state ──
    if (parts.length >= 4 && parts[1] === 'apps' && parts[3] === 'state') {
      const appId = parts[2];
      const proxyReq = new Request(`https://placeholder/apps/${appId}/state`, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          'X-Family-DID': safeDid,
          'X-Tenant-ID': safeDid,
        },
        body: request.body,
      });
      return env.APP_SUPERVISOR.fetch(proxyReq);
    }

    return new Response(JSON.stringify({ error: 'Not found', family: safeDid, path: url.pathname }), {
      status: 404, headers: { 'Content-Type': 'application/json', ...cors },
    });
  },
};
