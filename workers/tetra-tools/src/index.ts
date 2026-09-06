/**
 * tetra-tools Worker — CRUD for p31.tetra/v1 data.
 * Nonprofit management: donors, grants, volunteers, campaigns, ledger, reports.
 *
 * Endpoints:
 *   POST /tetra       — Create a tetra (body = TetraData JSON)
 *   GET  /tetra/:id   — Read a tetra by ID
 *   GET  /tetra/list  — List tetras (?class=DONOR_CAGE&limit=50)
 *   DELETE /tetra/:id — Delete a tetra
 *   GET  /health      — Health check
 */

export interface Env {
  TETRA_DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
    if (request.method === 'OPTIONS') return new Response(null, { headers });

    try {
      // Ensure table exists
      await env.TETRA_DB.exec(`CREATE TABLE IF NOT EXISTS tetras (
        id TEXT PRIMARY KEY, class TEXT NOT NULL, label TEXT, data_json TEXT NOT NULL,
        creator TEXT DEFAULT 'anonymous', created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`);
      await env.TETRA_DB.exec(`CREATE INDEX IF NOT EXISTS idx_tetras_class ON tetras(class)`);
      await env.TETRA_DB.exec(`CREATE INDEX IF NOT EXISTS idx_tetras_created ON tetras(created_at DESC)`);

      if (url.pathname === '/health') {
        return new Response(JSON.stringify({ ok: true, service: 'tetra-tools' }), { headers });
      }

      // POST /tetra — Create
      if (url.pathname === '/tetra' && request.method === 'POST') {
        const body: any = await request.json();
        if (!body.id || !body.class) {
          return new Response(JSON.stringify({ error: 'Missing id or class' }), { status: 400, headers });
        }
        const dataJson = JSON.stringify(body);
        await env.TETRA_DB.prepare(
          `INSERT OR REPLACE INTO tetras (id, class, label, data_json, updated_at) VALUES (?, ?, ?, ?, datetime('now'))`
        ).bind(body.id, body.class, body.metadata?.label || body.id, dataJson).run();
        return new Response(JSON.stringify({ ok: true, id: body.id }), { headers });
      }

      // GET /tetra/:id — Read
      const idMatch = url.pathname.match(/^\/tetra\/(.+)$/);
      if (idMatch && request.method === 'GET') {
        const id = idMatch[1];
        const row = await env.TETRA_DB.prepare('SELECT * FROM tetras WHERE id = ?').bind(id).first();
        if (!row) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
        const data = JSON.parse(row.data_json as string);
        return new Response(JSON.stringify(data), { headers });
      }

      // DELETE /tetra/:id
      if (idMatch && request.method === 'DELETE') {
        await env.TETRA_DB.prepare('DELETE FROM tetras WHERE id = ?').bind(idMatch[1]).run();
        return new Response(JSON.stringify({ ok: true }), { headers });
      }

      // GET /tetra/list — List with optional filters
      if (url.pathname === '/tetra/list' && request.method === 'GET') {
        const cls = url.searchParams.get('class') || '';
        const limit = Math.min(100, parseInt(url.searchParams.get('limit') || '50', 10));
        let query = 'SELECT id, class, label, created_at, updated_at FROM tetras';
        const params: any[] = [];
        if (cls) {
          query += ' WHERE class = ?';
          params.push(cls);
        }
        query += ' ORDER BY updated_at DESC LIMIT ?';
        params.push(limit);
        const { results } = await env.TETRA_DB.prepare(query).bind(...params).all();
        return new Response(JSON.stringify({ results }), { headers });
      }

      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
  },
};
