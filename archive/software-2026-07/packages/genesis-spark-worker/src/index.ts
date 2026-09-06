export interface Env {
  GENESIS_KV: KVNamespace;
  PSK: string;
  DEPLOYER_WALLET: string;
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
    }

    // ── Health ────────────────────────────────────────────────────────
    if (method === 'GET' && url.pathname === '/health') {
      return json({ status: 'ok', service: 'genesis-spark', timestamp: new Date().toISOString() });
    }

    // ── Status (frontend polling) ─────────────────────────────────────
    if (method === 'GET' && url.pathname === '/status') {
      try {
        const raised = await env.GENESIS_KV.get('raised', { type: 'text' }) ?? '0';
        const triggerAddr = await env.GENESIS_KV.get('trigger_address', { type: 'text' }) ?? null;
        const ignited = await env.GENESIS_KV.get('ignited', { type: 'text' }) ?? 'false';
        return json({ raised: parseFloat(raised), threshold: 0.01, triggerAddress: triggerAddr, ignited: ignited === 'true', watchers: 142 });
      } catch (err) {
        return json({ error: err instanceof Error ? err.message : String(err) }, 500);
      }
    }

    // ── Webhook (called by Tatum/Basescan on TX to classicwilly.eth) ──
    if (method === 'POST' && url.pathname === '/webhook') {
      const auth = request.headers.get('Authorization');
      if (!auth || auth !== `Bearer ${env.PSK}`) {
        return json({ error: 'Unauthorized' }, 401);
      }
      try {
        const body: any = await request.json();
        const txHash = body.transactionHash ?? body.txHash ?? body.hash ?? '';
        const from = body.from ?? body.sender ?? '';
        const value = body.value ?? body.amount ?? 0;
        const to = body.to ?? body.recipient ?? '';
        if (to.toLowerCase() !== env.DEPLOYER_WALLET.toLowerCase()) {
          return json({ skipped: true, reason: 'not targeting deployer wallet' });
        }
        const current = parseFloat(await env.GENESIS_KV.get('raised', { type: 'text' }) ?? '0');
        const newTotal = current + parseFloat(value);
        await env.GENESIS_KV.put('raised', newTotal.toString());
        if (!(await env.GENESIS_KV.get('first_donor', { type: 'text' }))) {
          await env.GENESIS_KV.put('first_donor', from);
          await env.GENESIS_KV.put('trigger_tx', txHash);
        }
        if (newTotal >= 0.01 && !(await env.GENESIS_KV.get('ignited', { type: 'text' }))) {
          const addr = await env.GENESIS_KV.get('first_donor', { type: 'text' });
          await env.GENESIS_KV.put('trigger_address', addr ?? '');
          await env.GENESIS_KV.put('ignited', 'true');
        }
        return json({ received: true, raised: newTotal, thresholdMet: newTotal >= 0.01 });
      } catch (err) {
        return json({ error: err instanceof Error ? err.message : String(err) }, 500);
      }
    }

    // ── Admin reset ───────────────────────────────────────────────────
    if (method === 'POST' && url.pathname === '/admin/reset') {
      const auth = request.headers.get('Authorization');
      if (!auth || auth !== `Bearer ${env.PSK}`) return json({ error: 'Unauthorized' }, 401);
      await env.GENESIS_KV.delete('raised');
      await env.GENESIS_KV.delete('trigger_address');
      await env.GENESIS_KV.delete('ignited');
      await env.GENESIS_KV.delete('first_donor');
      await env.GENESIS_KV.delete('trigger_tx');
      return json({ reset: true });
    }

    return json({ error: 'Not found' }, 404);
  },
};
