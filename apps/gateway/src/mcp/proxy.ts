import { TOOLS, type ToolName } from './catalog.js';
import { filterTools, isToolAllowed } from './policy.js';
import { getSessionId, getState, setState } from '../state.js';
import { getRequiredScope, hasScope } from './scopes.js';

export type JsonRpcRequest = {
  jsonrpc: '2.0';
  id: number | string | null;
  method: string;
  params?: any;
};

export type JsonRpcResponse = {
  jsonrpc: '2.0';
  id: number | string | null;
  result?: any;
  error?: { code: number; message: string };
};

function errorResponse(id: number | string | null, code: number, message: string): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

function okResponse(id: number | string | null, result: any): JsonRpcResponse {
  return { jsonrpc: '2.0', id, result };
}

function base64UrlDecode(str: string): string {
  const withPlus = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = withPlus.length % 4;
  const padded = pad ? withPlus + '='.repeat(4 - pad) : withPlus;
  const bin = atob(padded);
  return new TextDecoder().decode(new Uint8Array(bin.length).fill(0).map((_, i) => bin.charCodeAt(i)));
}

export function extractDidFromToken(authHeader: string | undefined): { did: string; valid: boolean } {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { did: '', valid: false };
  }
  const token = authHeader.slice(7);
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { did: '', valid: false };
  }
  try {
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    const sub = payload.sub || payload.iss || '';
    if (sub.startsWith('did:')) {
      return { did: sub, valid: true };
    }
    return { did: sub, valid: true };
  } catch {
    return { did: '', valid: false };
  }
}

async function resolveSessionDid(env: any, sid: string): Promise<string> {
  const raw = await env.SESSION_STORE.get(`state:${sid}`);
  if (!raw) return '';
  try {
    const state = JSON.parse(raw) as { did?: string };
    return state.did || '';
  } catch {
    return '';
  }
}

async function callTool(name: string, args: any, c: any): Promise<any> {
  const env = c.env;
  const sid = getSessionId(c);
  const authHeader = c.req.header('Authorization');
  const tokenInfo = extractDidFromToken(authHeader);

  // Scope validation
  const requiredScope = getRequiredScope(name);
  if (requiredScope && authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const parts = token.split('.');
    if (parts.length === 3) {
      try {
        const payload = JSON.parse(base64UrlDecode(parts[1]));
        if (!hasScope(payload, requiredScope)) {
          throw new Error(`Token missing required scope: ${requiredScope}`);
        }
      } catch (e: any) {
        if (e.message?.startsWith('Token missing required scope')) throw e;
      }
    }
  }

  // Check token revocation
  if (authHeader?.startsWith('Bearer ') && c.env.TOKEN_BLACKLIST) {
    const tokenHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(authHeader.slice(7)));
    const hashHex = Array.from(new Uint8Array(tokenHash)).map(b => b.toString(16).padStart(2, '0')).join('');
    const revoked = await c.env.TOKEN_BLACKLIST.get(`revoked:${hashHex}`);
    if (revoked) throw new Error('Token has been revoked');
  }

  let sessionDid = await resolveSessionDid(env, sid);

  if (tokenInfo.valid && tokenInfo.did) {
    if (!sessionDid) {
      await setState(env, sid, { did: tokenInfo.did });
      sessionDid = tokenInfo.did;
    } else if (sessionDid !== tokenInfo.did) {
      throw new Error('Token DID mismatch with session identity');
    }
  }

  const identityHeaders: Record<string, string> = {};
  if (authHeader) identityHeaders['Authorization'] = authHeader;
  if (sessionDid) identityHeaders['X-User-DID'] = sessionDid;

  switch (name as ToolName) {
    case 'getLoveBalance': {
      const st = await getState(env, sid);
      return { loveBalance: st.loveBalance };
    }
    case 'setSpoonLevel': {
      const level = Math.max(0, Math.min(5, Number(args.level) ?? 3));
      const st = await setState(env, sid, { spoonLevel: level });
      return { spoonLevel: st.spoonLevel };
    }
    case 'getState': {
      const st = await getState(env, sid);
      return {
        sessionId: st.sessionId,
        spoonLevel: st.spoonLevel,
        trustTier: st.trustTier,
        loveBalance: st.loveBalance,
        did: st.did,
        updatedAt: st.updatedAt,
      };
    }
    case 'getTrustTier': {
      const st = await getState(env, sid);
      return { trustTier: st.trustTier };
    }
    case 'aiProxy': {
      const { prompt, model = 'default', maxTokens = 512 } = args || {};
      if (!prompt || typeof prompt !== 'string') throw new Error('prompt is required');
      const target = new URL(c.req.url);
      target.pathname = '/v1/chat/completions';
      const headers: Record<string, string> = { 'Content-Type': 'application/json', ...identityHeaders };
      const res = await c.env.phos_ai_proxy.fetch(target, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: maxTokens }),
      });
      const data = await res.json() as { choices?: Array<{ message?: { content?: string } }>; usage?: any };
      const text = data?.choices?.[0]?.message?.content || '';
      return { text, model, usage: data?.usage ?? null };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function auditLog(env: any, entry: {
  requestId: string;
  sessionId: string;
  did: string;
  toolName: string;
  args: any;
  result: any;
  error: string | null;
  trustTier: string;
  allowed: boolean;
  upstreamStatus: number;
}) {
  try {
    await env.p31_audit.prepare(
      `INSERT INTO audit_logs (id, request_id, session_id, did, tool_name, arguments, result, error, trust_tier, allowed, timestamp, upstream_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      crypto.randomUUID(),
      entry.requestId,
      entry.sessionId,
      entry.did || null,
      entry.toolName,
      JSON.stringify(entry.args),
      entry.result ? JSON.stringify(entry.result) : null,
      entry.error,
      entry.trustTier || null,
      entry.allowed ? 1 : 0,
      Date.now(),
      entry.upstreamStatus
    ).run();
  } catch (err) {
    console.error('[Audit Log Failure]', err);
  }
}

export async function handleMcp(c: any): Promise<Response> {
  const origin = c.req.header('Origin') || '';
  const sessionId = getSessionId(c);

  if (c.req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Session-ID', ...(origin ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true' } : {}) } });
  }

  if (c.req.method !== 'POST') {
    return new Response(JSON.stringify(errorResponse(null, -32601, 'Method not allowed')), { status: 405, headers: { 'Content-Type': 'application/json', ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}) } });
  }

  let req: JsonRpcRequest;
  try {
    req = await c.req.json();
  } catch {
    return new Response(JSON.stringify(errorResponse(null, -32700, 'Parse error')), { status: 400, headers: { 'Content-Type': 'application/json', ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}) } });
  }

  const isNotification = !('id' in req);
  const id = req.id ?? null;
  const method = req.method;
  const params = req.params ?? {};

  if (method === 'initialize') {
    return new Response(JSON.stringify(okResponse(id, {
      protocolVersion: '2026-07-28',
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: 'p31-gateway-mcp', version: '1.0.0' },
    })), { headers: { 'Content-Type': 'application/json', ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}) } });
  }

  if (method === 'tools/list') {
    let trustTier: string | undefined;
    if (sessionId) {
      const raw = await c.env.SESSION_STORE.get(`state:${sessionId}`);
      if (raw) {
        const state = JSON.parse(raw) as { trustTier?: string };
        trustTier = state.trustTier;
      }
    }
    const filteredTools = filterTools(TOOLS, trustTier);
    return new Response(JSON.stringify(okResponse(id, { tools: filteredTools })), { headers: { 'Content-Type': 'application/json', ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}) } });
  }

  if (method === 'tools/call') {
    const name = params?.name;
    const args = params?.arguments ?? {};
    const requestId = c.req.header('X-Request-ID') || crypto.randomUUID();

    if (!name || !TOOLS.find(t => t.name === name)) {
      await auditLog(c.env, {
        requestId,
        sessionId,
        did: '',
        toolName: name || 'unknown',
        args,
        result: null,
        error: 'Tool not found',
        trustTier: '',
        allowed: false,
        upstreamStatus: 0,
      });
      return new Response(JSON.stringify(errorResponse(id, -32601, `Tool not found: ${name}`)), { headers: { 'Content-Type': 'application/json', ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}) } });
    }

    let trustTier: string | undefined;
    let sessionDid = '';
    if (sessionId) {
      const raw = await c.env.SESSION_STORE.get(`state:${sessionId}`);
      if (raw) {
        const state = JSON.parse(raw) as { trustTier?: string; did?: string };
        trustTier = state.trustTier;
        sessionDid = state.did || '';
      }
    }
    const allowed = isToolAllowed(name, trustTier);
    if (!allowed) {
      await auditLog(c.env, {
        requestId,
        sessionId,
        did: sessionDid,
        toolName: name,
        args,
        result: null,
        error: `Tool "${name}" is not allowed for trust tier ${trustTier || 'none'}`,
        trustTier: trustTier || '',
        allowed: false,
        upstreamStatus: 0,
      });
      return new Response(JSON.stringify(errorResponse(id, -403, `Tool "${name}" is not allowed for trust tier ${trustTier || 'none'}`)), { status: 403, headers: { 'Content-Type': 'application/json', ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}) } });
    }

    try {
      const result = await callTool(name, args, c);
      let postTrustTier = trustTier;
      let postDid = sessionDid;
      if (sessionId) {
        const raw = await c.env.SESSION_STORE.get(`state:${sessionId}`);
        if (raw) {
          const state = JSON.parse(raw) as { trustTier?: string; did?: string };
          postTrustTier = state.trustTier || trustTier;
          postDid = state.did || sessionDid;
        }
      }
      await auditLog(c.env, {
        requestId,
        sessionId,
        did: postDid,
        toolName: name,
        args,
        result,
        error: null,
        trustTier: postTrustTier || '',
        allowed: true,
        upstreamStatus: 200,
      });
      return new Response(JSON.stringify(okResponse(id, { content: [{ type: 'text', text: JSON.stringify(result) }] })), { headers: { 'Content-Type': 'application/json', ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}) } });
    } catch (e: any) {
      await auditLog(c.env, {
        requestId,
        sessionId,
        did: sessionDid,
        toolName: name,
        args,
        result: null,
        error: e.message || 'Tool error',
        trustTier: trustTier || '',
        allowed: true,
        upstreamStatus: 0,
      });
      return new Response(JSON.stringify(errorResponse(id, -32603, e.message || 'Tool error')), { headers: { 'Content-Type': 'application/json', ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}) } });
    }
  }

  if (isNotification) {
    return new Response(null, {
      status: 202,
      headers: { ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}) },
    });
  }

  return new Response(JSON.stringify(errorResponse(id, -32601, `Method not found: ${method}`)), { headers: { 'Content-Type': 'application/json', ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}) } });
}
