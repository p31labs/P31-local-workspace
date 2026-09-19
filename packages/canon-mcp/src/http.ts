#!/usr/bin/env node
/**
 * @p31/canon-mcp — src/http.ts
 *
 * The HTTP entry point for the canon MCP server — the same tools as server.ts
 * (stdio), served over MCP Streamable HTTP so edge services (the builders,
 * the shell) can reach the Loom without a local Node filesystem.
 *
 * Reuses createServer() from server.ts: ONE tool registry, TWO transports.
 * The transport runs in stateless mode (no sessionIdGenerator) — matching the
 * 2026-07-28 sessionless MCP direction — with JSON responses enabled so a
 * polling caller (a Cloudflare Worker) gets plain request/response, not an
 * SSE stream it can't hold open.
 *
 * Run: npm run start:http   (listens on PORT, default 5192)
 */
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/server';
import { createServer } from './server';

const PORT = Number(process.env.PORT ?? 5192);

const server = await createServer();
const transport = new WebStandardStreamableHTTPServerTransport({
  sessionIdGenerator: undefined,
  enableJsonResponse: true,
});

await server.connect(transport);

// The transport speaks Web-standard Request/Response; a tiny node:http adapter
// bridges it. `handleRequest` returns a full Response for every method (POST
// JSON-RPC, GET/SSE priming, DELETE teardown).
const { createServer: createHttpServer } = await import('node:http');

const http = createHttpServer((req, res) => {
  // Collect the body, then build a Web Request and hand it to the transport.
  const chunks: Buffer[] = [];
  req.on('data', (c) => chunks.push(c as Buffer));
  req.on('end', async () => {
    try {
      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
      const body = Buffer.concat(chunks);
      const request = new Request(url, {
        method: req.method,
        headers: req.headers as Record<string, string>,
        body: ['GET', 'HEAD'].includes(req.method ?? '') ? undefined : body,
      });
      const response = await transport.handleRequest(request);
      res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
      const text = await response.text();
      res.end(text);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32603, message: String(err) } }));
    }
  });
});

http.listen(PORT, '0.0.0.0', () => {
  console.log(`canon-mcp http listening on http://0.0.0.0:${PORT} (stateless, JSON)`);
});
