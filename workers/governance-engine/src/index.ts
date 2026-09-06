/**
 * Governance Engine — Proposals + Voting for P31 Sovereign Mesh.
 * Deployed: governance-engine.trimtab-signal.workers.dev
 */

export interface Env {
  GOVERNANCE_DB: D1Database;
  ADMIN_TOKEN?: string;
}

// Stub DO classes for existing bindings — not used at runtime
export class GovernanceEngineDO {}
export class TallyRoom {}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
    if (request.method === 'OPTIONS') return new Response(null, { headers });

    try {
      await env.GOVERNANCE_DB.exec("CREATE TABLE IF NOT EXISTS proposals (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT, creator TEXT, status TEXT DEFAULT 'pending', metadata TEXT DEFAULT '{}', created_at TEXT DEFAULT (datetime('now')))");
      await env.GOVERNANCE_DB.exec("CREATE TABLE IF NOT EXISTS votes (proposal_id TEXT, voter TEXT, vote TEXT, created_at TEXT DEFAULT (datetime('now')), PRIMARY KEY (proposal_id, voter))");

      if (url.pathname === '/health') {
        const count = await env.GOVERNANCE_DB.prepare('SELECT COUNT(*) as c FROM proposals').first();
        return new Response(JSON.stringify({ ok: true, service: 'governance-engine', proposals: (count as any)?.c || 0 }), { headers });
      }

      // POST /proposal — Create
      if (url.pathname === '/proposal' && request.method === 'POST') {
        const { title, description, creator, metadata } = await request.json() as any;
        if (!title) return new Response(JSON.stringify({ error: 'Missing title' }), { status: 400, headers });
        const id = `prop_${Date.now()}`;
        await env.GOVERNANCE_DB.prepare(
          'INSERT INTO proposals (id, title, description, creator, metadata) VALUES (?, ?, ?, ?, ?)'
        ).bind(id, title, description || '', creator || 'anonymous', JSON.stringify(metadata || {})).run();
        return new Response(JSON.stringify({ id, status: 'pending' }), { headers });
      }

      // GET /proposal/:id — Read
      const propMatch = url.pathname.match(/^\/proposal\/(.+)$/);
      if (propMatch && request.method === 'GET') {
        const row = await env.GOVERNANCE_DB.prepare('SELECT * FROM proposals WHERE id = ?').bind(propMatch[1]).first();
        if (!row) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
        return new Response(JSON.stringify(row), { headers });
      }

      // GET /proposals — List
      if (url.pathname === '/proposals' && request.method === 'GET') {
        const { results } = await env.GOVERNANCE_DB.prepare('SELECT * FROM proposals ORDER BY created_at DESC LIMIT 50').all();
        return new Response(JSON.stringify(results), { headers });
      }

      // POST /vote — Cast vote
      if (url.pathname === '/vote' && request.method === 'POST') {
        const { proposalId, voter, vote } = await request.json() as any;
        if (!proposalId || !voter) return new Response(JSON.stringify({ error: 'Missing proposalId or voter' }), { status: 400, headers });
        await env.GOVERNANCE_DB.prepare(
          'INSERT OR REPLACE INTO votes (proposal_id, voter, vote, created_at) VALUES (?, ?, ?, ?)'
        ).bind(proposalId, voter, vote || 'approve', new Date().toISOString()).run();
        return new Response(JSON.stringify({ success: true }), { headers });
      }

      // GET /vote/:proposalId — Tally
      const voteMatch = url.pathname.match(/^\/vote\/(.+)$/);
      if (voteMatch && request.method === 'GET') {
        const { results } = await env.GOVERNANCE_DB.prepare(
          'SELECT voter, vote, created_at FROM votes WHERE proposal_id = ?'
        ).bind(voteMatch[1]).all();
        return new Response(JSON.stringify(results), { headers });
      }

      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
  },
};
