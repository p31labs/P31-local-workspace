#!/usr/bin/env node
/**
 * @p31/music-maker-mcp — src/http.ts
 *
 * The HTTP entry point — same tools as server.ts (stdio), served over MCP
 * Streamable HTTP so the mcp-registry worker can reach it (and agents can
 * call it remotely). Mirrors canon-mcp's one-tool-registry-two-transports
 * pattern. Stateless (no sessionIdGenerator), JSON responses enabled.
 *
 * Run: npm run start:http   (listens on PORT, default 5193)
 */
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/server';
import { createServer } from './server';

const PORT = Number(process.env.PORT ?? 5193);

const server = await createServer();
const transport = new WebStandardStreamableHTTPServerTransport({
  sessionIdGenerator: undefined,
  enableJsonResponse: true,
});

await server.connect(transport);

const { createServer: createHttpServer } = await import('node:http');

const http = createHttpServer((req, res) => {
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
  console.log(`music-maker-mcp http listening on http://0.0.0.0:${PORT} (stateless, JSON)`);
});