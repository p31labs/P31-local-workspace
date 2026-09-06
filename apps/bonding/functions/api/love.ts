/**
 * BONDING — Pages Functions API
 * Handles LOVE economy endpoints for the Bonding game.
 *
 * Endpoints:
 *   POST /api/love/mint  — Mint LOVE credits for bonding achievements
 *   GET  /api/love/balance/:did — Get LOVE balance
 */

const LOVE_LEDGER = 'https://love-ledger.p31ca.org';

export const onRequest: PagesFunction = async ({ request, env }) => {
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/^\/api/, '');

  // LOVE Mint
  if (request.method === 'POST' && pathname === '/love/mint') {
    try {
      const { did, amount, reason } = await request.json() as any;
      if (!did || !amount) {
        return new Response(JSON.stringify({ error: 'did and amount required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      const res = await fetch(`${LOVE_LEDGER}/api/love/append`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: did,
          type: 'earn',
          amount,
          description: reason || 'bonding_achievement',
        }),
      });

      if (!res.ok) {
        return new Response(JSON.stringify({ ok: false, error: 'ledger unavailable' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({ ok: true, amount, reason }), { headers: { 'Content-Type': 'application/json' } });
    } catch {
      return new Response(JSON.stringify({ ok: false, error: 'internal error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }

  // LOVE Balance
  if (request.method === 'GET' && pathname.startsWith('/love/balance/')) {
    const did = pathname.replace('/love/balance/', '');
    try {
      const res = await fetch(`${LOVE_LEDGER}/api/love/balance/${encodeURIComponent(did)}`);
      const data = await res.json() as any;
      return new Response(JSON.stringify({ balance: data.balance ?? data.total ?? 0 }), { headers: { 'Content-Type': 'application/json' } });
    } catch {
      return new Response(JSON.stringify({ balance: 0, note: 'ledger unreachable' }), { headers: { 'Content-Type': 'application/json' } });
    }
  }

  return new Response('Not Found', { status: 404 });
};
