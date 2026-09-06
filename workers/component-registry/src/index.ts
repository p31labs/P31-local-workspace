/**
 * P31 Component Registry — Cloudflare Worker
 * Exposes the component registry over MCP over HTTP
 * 
 * Endpoints:
 *   POST /mcp — MCP JSON-RPC endpoint
 *   GET /health — Health check
 *   GET /components — List all components (simplified)
 *   GET /components/:name — Get component by name
 *   GET /tokens — Get all design tokens
 * 
 * Deploy: npx wrangler deploy
 * Custom domain: registry.p31ca.org
 */

import { COMPONENTS, TOKEN_REFERENCE, TOOLS, executeTool } from './registry';

interface Env {
  // No bindings needed for basic registry
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    // CORS headers for browser access
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    };

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (url.pathname === '/health' && method === 'GET') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          version: '1.0.0',
          components: COMPONENTS.length,
          tools: TOOLS.length,
          timestamp: new Date().toISOString(),
        }),
        { headers: corsHeaders }
      );
    }

    // Simplified components list (no MCP required)
    if (url.pathname === '/components' && method === 'GET') {
      return new Response(
        JSON.stringify({
          components: COMPONENTS.map(c => ({
            name: c.name,
            description: c.description,
            tokens: c.tokens,
          })),
          total: COMPONENTS.length,
        }),
        { headers: corsHeaders }
      );
    }

    // Get component by name
    if (url.pathname.startsWith('/components/') && method === 'GET') {
      const name = url.pathname.replace('/components/', '');
      const comp = COMPONENTS.find(c => c.name.toLowerCase() === name.toLowerCase());
      if (!comp) {
        return new Response(
          JSON.stringify({ error: `Component "${name}" not found` }),
          { status: 404, headers: corsHeaders }
        );
      }
      return new Response(JSON.stringify({ component: comp, status: 'ok' }), { headers: corsHeaders });
    }

    // Get tokens
    if (url.pathname === '/tokens' && method === 'GET') {
      return new Response(JSON.stringify({ tokens: TOKEN_REFERENCE, status: 'ok' }), { headers: corsHeaders });
    }

    // MCP endpoint
    if (url.pathname === '/mcp' && method === 'POST') {
      try {
        const body = await request.json() as any;
        const rpcMethod = body.method;
        const id = body.id;
        const params = body.params || {};

        let result: any;

        switch (rpcMethod) {
          case 'tools/list':
            result = { tools: TOOLS };
            break;

          case 'tools/call': {
            const toolName = params?.name;
            const toolArgs = params?.arguments || {};
            const tool = TOOLS.find(t => t.name === toolName);
            if (!tool) {
              return new Response(
                JSON.stringify({
                  jsonrpc: '2.0',
                  id,
                  error: { code: -32602, message: `Unknown tool: ${toolName}` },
                }),
                { headers: corsHeaders }
              );
            }
            try {
              const toolResult = executeTool(toolName, toolArgs);
              result = {
                content: [{ type: 'text', text: JSON.stringify(toolResult, null, 2) }],
              };
            } catch (e: any) {
              result = {
                content: [{ type: 'text', text: JSON.stringify({ error: e.message, status: 'error' }) }],
                isError: true,
              };
            }
            break;
          }

          case 'ping':
            result = {};
            break;

          default:
            return new Response(
              JSON.stringify({
                jsonrpc: '2.0',
                id,
                error: { code: -32601, message: `Method not found: ${rpcMethod}` },
              }),
              { headers: corsHeaders }
            );
        }

        return new Response(
          JSON.stringify({ jsonrpc: '2.0', id, result }),
          { headers: corsHeaders }
        );
      } catch (e: any) {
        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: { code: -32700, message: `Parse error: ${e.message}` },
          }),
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // 404 for unknown routes
    return new Response('Not found', { status: 404, headers: corsHeaders });
  },
};
