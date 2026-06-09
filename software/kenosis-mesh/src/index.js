/* kenosis-mesh: Complete 7-node serverless SIC-POVM topology */
"use strict";

// Resolve the correct Durable Object binding for a given target
function bindingNameFor(target) {
  switch (target) {
    case 'R': return 'R_NODE';
    case 'A': return 'ANODE';
    case 'B': return 'BNODE';
    case 'C': return 'CNODE';
    case 'D': return 'DNODE';
    case 'E': return 'ENODE';
    case 'F': return 'FNODE';
    default: throw new Error(`Unknown target node: ${target}`);
  }
}

// Forward an envelope to a target DO
async function forwardTo(env, targetName, envelope) {
  const bindingName = bindingNameFor(targetName);
  const binding = env[bindingName];
  if (!binding) throw new Error(`Missing binding: ${bindingName}`);
  const id = binding.idFromName(targetName);
  const obj = binding.get(id);
  const resp = await obj.fetch('http://internal/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(envelope),
  });
  try { return await resp.json(); } catch { return resp; }
}

// CORS preflight handler
const ALLOWED_ORIGINS = new Set([
  'https://p31ca.org',
  'https://www.p31ca.org',
  'http://localhost:5173',
  'http://localhost:8787',
]);

function handleCors(request) {
  const origin = request.headers.get('Origin');
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };
  }
  return {};
}

// ------------------- Root Node: RNode (The Apex) -------------------
export class RNode {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    if (request.method === 'POST') {
      try {
        const bodyText = await request.text();
        const envelope = JSON.parse(bodyText);

        // Auth check - only for external requests (internal calls come from http://internal/)
        const reqUrl = new URL(request.url);
        const isInternal = reqUrl.hostname === 'internal';
        if (!isInternal) {
          const auth = request.headers.get('Authorization');
          const expected = this.env.AUTH_TOKEN ? `Bearer ${this.env.AUTH_TOKEN}` : null;
          if (!expected || auth !== expected) {
            return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 403 });
          }
        }

        if (envelope.to !== 'R') {
          return new Response(JSON.stringify({ error: 'not-for-R' }), { status: 400 });
        }

        if (envelope.type === 'init') {
          await this.state.storage.put('leaf_results', {});
          const ts = envelope.timestamp ?? Date.now();

          // Forward to A, B, C in parallel
          await Promise.all(['A', 'B', 'C'].map((node) =>
            forwardTo(this.env, node, {
              id: envelope.id,
              from: 'R',
              to: node,
              type: 'init',
              payload: envelope.payload,
              timestamp: ts
            })
          ));

          return new Response(JSON.stringify({ ack: true, session: envelope.id }), { status: 200 });
        }

        if (envelope.type === 'leaf') {
          const leafResults = (await this.state.storage.get('leaf_results')) || {};
          const leaf = envelope.payload?.leaf;
          const data = envelope.payload?.data;
          if (leaf) leafResults[leaf] = data;
          await this.state.storage.put('leaf_results', leafResults);

          if (leafResults.D && leafResults.E && leafResults.F) {
            const final = leafResults;
            await this.state.storage.put('final', final);
            return new Response(JSON.stringify({ done: true, final }), { status: 200 });
          }

          return new Response(JSON.stringify({ ack: true }), { status: 200 });
        }
      } catch (e) {
        console.error('[RNode] Error:', e.message);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }

    // Session status
    if (request.method === 'GET') {
      const url = new URL(request.url);
      if (url.pathname === '/session') {
        const sessionId = url.searchParams.get('id');
        const leafResults = await this.state.storage.get('leaf_results') || {};
        const final = await this.state.storage.get('final');
        return new Response(JSON.stringify({ session: sessionId, leaf_results: leafResults, final: final }), { status: 200 });
      }
    }

    return new Response(JSON.stringify({ node: 'R', status: 'healthy' }), { status: 200 });
  }
}

// ------------------- Inner Trinity: ANODE, BNODE, CNODE -------------------
export class ANODE {
  constructor(state, env) { this.state = state; this.env = env; }
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname === '/message') {
      try {
        const envelope = await request.json();
        if (envelope.to !== 'A') return new Response(JSON.stringify({ error: 'not-for-A' }), { status: 400 });

        const ts = Date.now();
        await Promise.all(['D','E'].map((node) =>
          forwardTo(this.env, node, {
            id: envelope.id,
            from: 'A',
            to: node,
            type: envelope.type || 'init',
            payload: envelope.payload,
            timestamp: ts
          })
        ));
        return new Response(JSON.stringify({ ack: true }), { status: 200 });
      } catch (e) {
        console.error('[ANODE] Error:', e.message);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }
    if (request.method === 'GET' && url.pathname === '/health') {
      return new Response(JSON.stringify({ node: 'A', status: 'healthy' }), { status: 200 });
    }
    return new Response('Not Found', { status: 404 });
  }
}

export class BNODE {
  constructor(state, env) { this.state = state; this.env = env; }
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname === '/message') {
      try {
        const envelope = await request.json();
        if (envelope.to !== 'B') return new Response(JSON.stringify({ error: 'not-for-B' }), { status: 400 });

        await Promise.all(['E','F'].map((node) =>
          forwardTo(this.env, node, {
            id: envelope.id,
            from: 'B',
            to: node,
            type: envelope.type || 'init',
            payload: envelope.payload,
            timestamp: Date.now()
          })
        ));
        return new Response(JSON.stringify({ ack: true }), { status: 200 });
      } catch (e) {
        console.error('[BNODE] Error:', e.message);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }
    if (request.method === 'GET' && url.pathname === '/health') {
      return new Response(JSON.stringify({ node: 'B', status: 'healthy' }), { status: 200 });
    }
    return new Response('Not Found', { status: 404 });
  }
}

export class CNODE {
  constructor(state, env) { this.state = state; this.env = env; }
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname === '/message') {
      try {
        const envelope = await request.json();
        if (envelope.to !== 'C') return new Response(JSON.stringify({ error: 'not-for-C' }), { status: 400 });

        await Promise.all(['D','F'].map((node) =>
          forwardTo(this.env, node, {
            id: envelope.id,
            from: 'C',
            to: node,
            type: envelope.type || 'init',
            payload: envelope.payload,
            timestamp: Date.now()
          })
        ));
        return new Response(JSON.stringify({ ack: true }), { status: 200 });
      } catch (e) {
        console.error('[CNODE] Error:', e.message);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }
    if (request.method === 'GET' && url.pathname === '/health') {
      return new Response(JSON.stringify({ node: 'C', status: 'healthy' }), { status: 200 });
    }
    return new Response('Not Found', { status: 404 });
  }
}

// ------------------- Leaves (D, E, F) -------------------
export class DNODE {
  constructor(state, env) { this.state = state; this.env = env; }
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname === '/message') {
      try {
        const envelope = await request.json();
        if (envelope.to !== 'D') return new Response(JSON.stringify({ error: 'not-for-D' }), { status: 400 });

        const seen = await this.state.storage.get(`seen_${envelope.id}`);
        if (seen) return new Response(JSON.stringify({ ack: true, cached: true }), { status: 200 });
        await this.state.storage.put(`seen_${envelope.id}`, true, { expirationTtl: 86_400 });

        const root = this.env.R_NODE.get(this.env.R_NODE.idFromName('R'));
        await root.fetch('http://internal/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: envelope.id, from: 'D', to: 'R', type: 'leaf', payload: { leaf: 'D', data: `D_proc:${Date.now()}` } })
        });

        return new Response(JSON.stringify({ ack: true }), { status: 200 });
      } catch (e) {
        console.error('[DNODE] Error:', e.message);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }
    if (request.method === 'GET' && url.pathname === '/health') {
      return new Response(JSON.stringify({ node: 'D', status: 'healthy' }), { status: 200 });
    }
    return new Response('Not Found', { status: 404 });
  }
}

export class ENODE {
  constructor(state, env) { this.state = state; this.env = env; }
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname === '/message') {
      try {
        const envelope = await request.json();
        if (envelope.to !== 'E') return new Response(JSON.stringify({ error: 'not-for-E' }), { status: 400 });

        const seen = await this.state.storage.get(`seen_${envelope.id}`);
        if (seen) return new Response(JSON.stringify({ ack: true, cached: true }), { status: 200 });
        await this.state.storage.put(`seen_${envelope.id}`, true, { expirationTtl: 86_400 });

        const root = this.env.R_NODE.get(this.env.R_NODE.idFromName('R'));
        await root.fetch('http://internal/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: envelope.id, from: 'E', to: 'R', type: 'leaf', payload: { leaf: 'E', data: `E_proc:${Date.now()}` } })
        });
        return new Response(JSON.stringify({ ack: true }), { status: 200 });
      } catch (e) {
        console.error('[ENODE] Error:', e.message);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }
    if (request.method === 'GET' && url.pathname === '/health') {
      return new Response(JSON.stringify({ node: 'E', status: 'healthy' }), { status: 200 });
    }
    return new Response('Not Found', { status: 404 });
  }
}

export class FNODE {
  constructor(state, env) { this.state = state; this.env = env; }
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname === '/message') {
      try {
        const envelope = await request.json();
        if (envelope.to !== 'F') return new Response(JSON.stringify({ error: 'not-for-F' }), { status: 400 });

        const seen = await this.state.storage.get(`seen_${envelope.id}`);
        if (seen) return new Response(JSON.stringify({ ack: true, cached: true }), { status: 200 });
        await this.state.storage.put(`seen_${envelope.id}`, true, { expirationTtl: 86_400 });

        const root = this.env.R_NODE.get(this.env.R_NODE.idFromName('R'));
        await root.fetch('http://internal/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: envelope.id, from: 'F', to: 'R', type: 'leaf', payload: { leaf: 'F', data: `F_proc:${Date.now()}` } })
        });
        return new Response(JSON.stringify({ ack: true }), { status: 200 });
      } catch (e) {
        console.error('[FNODE] Error:', e.message);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }
    if (request.method === 'GET' && url.pathname === '/health') {
      return new Response(JSON.stringify({ node: 'F', status: 'healthy' }), { status: 200 });
    }
    return new Response('Not Found', { status: 404 });
  }
}

// ------------------- Public Router -------------------
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = handleCors(request);

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 1. Health Probe
    if (request.method === 'GET' && url.pathname === '/health') {
      const headers = { 'Content-Type': 'application/json', ...corsHeaders };
      return new Response(JSON.stringify({ 
        status: 'kenosis-mesh-edge-healthy',
        topology: 'K4 Complete Graph',
        nodes: ['R','A','B','C','D','E','F']
      }), { status: 200, headers });
    }

    // 2. Message endpoint - forward to RNode DO
    if (request.method === 'POST' && url.pathname === '/message') {
      try {
        const auth = request.headers.get('Authorization');
        const expected = env.AUTH_TOKEN ? `Bearer ${env.AUTH_TOKEN}` : null;
        
        if (!expected || auth !== expected) {
          return new Response(JSON.stringify({ error: 'unauthorized' }), { 
            status: 403, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          });
        }

        const bodyText = await request.text();
        if (!bodyText) throw new Error("Empty body");

        const envelope = JSON.parse(bodyText);
        if (!envelope.to || !envelope.type) throw new Error("Invalid Envelope Structure");

        const root = env.R_NODE;
        const rootId = root.idFromName('R');
        const rootObj = root.get(rootId);

        const doUrl = 'http://internal/message';
        const doResp = await rootObj.fetch(new Request(doUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': auth
          },
          body: bodyText 
        }));
        
        const doText = await doResp.text();
        return new Response(doText, { 
          status: doResp.status, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        });

      } catch (err) {
        console.error('[Mesh] Edge ingress error:', err.message);
        return new Response(JSON.stringify({ 
          error: "Edge Ingress Failure", 
          details: err.message 
        }), { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        });
      }
    }

    // 3. Session status endpoint
    if (request.method === 'GET' && url.pathname === '/session') {
      const sessionId = url.searchParams.get('id');
      if (!sessionId) {
        return new Response(JSON.stringify({ error: 'missing session id' }), { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        });
      }

      const root = env.R_NODE;
      const rootId = root.idFromName('R');
      const rootObj = root.get(rootId);

      const doResp = await rootObj.fetch(new Request('http://internal/session?id=' + sessionId, {
        method: 'GET'
      }));

      const doText = await doResp.text();
      return new Response(doText, { 
        status: doResp.status, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      });
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }
};
