/**
 * Unified k4-cage — CWP-30
 * K4Topology DO (family graph) + FamilyMeshRoom DO (WebSocket hibernation + D1 flush).
 * P31 Labs, Inc. | EIN 42-1888158
 *
 * REST topology: /api/mesh, /api/vertex/:id, /api/presence/:id, /api/ping/:from/:to, /api/edge/:a/:b
 * WebSocket: /ws/:roomId?node=<id>
 * Room stats: /room-stats/:roomId
 * Telemetry: GET/POST /api/telemetry (D1 when DB bound; else KV chain like legacy)
 *
 * Deploy: set database_id in wrangler.toml, run schema.sql, wrangler secret put ADMIN_TOKEN, deploy.
 */
import { DurableObject } from 'cloudflare:workers';

const VERTICES = ['will', 'sj', 'wj', 'christyn'];
const EDGES = [
  ['will', 'sj'],
  ['will', 'wj'],
  ['will', 'christyn'],
  ['sj', 'wj'],
  ['sj', 'christyn'],
  ['wj', 'christyn'],
];

const VERTEX_NAMES = {
  will: 'Will',
  sj: 'S.J.',
  wj: 'W.J.',
  christyn: 'Christyn',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'cross-origin',
};

function edgeKey(v1, v2) {
  return [v1, v2].sort().join('-');
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS },
  });
}

function err(message, status = 400) {
  return json({ error: message, timestamp: new Date().toISOString() }, status);
}

function isValidVertex(v) {
  return VERTICES.includes(v);
}

function isValidEdge(v1, v2) {
  return isValidVertex(v1) && isValidVertex(v2) && v1 !== v2;
}

function isAdmin(request, env) {
  const token = env.ADMIN_TOKEN;
  if (!token) return false;
  const auth = request.headers.get('Authorization');
  const url = new URL(request.url);
  const q = url.searchParams.get('token');
  return auth === `Bearer ${token}` || q === token;
}

async function sha256Hex(input) {
  const msg =
    typeof input === 'string' ? input : JSON.stringify(input);
  const buf = new TextEncoder().encode(msg);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ─── KV telemetry (fallback / legacy WCD-46) ─────────────────────────
async function appendTelemetryKv(env, event) {
  const headRaw = await env.K4_MESH.get('telemetry:head');
  const head = headRaw ? JSON.parse(headRaw) : { index: 0, hash: '0'.repeat(64) };
  const newIndex = head.index + 1;
  const payload = {
    index: newIndex,
    event,
    timestamp: new Date().toISOString(),
    prevHash: head.hash,
  };
  const newHash = await sha256Hex(JSON.stringify(payload) + head.hash);
  payload.hash = newHash;
  await env.K4_MESH.put(`telemetry:${newIndex}`, JSON.stringify(payload));
  await env.K4_MESH.put('telemetry:head', JSON.stringify({ index: newIndex, hash: newHash }));
  return payload;
}

async function getTelemetryKvChain(env, count) {
  const headRaw = await env.K4_MESH.get('telemetry:head');
  if (!headRaw) {
    return { chain: [], head: null, verified: true, source: 'kv' };
  }
  const head = JSON.parse(headRaw);
  const chain = [];
  for (let i = head.index; i > Math.max(0, head.index - count); i--) {
    const raw = await env.K4_MESH.get(`telemetry:${i}`);
    if (raw) chain.push(JSON.parse(raw));
  }
  let verified = true;
  for (let i = 0; i < chain.length - 1; i++) {
    if (chain[i].prevHash !== chain[i + 1].hash) {
      verified = false;
      break;
    }
  }
  return { chain, head, verified, chainLength: head.index, source: 'kv' };
}

async function appendTelemetryD1(env, event) {
  const row = await env.DB.prepare(
    'SELECT hash FROM telemetry ORDER BY id DESC LIMIT 1',
  ).first();
  const prevHash = row?.hash ?? '0'.repeat(64);
  const base = {
    room_id: 'k4-cage',
    node_id: 'system',
    kind: 'event',
    payload: JSON.stringify(event),
    ts: Date.now(),
    prev_hash: prevHash,
  };
  const hash = await sha256Hex({ ...base, prevHash });
  const flushed_at = Date.now();
  await env.DB.prepare(
    `INSERT INTO telemetry (room_id, node_id, kind, payload, ts, hash, prev_hash, flushed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      base.room_id,
      base.node_id,
      base.kind,
      base.payload,
      base.ts,
      hash,
      prevHash,
      flushed_at,
    )
    .run();
  return { hash, prevHash, source: 'd1' };
}

/** @param {import('./index.js').Env} env */
async function broadcastPingToRooms(env, pingPayload) {
  const token = env.INTERNAL_FANOUT_TOKEN;
  if (!token) return;
  const rooms = (env.MESH_ROOM_IDS || 'family-mesh').split(',').map((s) => s.trim()).filter(Boolean);
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  for (const roomId of rooms) {
    const id = env.FAMILY_MESH_ROOM.idFromName(roomId);
    const stub = env.FAMILY_MESH_ROOM.get(id);
    try {
      await stub.fetch(
        new Request('https://internal/broadcast', {
          method: 'POST',
          headers,
          body: JSON.stringify(pingPayload),
        }),
      );
    } catch {
      /* non-fatal */
    }
  }
}

// ═══ K4Topology DO ═══════════════════════════════════════════════════
export class K4Topology extends DurableObject {
  /** @param {DurableObjectState} ctx @param {Env} env */
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx = ctx;
    this.env = env;
  }

  defaultVertex(id) {
    return {
      id,
      name: VERTEX_NAMES[id] || id,
      love: 0,
      status: 'offline',
      lastSeen: null,
      heartbeat: null,
      metadata: {},
    };
  }

  defaultEdge(v1, v2) {
    const key = edgeKey(v1, v2);
    return {
      vertices: [v1, v2],
      key,
      love: 0,
      pings: [],
      lastActivity: null,
      messageCount: 0,
    };
  }

  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (path === '/mesh' && method === 'HEAD') {
      return new Response(null, {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    if (path === '/mesh' && method === 'GET') {
      const vertices = {};
      const edges = {};
      let totalLove = 0;
      for (const v of VERTICES) {
        const raw = await this.ctx.storage.get(`vertex:${v}`);
        vertices[v] = raw ? JSON.parse(raw) : this.defaultVertex(v);
        totalLove += vertices[v].love || 0;
      }
      for (const [a, b] of EDGES) {
        const k = edgeKey(a, b);
        const raw = await this.ctx.storage.get(`edge:${k}`);
        edges[k] = raw ? JSON.parse(raw) : this.defaultEdge(a, b);
        totalLove += edges[k].love || 0;
      }
      const qFactor = 1;
      return Response.json({
        topology: 'K4',
        vertices: 4,
        edges: 6,
        rigidity: 'isostatic',
        betti_2: 1,
        mesh: { vertices, edges },
        totalLove,
        qFactor,
        routing_protocol: 'custom_dsdv',
        timestamp: new Date().toISOString(),
        signature: 'Ca₉(PO₄)₆',
      });
    }

    const vertexGet = path.match(/^\/vertex\/(\w+)$/);
    if (vertexGet && method === 'GET') {
      const id = vertexGet[1];
      if (!isValidVertex(id)) return Response.json({ error: 'Unknown vertex' }, { status: 404 });
      const raw = await this.ctx.storage.get(`vertex:${id}`);
      const vertex = raw ? JSON.parse(raw) : this.defaultVertex(id);
      const connectedEdges = {};
      for (const [v1, v2] of EDGES) {
        if (v1 === id || v2 === id) {
          const k = edgeKey(v1, v2);
          const er = await this.ctx.storage.get(`edge:${k}`);
          connectedEdges[k] = er ? JSON.parse(er) : this.defaultEdge(v1, v2);
        }
      }
      return Response.json({ vertex, edges: connectedEdges });
    }

    const presence = path.match(/^\/presence\/(\w+)$/);
    if (presence && method === 'POST') {
      const id = presence[1];
      if (!isValidVertex(id)) return Response.json({ error: 'Unknown vertex' }, { status: 404 });
      const body = await request.json().catch(() => ({}));
      const raw = await this.ctx.storage.get(`vertex:${id}`);
      const vertex = raw ? JSON.parse(raw) : this.defaultVertex(id);
      vertex.status = body.status || 'online';
      vertex.lastSeen = new Date().toISOString();
      vertex.heartbeat = Date.now();
      if (body.metadata) vertex.metadata = { ...vertex.metadata, ...body.metadata };
      await this.ctx.storage.put(`vertex:${id}`, JSON.stringify(vertex));
      return Response.json({ vertex, recorded: true });
    }

    const ping = path.match(/^\/ping\/(\w+)\/(\w+)$/);
    if (ping && method === 'POST') {
      const from = ping[1];
      const to = ping[2];
      if (!isValidEdge(from, to)) return Response.json({ error: 'Invalid edge' }, { status: 400 });
      const body = await request.json().catch(() => ({}));
      const emoji = typeof body.emoji === 'string' && body.emoji.length < 32 ? body.emoji : '💚';
      const k = edgeKey(from, to);
      const eraw = await this.ctx.storage.get(`edge:${k}`);
      const edge = eraw ? JSON.parse(eraw) : this.defaultEdge(from, to);
      const pingObj = {
        from,
        to,
        emoji,
        timestamp: new Date().toISOString(),
        id: crypto.randomUUID(),
      };
      edge.pings = [pingObj, ...(edge.pings || [])].slice(0, 50);
      edge.love = (edge.love || 0) + 1;
      edge.lastActivity = pingObj.timestamp;
      edge.messageCount = (edge.messageCount || 0) + 1;

      const fromRaw = await this.ctx.storage.get(`vertex:${from}`);
      const toRaw = await this.ctx.storage.get(`vertex:${to}`);
      const fromV = fromRaw ? JSON.parse(fromRaw) : this.defaultVertex(from);
      const toV = toRaw ? JSON.parse(toRaw) : this.defaultVertex(to);
      fromV.love = (fromV.love || 0) + 1;
      toV.love = (toV.love || 0) + 1;

      await this.ctx.storage.put(`edge:${k}`, JSON.stringify(edge));
      await this.ctx.storage.put(`vertex:${from}`, JSON.stringify(fromV));
      await this.ctx.storage.put(`vertex:${to}`, JSON.stringify(toV));

      return Response.json({
        ping: pingObj,
        edge: { love: edge.love, lastActivity: edge.lastActivity },
        fromLove: fromV.love,
        toLove: toV.love,
      });
    }

    const edgeGet = path.match(/^\/edge\/(\w+)\/(\w+)$/);
    if (edgeGet && method === 'GET') {
      const v1 = edgeGet[1];
      const v2 = edgeGet[2];
      if (!isValidEdge(v1, v2)) return Response.json({ error: 'Invalid edge' }, { status: 400 });
      const k = edgeKey(v1, v2);
      const eraw = await this.ctx.storage.get(`edge:${k}`);
      return Response.json(eraw ? JSON.parse(eraw) : this.defaultEdge(v1, v2));
    }

    return Response.json({ error: 'Unknown topology route' }, { status: 404 });
  }
}

// ═══ FamilyMeshRoom DO ═══════════════════════════════════════════════
export class FamilyMeshRoom extends DurableObject {
  /** @param {DurableObjectState} ctx @param {Env} env */
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx = ctx;
    this.env = env;
    this.pendingTelemetry = [];
    this.flushBatchSize = 100;
    this.flushIntervalMs = 30_000;
    this.roomId = 'family-mesh';
  }

  scheduleFlush() {
    void this.ctx.storage.getAlarm().then((t) => {
      if (t == null) {
        void this.ctx.storage.setAlarm(Date.now() + this.flushIntervalMs);
      }
    });
  }

  broadcastJson(obj, excludeTags) {
    const msg = JSON.stringify(obj);
    for (const ws of this.ctx.getWebSockets()) {
      const tags = this.ctx.getTags(ws);
      const nodeId = tags[0];
      if (excludeTags && nodeId === excludeTags) continue;
      try {
        ws.send(msg);
      } catch {
        try {
          this.ctx.deleteWebSocket(ws);
        } catch {
          /* ignore */
        }
      }
    }
  }

  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    this.roomId = url.searchParams.get('room') || this.roomId;

    if (path === '/stats' && request.method === 'GET') {
      const sockets = this.ctx.getWebSockets();
      return Response.json({
        connections: sockets.length,
        pendingTelemetry: this.pendingTelemetry.length,
        roomId: this.roomId,
      });
    }

    if (path === '/broadcast' && request.method === 'POST') {
      const token = this.env.INTERNAL_FANOUT_TOKEN;
      const auth = request.headers.get('Authorization');
      if (token && auth !== `Bearer ${token}`) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const body = await request.json().catch(() => ({}));
      this.broadcastJson(body, null);
      return Response.json({ ok: true, broadcast: true });
    }

    if (request.headers.get('Upgrade') !== 'websocket') {
      return Response.json({ error: 'Expected WebSocket upgrade' }, { status: 400 });
    }

    const nodeId =
      url.searchParams.get('node')?.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) ||
      `anon-${crypto.randomUUID().slice(0, 8)}`;

    const sockets = this.ctx.getWebSockets();
    if (sockets.length >= 32) {
      return new Response('Room full', { status: 503 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server, [nodeId]);

    server.send(
      JSON.stringify({
        type: 'joined',
        userId: nodeId,
        room: this.roomId,
        ts: Date.now(),
      }),
    );
    this.broadcastJson({ type: 'user_joined', userId: nodeId, ts: Date.now() }, nodeId);
    this.scheduleFlush();

    return new Response(null, { status: 101, webSocket: client });
  }

  /** @param {WebSocket} ws @param {string | ArrayBuffer} message */
  async webSocketMessage(ws, message) {
    const tags = this.ctx.getTags(ws);
    const nodeId = tags[0] || 'unknown';
    let data;
    const text = typeof message === 'string' ? message : new TextDecoder().decode(message);
    try {
      data = JSON.parse(text);
    } catch {
      data = { type: 'raw', content: text };
    }

    if (data.type === 'ping' && data.content === 'ping') {
      ws.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
      return;
    }

    const payload = { ...data, sender: nodeId, ts: Date.now() };
    this.broadcastJson(payload, nodeId);
    if (this.env.DB) {
      this.pendingTelemetry.push({
        room_id: this.roomId,
        node_id: nodeId,
        kind: String(data.type || 'message').slice(0, 64),
        payload: JSON.stringify(payload),
        ts: Date.now(),
      });
      this.scheduleFlush();
    }
  }

  /** @param {WebSocket} ws */
  async webSocketClose(ws) {
    const tags = this.ctx.getTags(ws);
    const nodeId = tags[0] || 'unknown';
    this.broadcastJson({ type: 'user_left', userId: nodeId, ts: Date.now() }, null);
  }

  async alarm() {
    const db = this.env.DB;
    if (this.pendingTelemetry.length > 0 && db) {
      const batch = this.pendingTelemetry.splice(0, this.flushBatchSize);
      let prevRow = await this.ctx.storage.get('d1_chain_head');
      let prevHash = typeof prevRow === 'string' ? prevRow : '0'.repeat(64);

      const statements = [];
      for (const row of batch) {
        const hashInput = { ...row, prevHash };
        const hash = await sha256Hex(hashInput);
        const flushed_at = Date.now();
        statements.push(
          db
            .prepare(
              `INSERT INTO telemetry (room_id, node_id, kind, payload, ts, hash, prev_hash, flushed_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            )
            .bind(
              row.room_id,
              row.node_id,
              row.kind,
              row.payload,
              row.ts,
              hash,
              prevHash,
              flushed_at,
            ),
        );
        prevHash = hash;
      }
      try {
        await db.batch(statements);
        await this.ctx.storage.put('d1_chain_head', prevHash);
      } catch {
        this.pendingTelemetry.unshift(...batch);
      }
    }

    if (this.pendingTelemetry.length > 0 || this.ctx.getWebSockets().length > 0) {
      await this.ctx.storage.setAlarm(Date.now() + this.flushIntervalMs);
    }
  }
}

// ═══ Worker router ═════════════════════════════════════════════════════
/** @typedef {{ K4_TOPOLOGY: DurableObjectNamespace, FAMILY_MESH_ROOM: DurableObjectNamespace, K4_MESH: KVNamespace, DB?: D1Database, ADMIN_TOKEN?: string, INTERNAL_FANOUT_TOKEN?: string, MESH_ROOM_IDS?: string, WORKER_VERSION?: string, TOPOLOGY?: string, ENVIRONMENT?: string }} Env */

/**
 * @param {Request} request
 * @param {Env} env
 * @param {string} path e.g. /api/mesh
 * @param {string} method
 */
async function topologyFetch(request, env, path, method) {
  const id = env.K4_TOPOLOGY.idFromName('family');
  const stub = env.K4_TOPOLOGY.get(id);
  const internalPath = path.replace(/^\/api/, '') || '/';
  return stub.fetch(
    new Request(`https://topology${internalPath}`, {
      method,
      headers: request.headers,
      body: method !== 'GET' && method !== 'HEAD' ? request.body : undefined,
    }),
  );
}

export default {
  /** @param {Request} request @param {Env} env */
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      if (path === '/' || path === '') {
        return new Response(
          `<!DOCTYPE html><html><head><meta charset="utf-8"><title>K4 Cage</title></head><body><pre>k4-cage unified\nGET /api/mesh\nWS /ws/family-mesh?node=…\n</pre></body></html>`,
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
        );
      }

      if (path === '/health' || path === '/api/health') {
        const meshR = await topologyFetch(request, env, '/api/mesh', 'GET').catch(() => null);
        let topologySummary = null;
        if (meshR && meshR.ok) topologySummary = await meshR.json();
        return json({
          ok: true,
          service: 'k4-cage-unified',
          workerVersion: env.WORKER_VERSION || '2.0.0',
          topology: topologySummary,
          ts: new Date().toISOString(),
        });
      }

      if (path === '/api/mesh' && method === 'HEAD') {
        const r = await topologyFetch(request, env, '/api/mesh', 'HEAD');
        return new Response(null, {
          status: r.status,
          headers: { ...CORS_HEADERS, 'Content-Type': r.headers.get('Content-Type') || 'application/json; charset=utf-8' },
        });
      }

      if (path === '/api/mesh' && method === 'GET') {
        const r = await topologyFetch(request, env, '/api/mesh', 'GET');
        return new Response(r.body, { status: r.status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
      }

      const vMatch = path.match(/^\/api\/vertex\/(\w+)$/);
      if (vMatch && method === 'GET') {
        const r = await topologyFetch(request, env, `/api/vertex/${vMatch[1]}`, 'GET');
        return new Response(r.body, { status: r.status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
      }

      const pMatch = path.match(/^\/api\/presence\/(\w+)$/);
      if (pMatch && method === 'POST') {
        const r = await topologyFetch(request, env, `/api/presence/${pMatch[1]}`, 'POST');
        const out = await r.text();
        if (r.ok && env.FAMILY_MESH_ROOM) {
          try {
            const body = JSON.parse(out);
            await broadcastPingToRooms(env, {
              type: 'presence',
              vertex: pMatch[1],
              vertexRecord: body.vertex,
              ts: Date.now(),
            });
          } catch {
            /* ignore */
          }
        }
        return new Response(out, { status: r.status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
      }

      const pingMatch = path.match(/^\/api\/ping\/(\w+)\/(\w+)$/);
      if (pingMatch && method === 'POST') {
        const r = await topologyFetch(
          request,
          env,
          `/api/ping/${pingMatch[1]}/${pingMatch[2]}`,
          'POST',
        );
        const out = await r.text();
        if (r.ok) {
          let parsed;
          try {
            parsed = JSON.parse(out);
          } catch {
            parsed = null;
          }
          if (env.DB) {
            try {
              await appendTelemetryD1(env, {
                type: 'ping',
                from: pingMatch[1],
                to: pingMatch[2],
                ping: parsed?.ping,
              });
            } catch {
              /* optional */
            }
          } else {
            await appendTelemetryKv(env, {
              type: 'ping',
              from: pingMatch[1],
              to: pingMatch[2],
              ping: parsed?.ping,
            });
          }
          if (parsed?.ping) {
            await broadcastPingToRooms(env, {
              type: 'ping',
              ...parsed.ping,
              fromLove: parsed.fromLove,
              toLove: parsed.toLove,
            });
          }
        }
        return new Response(out, { status: r.status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
      }

      const eMatch = path.match(/^\/api\/edge\/(\w+)\/(\w+)$/);
      if (eMatch && method === 'GET') {
        const r = await topologyFetch(request, env, `/api/edge/${eMatch[1]}/${eMatch[2]}`, 'GET');
        return new Response(r.body, { status: r.status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
      }

      if (path === '/api/telemetry' && method === 'GET') {
        const limit = Math.min(parseInt(url.searchParams.get('limit') || url.searchParams.get('count') || '50', 10) || 50, 200);
        if (env.DB) {
          const res = await env.DB.prepare(
            'SELECT * FROM telemetry ORDER BY id DESC LIMIT ?',
          )
            .bind(limit)
            .all();
          const rows = res.results || [];
          let verified = true;
          for (let i = 0; i < rows.length - 1; i++) {
            if (rows[i].prev_hash !== rows[i + 1].hash) {
              verified = false;
              break;
            }
          }
          return json({
            source: 'd1',
            chain: rows,
            count: rows.length,
            verified,
            standard: 'WCD-46 SHA-256 chain (D1)',
          });
        }
        const kv = await getTelemetryKvChain(env, limit);
        return json({
          ...kv,
          standard: 'WCD-46 SHA-256 Chain-of-Custody',
        });
      }

      if (path === '/api/telemetry' && method === 'POST') {
        if (!isAdmin(request, env)) return err('Unauthorized', 401);
        const body = await request.json().catch(() => null);
        if (!body || !body.event) return err('Missing event payload');
        if (env.DB) {
          const t = await appendTelemetryD1(env, body.event);
          return json({ recorded: true, telemetry: t });
        }
        const t = await appendTelemetryKv(env, body.event);
        return json({ recorded: true, telemetry: t });
      }

      const rs = path.match(/^\/room-stats\/([^/]+)$/);
      if (rs && method === 'GET') {
        const roomId = rs[1];
        const stub = env.FAMILY_MESH_ROOM.get(env.FAMILY_MESH_ROOM.idFromName(roomId));
        const r = await stub.fetch(new Request('https://room/stats', { method: 'GET' }));
        return new Response(r.body, { status: r.status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
      }

      if (path.startsWith('/ws/')) {
        const parts = path.split('/').filter(Boolean);
        const roomId = parts[1] || 'family-mesh';
        const stub = env.FAMILY_MESH_ROOM.get(env.FAMILY_MESH_ROOM.idFromName(roomId));
        const internal = new URL(request.url);
        internal.pathname = '/';
        internal.searchParams.set('room', roomId);
        return stub.fetch(
          new Request(internal.toString(), {
            method: request.method,
            headers: request.headers,
            body: request.body,
          }),
        );
      }

      if (path === '/api/admin/dashboard' && method === 'GET') {
        if (!isAdmin(request, env)) return err('Unauthorized', 401);
        const meshR = await topologyFetch(request, env, '/api/mesh', 'GET');
        const mesh = meshR.ok ? await meshR.json() : null;
        const roomStub = env.FAMILY_MESH_ROOM.get(env.FAMILY_MESH_ROOM.idFromName('family-mesh'));
        const statsR = await roomStub.fetch(new Request('https://room/stats'));
        const room = statsR.ok ? await statsR.json() : null;
        return json({
          mesh,
          room,
          generated: new Date().toISOString(),
        });
      }

      return err('Not found. Try GET /api/mesh', 404);
    } catch (e) {
      return err(`Internal error: ${e.message}`, 500);
    }
  },
};
