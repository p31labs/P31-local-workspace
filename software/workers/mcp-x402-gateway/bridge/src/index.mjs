// HTTP edge for the bridge — exposes the 4 stdio MCP servers over MCP
// Streamable HTTP so the x402 Worker (L3.2) can bind to it. POST /mcp
// accepts a single JSON-RPC message (initialize / tools/list / tools/call
// / notifications/*). GET /health reports backend health for the runbook.
import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { BACKENDS } from './backends.mjs';
import { BridgeRouter } from './router.mjs';

export function createServer(router, { port = 8788 } = {}) {
  const server = http.createServer(async (req, res) => {
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'ok',
          tools: router.catalog.length,
          backends: router.backends.map((b) => ({ id: b.id, healthy: b.healthy })),
        }),
      );
      return;
    }
    if (req.method === 'POST' && req.url === '/mcp') {
      let body = '';
      for await (const c of req) body += c;
      let msg;
      try {
        msg = JSON.parse(body);
      } catch {
        res.writeHead(400, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'parse error' } }));
        return;
      }
      try {
        const r = await router.handle(msg);
        if (r === null) {
          res.writeHead(202);
          res.end();
          return;
        }
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify(r));
      } catch (e) {
        res.writeHead(500, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ jsonrpc: '2.0', id: msg.id ?? null, error: { code: -32603, message: String(e.message) } }));
      }
      return;
    }
    res.writeHead(404);
    res.end('not found');
  });
  server.port = port;
  return server;
}

const isMain = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMain) {
  const router = new BridgeRouter(BACKENDS);
  await router.start();
  const server = createServer(router);
  server.listen(server.port, () => {
    const healthy = router.backends.filter((b) => b.healthy).map((b) => b.id);
    console.log(`[bridge] listening on :${server.port} | tools=${router.catalog.length} | backends=${healthy.join(',')}`);
  });
}
