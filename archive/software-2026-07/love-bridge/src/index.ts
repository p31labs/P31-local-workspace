/**
 * Love Bridge — Bonding → LOVE credit bridge
 * P31 Labs, Inc. | EIN 42-1888158
 *
 * Routes:
 *   POST /d1/mint  — mint LOVE from bonding gameplay session
 *   GET  /health   — health check
 */

export interface Env {
  LOVE_LEDGER_URL?: string;
  LOVE_AUTH_SECRET?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    if (method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    if (method === 'GET' && path === '/health') {
      return Response.json({ ok: true, service: 'love-bridge' });
    }

    if (method === 'POST' && path === '/d1/mint') {
      try {
        const { sessionId, did, totalLove } = (await request.json()) as {
          sessionId: string;
          did: string;
          totalLove: number;
        };
        if (!sessionId || !did || typeof totalLove !== 'number' || totalLove <= 0) {
          return Response.json({ error: 'Missing or invalid fields: sessionId, did, totalLove (positive number)' }, { status: 400 });
        }

        const loveLedger = env.LOVE_LEDGER_URL || 'https://love-ledger.p31ca.org';
        const auth = env.LOVE_AUTH_SECRET;
        if (!auth) {
          return Response.json({ error: 'LOVE_AUTH_SECRET not configured' }, { status: 503 });
        }

        const res = await fetch(`${loveLedger}/transfer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth}`,
          },
          body: JSON.stringify({
            from: 'system:love-issuer',
            to: did,
            amount: totalLove,
            signature: 'bonding-mint',
            type: 'gameplay',
          }),
        });

        if (!res.ok) {
          const err = await res.text();
          console.error('[Bridge] Bonding→LOVE mint failed:', err);
          return Response.json({ error: 'Love ledger transfer failed', detail: err }, { status: 502 });
        }

        const data = await res.json();
        return Response.json({ success: true, transaction: data });
      } catch (e: any) {
        return Response.json({ error: String(e) }, { status: 400 });
      }
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  },
};
