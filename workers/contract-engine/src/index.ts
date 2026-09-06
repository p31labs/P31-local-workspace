/**
 * Contract Engine — Care contracts with PQC settlement for P31 Sovereign Mesh.
 * Deployed: contract-engine.trimtab-signal.workers.dev
 */

export interface Env {
  CONTRACTS_DB: D1Database;
}

// Stub DO class for existing binding — not used at runtime
export class ContractEngine {}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
    if (request.method === 'OPTIONS') return new Response(null, { headers });

    try {
      await env.CONTRACTS_DB.exec("CREATE TABLE IF NOT EXISTS contracts (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT, parties TEXT DEFAULT '[]', terms TEXT DEFAULT '{}', status TEXT DEFAULT 'draft', pq_signature TEXT, created_at TEXT DEFAULT (datetime('now')), executed_at TEXT, settled_at TEXT)");

      if (url.pathname === '/health') {
        const count = await env.CONTRACTS_DB.prepare('SELECT COUNT(*) as c FROM contracts').first();
        return new Response(JSON.stringify({ ok: true, service: 'contract-engine', contracts: (count as any)?.c || 0 }), { headers });
      }

      // POST /contract — Create
      if (url.pathname === '/contract' && request.method === 'POST') {
        const { title, description, parties, terms, pqSignature } = await request.json() as any;
        if (!title) return new Response(JSON.stringify({ error: 'Missing title' }), { status: 400, headers });
        const id = `ct_${Date.now()}`;
        await env.CONTRACTS_DB.prepare(
          'INSERT INTO contracts (id, title, description, parties, terms, pq_signature) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(id, title, description || '', JSON.stringify(parties || []), JSON.stringify(terms || {}), pqSignature || null).run();
        return new Response(JSON.stringify({ id, status: 'draft' }), { headers });
      }

      // GET /contract/:id — Read
      const ctMatch = url.pathname.match(/^\/contract\/(.+)$/);
      if (ctMatch && request.method === 'GET') {
        const row = await env.CONTRACTS_DB.prepare('SELECT * FROM contracts WHERE id = ?').bind(ctMatch[1]).first();
        if (!row) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
        return new Response(JSON.stringify(row), { headers });
      }

      // GET /contracts — List
      if (url.pathname === '/contracts' && request.method === 'GET') {
        const { results } = await env.CONTRACTS_DB.prepare('SELECT * FROM contracts ORDER BY created_at DESC LIMIT 50').all();
        return new Response(JSON.stringify(results), { headers });
      }

      // POST /contract/:id/execute — Execute
      const execMatch = url.pathname.match(/^\/contract\/(.+)\/execute$/);
      if (execMatch && request.method === 'POST') {
        await env.CONTRACTS_DB.prepare(
          'UPDATE contracts SET status = ?, executed_at = ? WHERE id = ?'
        ).bind('executed', new Date().toISOString(), execMatch[1]).run();
        return new Response(JSON.stringify({ id: execMatch[1], status: 'executed' }), { headers });
      }

      // POST /contract/:id/settle — PQC Settlement
      const settleMatch = url.pathname.match(/^\/contract\/(.+)\/settle$/);
      if (settleMatch && request.method === 'POST') {
        const { pqSignature } = await request.json() as any;
        await env.CONTRACTS_DB.prepare(
          'UPDATE contracts SET status = ?, settled_at = ?, pq_signature = ? WHERE id = ?'
        ).bind('settled', new Date().toISOString(), pqSignature || null, settleMatch[1]).run();
        return new Response(JSON.stringify({ id: settleMatch[1], status: 'settled' }), { headers });
      }

      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
  },
};
