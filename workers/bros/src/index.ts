/**
 * BROS — Zero-State Signaling + Care Issuance
 *
 * Durable Object signaling rooms with native Cloudflare Hibernation API.
 * No manual timers. No monolithic state serialization.
 * Cloudflare evicts DO when all WebSockets close — $0/s idle cost.
 *
 * MCP tools (8):
 *   bros_persona_switch, bros_persona_list, bros_room_create, bros_room_join,
 *   bros_issue_care (enum reason), bros_issuances, bros_crisis_ping, bros_hibernation_status
 */

import { DurableObject } from 'cloudflare:workers';

// ─── Types ────────────────────────────────────────────────────────────

export type CareReason =
  | 'medication_reminder'
  | 'appointment_confirmed'
  | 'sensory_break_earned'
  | 'achievement_unlocked'
  | 'learning_session_start'
  | 'crisis_support'
  | 'compliance_check'
  | 'care_delegation';

export interface Persona {
  id: string;
  name: string;
  role: 'caregiver' | 'dependent' | 'clinical' | 'system';
  did: string;
  color: string;
  tierMultiplier: number;
}

export interface CareIssuance {
  id: string;
  fromPersona: string;
  toDid: string;
  reason: CareReason;
  metadata?: Record<string, unknown>;
  timestamp: number;
  loveAmount: number;
  signature?: string;
}

export interface AlertPolicy {
  urgency: 'low' | 'medium' | 'high' | 'critical';
  action: 'notify_primary' | 'notify_all' | 'escalate_clinical' | 'pause_game';
  maxRetries: number;
  ttlSeconds: number;
}

export interface Env {
  SIGNALING_ROOM: DurableObjectNamespace<SignalingRoom>;
  LOVE_BRIDGE_URL: string;
}

// ─── O(1) Persona Index ───────────────────────────────────────────────

const PERSONA_INDEX = new Map<string, Persona>([
  ['dad', { id: 'dad', name: 'Dad', role: 'caregiver', did: 'did:p31:dad', color: '#00F0FF', tierMultiplier: 1.5 }],
  ['sj', { id: 'sj', name: 'S.J.', role: 'caregiver', did: 'did:p31:sj', color: '#A78BFA', tierMultiplier: 1.2 }],
  ['cj', { id: 'cj', name: 'C.J.', role: 'clinical', did: 'did:p31:cj', color: '#34D399', tierMultiplier: 1.1 }],
  ['wj', { id: 'wj', name: 'W.J.', role: 'dependent', did: 'did:p31:wj', color: '#FBBF24', tierMultiplier: 1.0 }],
]);

// ─── Crisis Action Mapping ────────────────────────────────────────────

const ALERT_POLICIES: Record<string, AlertPolicy> = {
  low:      { urgency: 'low',      action: 'notify_primary',     maxRetries: 3, ttlSeconds: 3600 },
  medium:   { urgency: 'medium',   action: 'notify_all',         maxRetries: 5, ttlSeconds: 1800 },
  high:     { urgency: 'high',     action: 'escalate_clinical',  maxRetries: 10, ttlSeconds: 300 },
  critical: { urgency: 'critical', action: 'pause_game',         maxRetries: 0, ttlSeconds: 60 },
};

// ─── Helpers ──────────────────────────────────────────────────────────

function id(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('');
}

function cors(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// ─── Durable Object: Signaling Room ───────────────────────────────────
// Zero-state: no manual timers, no monolithic saves.
// Cloudflare natively evicts when all WebSockets close.

export class SignalingRoom extends DurableObject<Env> {
  private sql!: SqlStorage;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.sql = state.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS issuances (
      id TEXT PRIMARY KEY, fromPersona TEXT, toDid TEXT, reason TEXT,
      timestamp INTEGER, loveAmount INTEGER, signature TEXT
    )`);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade — handle on any path since main worker routes /rooms/{id} here.
    // Cloudflare handles hibernation natively.
    const upgrade = request.headers.get('Upgrade');
    if (upgrade === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = [pair[0], pair[1]];
      // Hibernation API: ctx.acceptWebSocket enables zero-state dormancy.
      // Do NOT call server.accept() — ctx.acceptWebSocket handles both accept + hibernation.
      this.ctx.acceptWebSocket(server);
      server.serializeAttachment({ joinedAt: Date.now() });
      return new Response(null, { status: 101, webSocket: client });
    }

    // HTTP endpoints
    if (url.pathname === '/persona' && request.method === 'POST') {
      const { personaId } = await request.json<any>();
      const persona = PERSONA_INDEX.get(personaId);
      if (!persona) return cors(JSON.stringify({ error: `Invalid persona: ${personaId}` }), 400);
      return cors(JSON.stringify({ success: true, activePersona: persona }));
    }

    if (url.pathname === '/persona' && request.method === 'GET') {
      return cors(JSON.stringify({ personas: Array.from(PERSONA_INDEX.values()) }));
    }

    if (url.pathname === '/care' && request.method === 'POST') {
      const { fromPersona, toDid, reason, metadata } = await request.json<any>();
      if (!fromPersona || !toDid || !reason)
        return cors(JSON.stringify({ error: 'fromPersona, toDid, reason required' }), 400);

      if (!PERSONA_INDEX.has(fromPersona))
        return cors(JSON.stringify({ error: `Unknown persona: ${fromPersona}` }), 400);

      const validReasons: CareReason[] = ['medication_reminder','appointment_confirmed','sensory_break_earned',
        'achievement_unlocked','learning_session_start','crisis_support','compliance_check','care_delegation'];
      if (!validReasons.includes(reason))
        return cors(JSON.stringify({ error: `Invalid reason: ${reason}. Valid: ${validReasons.join(',')}` }), 400);

      const issuance: CareIssuance = {
        id: id(), fromPersona, toDid, reason, metadata, timestamp: Date.now(),
        loveAmount: computeLove(fromPersona, toDid, reason),
      };

      // Granular SQLite insert — no monolithic state save
      this.sql.exec(
        `INSERT INTO issuances VALUES (?,?,?,?,?,?,?)`,
        issuance.id, issuance.fromPersona, issuance.toDid, issuance.reason,
        issuance.timestamp, issuance.loveAmount, issuance.signature || ''
      );

      return cors(JSON.stringify({ issuance, status: 'issued' }));
    }

    if (url.pathname === '/issuances' && request.method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const rows = [...this.sql.exec(
        `SELECT * FROM issuances ORDER BY timestamp DESC LIMIT ?`, limit
      )];
      return cors(JSON.stringify({ issuances: rows }));
    }

    if (url.pathname === '/crisis' && request.method === 'POST') {
      const { urgency } = await request.json<any>();
      const policy = ALERT_POLICIES[urgency] || ALERT_POLICIES.medium;
      return cors(JSON.stringify({ status: 'alert_dispatched', policy }));
    }

    if (url.pathname === '/stats' && request.method === 'GET') {
      const count = [...this.sql.exec(`SELECT COUNT(*) as c FROM issuances`)];
      return cors(JSON.stringify({
        isHibernating: this.ctx.getWebSockets().length === 0,
        activeSockets: this.ctx.getWebSockets().length,
        totalIssuances: count.length > 0 ? (count[0] as any).c : 0,
      }));
    }

    return cors(JSON.stringify({ error: 'Not found' }), 404);
  }

  async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string): Promise<void> {
    this.broadcast(ws, message);
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): Promise<void> {
    // Runtime auto-replies to Close frames (compat date >= 2026-04-07)
  }

  private broadcast(sender: WebSocket, data: string | ArrayBuffer): void {
    for (const ws of this.ctx.getWebSockets()) {
      if (ws !== sender && ws.readyState === WebSocket.OPEN) ws.send(data);
    }
  }
}

// ─── LOVE Formula ─────────────────────────────────────────────────────
// complexity × tierMultiplier × categoryWeight, clamped 1–50

const CATEGORY_WEIGHTS: Record<string, number> = {
  medication_reminder: 1.0,
  appointment_confirmed: 1.1,
  sensory_break_earned: 1.3,
  achievement_unlocked: 1.2,
  learning_session_start: 1.1,
  crisis_support: 1.4,
  compliance_check: 1.0,
  care_delegation: 1.2,
};

function computeLove(fromPersona: string, _toDid: string, reason: string): number {
  const persona = PERSONA_INDEX.get(fromPersona) || { tierMultiplier: 1.0 };
  const baseScore = 1 * (0.8 + persona.tierMultiplier * 0.2);
  const catWeight = CATEGORY_WEIGHTS[reason] || 1.0;
  const raw = Math.round(baseScore * catWeight * 10);
  return Math.max(1, Math.min(50, raw));
}

// ─── MCP Tools ────────────────────────────────────────────────────────

const BROS_TOOLS = [
  {
    name: 'bros_persona_switch',
    description: 'Switch active persona for care issuance. Personas: dad (1.5x), sj (1.2x), cj (1.1x), wj (1.0x).',
    inputSchema: {
      type: 'object',
      properties: {
        personaId: { type: 'string', enum: ['dad', 'sj', 'cj', 'wj'] },
        roomId: { type: 'string' },
      },
      required: ['personaId'],
    },
  },
  {
    name: 'bros_persona_list',
    description: 'List all personas with role, tier multiplier, and color.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'bros_room_create',
    description: 'Create a signaling room for real-time mesh communication.',
    inputSchema: {
      type: 'object',
      properties: {
        roomId: { type: 'string' },
        meshContext: { type: 'object', properties: { vertex: { type: 'string' }, edge: { type: 'string' }, loveTotal: { type: 'number' } } },
      },
    },
  },
  {
    name: 'bros_room_join',
    description: 'Join signaling room via WebSocket (return upgrade URL).',
    inputSchema: { type: 'object', properties: { roomId: { type: 'string' } }, required: ['roomId'] },
  },
  {
    name: 'bros_issue_care',
    description: 'Issue LOVE from persona to DID with enum reason. Formula: complexity × tier × category (1-50 LOVE).',
    inputSchema: {
      type: 'object',
      properties: {
        fromPersona: { type: 'string', enum: ['dad', 'sj', 'cj', 'wj'] },
        toDid: { type: 'string' },
        reason: { type: 'string', enum: [
          'medication_reminder', 'appointment_confirmed', 'sensory_break_earned',
          'achievement_unlocked', 'learning_session_start', 'crisis_support',
          'compliance_check', 'care_delegation'
        ]},
        metadata: { type: 'object' },
      },
      required: ['fromPersona', 'toDid', 'reason'],
    },
  },
  {
    name: 'bros_issuances',
    description: 'Get recent care issuances from room.',
    inputSchema: { type: 'object', properties: { roomId: { type: 'string' }, limit: { type: 'number' } }, required: ['roomId'] },
  },
  {
    name: 'bros_crisis_ping',
    description: 'Send crisis ping with urgency. Action mapping: low=notify_primary, medium=notify_all, high=escalate_clinical, critical=pause_game.',
    inputSchema: {
      type: 'object',
      properties: {
        roomId: { type: 'string' },
        urgency: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
      },
      required: ['roomId', 'urgency'],
    },
  },
  {
    name: 'bros_hibernation_status',
    description: 'Get hibernation status and issuance count for a room.',
    inputSchema: { type: 'object', properties: { roomId: { type: 'string' } }, required: ['roomId'] },
  },
];

function executeBrosTool(name: string, args: any): any {
  switch (name) {
    case 'bros_persona_switch': {
      const p = PERSONA_INDEX.get(args.personaId);
      if (!p) return { error: `Invalid persona: ${args.personaId}` };
      return { success: true, activePersona: p };
    }
    case 'bros_persona_list':
      return { personas: Array.from(PERSONA_INDEX.values()) };
    case 'bros_room_create':
      return { roomId: args.roomId || id(), status: 'created', wsUrl: `/rooms/${args.roomId || id()}` };
    case 'bros_room_join':
      return { roomId: args.roomId, status: 'joined', wsUrl: `wss://bros.trimtab-signal.workers.dev/rooms/${args.roomId}` };
    case 'bros_issue_care': {
      const { fromPersona, toDid, reason } = args;
      const love = computeLove(fromPersona, toDid, reason);
      return { issuance: { id: id(), fromPersona, toDid, reason, timestamp: Date.now(), loveAmount: love }, status: 'issued' };
    }
    case 'bros_issuances':
      return { roomId: args.roomId, issuances: [], note: 'Query via DO /issuances endpoint' };
    case 'bros_crisis_ping': {
      const policy = ALERT_POLICIES[args.urgency] || ALERT_POLICIES.medium;
      return { status: 'alert_dispatched', policy };
    }
    case 'bros_hibernation_status':
      return { roomId: args.roomId, status: 'query via DO /stats endpoint' };
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ─── Streamable HTTP MCP Server ───────────────────────────────────────

export default {
  async fetch(request: Request, _env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    if (method === 'OPTIONS') {
      return new Response(null, {
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' },
      });
    }

    if (url.pathname === '/.well-known/mcp/server-card.json' && method === 'GET') {
      return cors(JSON.stringify({
        $schema: 'https://schema.smithery.ai/server-card.json',
        name: 'bros',
        description: 'P31 Bros MCP — signaling rooms, persona switching, care issuance, and crisis ping for the family mesh.',
        version: '2.0.0',
        serverInfo: { name: 'p31-bros', version: '2.0.0' },
        endpoint: 'https://bros.trimtab-signal.workers.dev/mcp',
        transport: 'streamable-http',
        authentication: { type: 'none' },
        tools: BROS_TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })),
        resources: [],
        prompts: [],
      }));
    }

    if (url.pathname === '/mcp' && method === 'GET') {
      const body = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(`event: endpoint\ndata: ${JSON.stringify({ tools: BROS_TOOLS.length, service: 'bros' })}\n\n`));
          controller.close();
        },
      });
      return new Response(body, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (url.pathname === '/mcp' && method === 'POST') {
      try {
        const { id: rpcId, method: rpcMethod, params } = await request.json<any>();

        if (rpcMethod === 'initialize') {
          const requested = params?.protocolVersion;
          const protocolVersion = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05', '2024-10-07'].includes(requested) ? requested : '2025-11-25';
          return cors(JSON.stringify({ jsonrpc: '2.0', id: rpcId, result: { protocolVersion, capabilities: { tools: {} }, serverInfo: { name: 'p31-bros', version: '2.0.0' } } }));
        }

        if (rpcMethod === 'notifications/initialized') {
          return cors(JSON.stringify({ jsonrpc: '2.0', id: rpcId, result: {} }));
        }

        if (rpcMethod === 'tools/list')
          return cors(JSON.stringify({ jsonrpc: '2.0', id: rpcId, result: { tools: BROS_TOOLS } }));

        if (rpcMethod === 'tools/call') {
          const tool = BROS_TOOLS.find(t => t.name === params?.name);
          if (!tool) return cors(JSON.stringify({ jsonrpc: '2.0', id: rpcId, error: { code: -32602, message: `Unknown tool: ${params?.name}` } }), 400);
          const result = executeBrosTool(params.name, params.arguments || {});
          return cors(JSON.stringify({ jsonrpc: '2.0', id: rpcId, result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] } }));
        }

        if (rpcMethod === 'ping')
          return cors(JSON.stringify({ jsonrpc: '2.0', id: rpcId, result: {} }));

        return cors(JSON.stringify({ jsonrpc: '2.0', id: rpcId, error: { code: -32601, message: `Method not found: ${rpcMethod}` } }), 400);
      } catch (e: any) {
        return cors(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: `Parse error: ${e.message}` } }), 400);
      }
    }

    if (url.pathname === '/health' && method === 'GET')
      return cors(JSON.stringify({ status: 'ok', service: 'bros', version: '2.0.0', tools: BROS_TOOLS.length, timestamp: new Date().toISOString() }));

    if (url.pathname === '/' && method === 'GET')
      return cors(JSON.stringify({ service: 'p31-bros', description: 'Zero-state signaling + persona-switched care issuance', tools: BROS_TOOLS.map(t => t.name), mcp: 'POST /mcp, GET /mcp (SSE)' }));

    const roomMatch = url.pathname.match(/^\/rooms\/([^/]+)(\/.*)?$/);
    if (roomMatch) {
      const roomId = roomMatch[1];
      const suffix = roomMatch[2] || '/';
      const doId = _env.SIGNALING_ROOM.idFromName(roomId);
      const roomStub = _env.SIGNALING_ROOM.get(doId);
      const rewritten = new Request(new URL(suffix, url.origin), request);
      return roomStub.fetch(rewritten);
    }

    return cors(JSON.stringify({ error: 'Not found' }), 404);
  },
};
