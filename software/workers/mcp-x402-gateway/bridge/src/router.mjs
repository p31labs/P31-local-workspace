// Bridge router: fans out tools/list across all healthy backends to build
// a unified tool catalog + a {toolName -> backendId} route table, routes
// tools/call by name, and answers initialize. Stateless at the HTTP edge;
// session pinning is handled upstream by the x402 Worker (L3.2).
import { StdioBackend } from './stdio-client.mjs';

export class BridgeRouter {
  constructor(backendConfigs) {
    this.backends = backendConfigs.map((c) => new StdioBackend(c));
    this.routeTable = new Map();
    this.catalog = [];
    this.ready = false;
  }

  async start() {
    await Promise.all(
      this.backends.map((b) =>
        b.probe().catch(() => {
          b.healthy = false;
        }),
      ),
    );
    for (const b of this.backends.filter((x) => x.healthy)) {
      for (const t of b.tools || []) {
        if (t && t.name) this.routeTable.set(t.name, b.id);
      }
    }
    this.catalog = this.backends.filter((b) => b.healthy).flatMap((b) => b.tools || []);
    this.ready = true;
  }

  stop() {
    for (const b of this.backends) b.stop();
  }

  async handle(msg) {
    const method = msg && msg.method;
    if (!method) return { jsonrpc: '2.0', id: msg?.id ?? null, error: { code: -32600, message: 'no method' } };

    if (method === 'initialize') {
      return {
        jsonrpc: '2.0',
        id: msg.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: 'p31-mcp-x402-bridge', version: '0.1.0' },
        },
      };
    }

    if (method === 'tools/list') {
      return { jsonrpc: '2.0', id: msg.id, result: { tools: this.catalog } };
    }

    if (method === 'tools/call') {
      const name = msg.params?.name;
      const backendId = this.routeTable.get(name);
      if (!backendId) {
        return { jsonrpc: '2.0', id: msg.id, error: { code: -32601, message: `unknown tool: ${name}` } };
      }
      const backend = this.backends.find((b) => b.id === backendId);
      if (!backend || !backend.healthy) {
        return { jsonrpc: '2.0', id: msg.id, error: { code: -32000, message: `backend ${backendId} unavailable` } };
      }
      const r = await backend.request({ jsonrpc: '2.0', id: msg.id, method: 'tools/call', params: msg.params });
      return { jsonrpc: '2.0', id: msg.id, result: r.result };
    }

    if (method.startsWith('notifications/')) {
      for (const b of this.backends.filter((x) => x.healthy)) {
        if (b.mode === 'stream' && b.child) b.child.stdin.write(JSON.stringify(msg) + '\n');
      }
      return null; // notifications expect no response
    }

    return { jsonrpc: '2.0', id: msg.id, error: { code: -32601, message: `unsupported method: ${method}` } };
  }
}
