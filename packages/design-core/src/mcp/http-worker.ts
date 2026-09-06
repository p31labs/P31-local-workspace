/**
 * @file P31 Design System MCP Server — Cloudflare Worker (HTTP transport).
 *
 * Exposes the same tools as the stdio server, but over HTTP JSON-RPC 2.0.
 * Deploy with: wrangler deploy
 *
 * Routes:
 *   POST /mcp   — JSON-RPC 2.0 endpoint (1 MB body limit)
 *   GET  /health — health check
 *   GET  /       — service info (version, tool count, docs link)
 *   *              — 404 with help text
 */

import { handleToolCall } from './tools.worker.js';
import { MCP_TOOLS, SERVER_NAME, SERVER_VERSION } from './tool-registry.js';
import type { McpRequest, McpResponse } from './shared.js';

export interface Env {
  // No bindings needed for core tools
  // Add KV/D1 bindings here if needed for future tools
}

// ─── Constants ────────────────────────────────────────────────────────────

const BODY_LIMIT = 1024 * 1024;

const ALLOWED_ORIGINS = new Set([
  'https://design.p31ca.org',
  'https://p31ca.org',
  'https://phosphorus31.org',
  'https://bonding.p31ca.org',
  'https://willow.p31ca.org',
]);

/**
 * Per-isolate token-bucket rate limiter (no external state).
 * 60 requests per 60-second window per IP. Returns true if allowed.
 */
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_TOKENS = 60;
const rateBuckets = new Map<string, { tokens: number; reset: number }>();

function allowRate(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now > bucket.reset) {
    rateBuckets.set(ip, { tokens: RATE_MAX_TOKENS - 1, reset: now + RATE_WINDOW_MS });
    return true;
  }
  if (bucket.tokens <= 0) return false;
  bucket.tokens--;
  return true;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Returns true if the origin should receive CORS headers. */
function originAllowed(origin: string | null): boolean {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    const host = url.host;
    if (
      ALLOWED_ORIGINS.has(origin) ||
      host.endsWith('.pages.dev') ||
      host.endsWith('.workers.dev') ||
      host === 'localhost' ||
      host === '127.0.0.1'
    ) {
      return true;
    }
  } catch {
    // Not a URL
  }
  return false;
}

function corsHeaders(requestOrigin: string | null): Record<string, string> {
  const headers: Record<string, string> = {};
  if (originAllowed(requestOrigin)) {
    headers['Access-Control-Allow-Origin'] = requestOrigin!;
    headers['Vary'] = 'Origin';
  }
  headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS, GET, HEAD';
  headers['Access-Control-Allow-Headers'] = 'Content-Type';
  return headers;
}

function jsonResponse(body: any, status = 200, requestOrigin: string | null = null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(requestOrigin),
    },
  });
}

function handleMcpRequest(body: McpRequest, requestId: string): McpResponse {
  const { jsonrpc, id, method, params } = body;

  const reqId = id ?? requestId;

  if (jsonrpc !== '2.0') {
    return {
      jsonrpc: '2.0',
      id: reqId,
      error: { code: -32600, message: 'Invalid Request: jsonrpc must be "2.0"' },
    };
  }

  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id: reqId,
      result: {
        tools: MCP_TOOLS,
      },
    };
  }

  if (method === 'tools/call') {
    if (!params?.name) {
      return {
        jsonrpc: '2.0',
        id: reqId,
        error: { code: -32600, message: 'Invalid Request: params.name is required' },
      };
    }

    try {
      const result = handleToolCall(params.name, params.arguments || {});

      if (result.isError) {
        return {
          jsonrpc: '2.0',
          id: reqId,
          result: {
            content: result.content,
            isError: true,
          },
        };
      }

      return {
        jsonrpc: '2.0',
        id: reqId,
        result: { content: result.content },
      };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: reqId,
        error: {
          code: -32000,
          message: `Internal error: ${error instanceof Error ? error.message : String(error)}`,
        },
      };
    }
  }

  return {
    jsonrpc: '2.0',
    id: reqId,
    error: { code: -32601, message: `Method not found: ${method}` },
  };
}

// ─── Worker Export ──────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const requestOrigin = request.headers.get('Origin') || null;

    // ── Rate limiting ───────────────────────────────────────────────────────
    const ip = request.headers.get('CF-Connecting-IP') || 'anonymous';
    if (!allowRate(ip)) {
      return jsonResponse(
        { jsonrpc: '2.0', id: null, error: { code: -32300, message: 'Rate limit exceeded. Try again later.' } },
        429,
        requestOrigin,
      );
    }

    // ── CORS preflight ─────────────────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(requestOrigin),
      });
    }

    // ── Health check ───────────────────────────────────────────────────────
    if (url.pathname === '/health' && request.method === 'GET') {
      return jsonResponse(
        {
          status: 'ok',
          service: SERVER_NAME,
          version: SERVER_VERSION,
          tools: MCP_TOOLS.length,
        },
        200,
        requestOrigin,
      );
    }

    // ── Root service-info ───────────────────────────────────────────────────
    if (url.pathname === '/' && request.method === 'GET') {
      return jsonResponse(
        {
          jsonrpc: '2.0',
          name: SERVER_NAME,
          version: SERVER_VERSION,
          description: 'P31 Design System MCP Server',
          endpoint: 'POST /mcp',
          tools: MCP_TOOLS.map(t => t.name),
          tool_count: MCP_TOOLS.length,
          docs: 'https://design.p31ca.org',
        },
        200,
        requestOrigin,
      );
    }

    // ── MCP endpoint ───────────────────────────────────────────────────────
    if (url.pathname === '/mcp') {
      if (request.method === 'GET' || request.method === 'HEAD') {
        return jsonResponse(
          {
            jsonrpc: '2.0',
            error: { code: -32600, message: 'Use POST to send JSON-RPC requests to this endpoint.' },
            result: {
              method: 'POST',
              endpoint: '/mcp',
              contentType: 'application/json',
              bodyExample: {
                jsonrpc: '2.0',
                id: 1,
                method: 'tools/call',
                params: { name: 'list_tokens', arguments: {} },
              },
            },
          },
          405,
          requestOrigin,
        );
      }

      if (request.method !== 'POST') {
        return jsonResponse(
          { error: 'Method not allowed. Use POST.' },
          405,
          requestOrigin,
        );
      }

      // Body size limit
      const contentLength = request.headers.get('Content-Length');
      if (contentLength && Number(contentLength) > BODY_LIMIT) {
        return jsonResponse(
          { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Payload too large. Max 1 MB.' } },
          413,
          requestOrigin,
        );
      }

      let body: any;
      const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      let rawText = '';
      try {
        rawText = await request.text();
        if (rawText.length > BODY_LIMIT) {
          return jsonResponse(
            { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Payload too large. Max 1 MB.' } },
            413,
            requestOrigin,
          );
        }
        body = JSON.parse(rawText);
      } catch (error) {
        let reqId: string | number | null = null;
        const idMatch = rawText?.match(/"id"\s*:\s*(\d+|"[^"]*")/);
        if (idMatch) {
          const raw = idMatch[1];
          reqId = raw.startsWith('"') ? raw.slice(1, -1) : Number(raw);
        }
        return jsonResponse(
          {
            jsonrpc: '2.0',
            id: reqId,
            error: {
              code: -32700,
              message: `Parse error: ${error instanceof Error ? error.message : String(error)}`,
            },
          },
          400,
          requestOrigin,
        );
      }

      const response = handleMcpRequest(body, requestId);
      return jsonResponse(response, 200, requestOrigin);
    }

    // ── 404 ──────────────────────────────────────────────────────────────────
    return jsonResponse(
      {
        error: 'Not found',
        hint: 'POST /mcp for MCP JSON-RPC 2.0 endpoint.',
      },
      404,
      requestOrigin,
    );
  },
};
