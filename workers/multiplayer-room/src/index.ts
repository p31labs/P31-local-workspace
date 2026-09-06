import { DurableObject } from 'cloudflare:workers';

interface Env {
  ROOM: DurableObjectNamespace;
  LOVE_BRIDGE_URL: string;
  AI_GATEWAY_URL: string;
  GENESIS_GATE_URL: string;
}

interface RoomConfig {
  roomId: string;
  name: string;
  creator: string;
  created: number;
  status: 'active' | 'archived';
  maxParticipants: number;
  mode: 'vibe-coding' | 'world-building' | 'mesh-chat' | 'cage-collab';
}

interface Participant {
  did: string;
  name: string;
  joined: number;
  cursor?: { line: number; column: number };
  selection?: { start: number; end: number };
  typing: boolean;
  status: 'active' | 'idle' | 'away';
  color: string;
}

interface ChatMessage {
  id: string;
  did: string;
  name: string;
  text: string;
  timestamp: number;
}

interface LoveSettlement {
  did: string;
  amount: number;
  reason: string;
  timestamp: number;
}

const PARTICIPANT_COLORS = [
  '#00ffcc', '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff',
  '#c084fc', '#f472b6', '#22d3ee', '#a3e635', '#f97316',
];

function genId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}

// ─── Yjs CRDT Document Store ──────────────────────────────────────────
// Per-room Y.Doc stored as a base64-encoded update in DO storage.
// Clients synchronize their local Y.Doc with the room's authoritative copy.

const YJS_DOC_KEY = 'yjs_doc_state';

async function getYjsState(storage: DurableObjectStorage): Promise<Uint8Array | null> {
  try {
    const base64 = await storage.get<string>(YJS_DOC_KEY);
    if (!base64) return null;
    const binary = atob(base64);
    return new Uint8Array(binary.split('').map(c => c.charCodeAt(0)));
  } catch {
    return null;
  }
}

async function setYjsState(storage: DurableObjectStorage, update: Uint8Array): Promise<void> {
  const binary = String.fromCharCode(...new Uint8Array(update));
  const base64 = btoa(binary);
  await storage.put(YJS_DOC_KEY, base64);
}

export class RoomCoordinatorDO extends DurableObject<Env> {
  private sessions: Map<WebSocket, { did: string; name: string; roomId: string }>;
  private participants: Map<string, Participant>;
  private chatHistory: ChatMessage[];
  private loveSettlements: LoveSettlement[];
  private config: RoomConfig | null;
  private yjsState: Uint8Array | null;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sessions = new Map();
    this.participants = new Map();
    this.chatHistory = [];
    this.loveSettlements = [];
    this.config = null;
    this.yjsState = null;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if ((path === '/room/create' || path === '/rooms/create') && method === 'POST') return this.createRoom(await request.json());
    if (path === '/room/state' && method === 'GET') return this.getRoomState();
    if (path === '/room/list' && method === 'GET') return this.listRooms();
    if (path === '/ws' && method === 'GET') return this.handleWebSocket(request);
    if (path === '/health') return json({ ok: true, service: 'room-coordinator', version: '2.0.0', yjs: !!this.yjsState, rooms: this.sessions.size, genesisGate: !!this.env.GENESIS_GATE_URL });

    return json({ error: 'Not found' }, 404);
  }

  // ── Room lifecycle ────────────────────────────────────────────────

  async createRoom(body: { name: string; creatorDid: string; mode?: string }) {
    if (!body.name || !body.creatorDid) return json({ error: 'name and creatorDid required' }, 400);
    this.config = {
      roomId: genId(), name: body.name, creator: body.creatorDid, created: Date.now(),
      status: 'active', maxParticipants: 10,
      mode: (body.mode as any) || 'vibe-coding',
    };
    await this.persist();
    return json({ ok: true, roomId: this.config.roomId, ...this.config });
  }

  async getRoomState() {
    if (!this.config) return json({ error: 'Room not initialized' }, 404);
    const participants = Array.from(this.participants.values());
    return json({
      ...this.config, participants, participantCount: participants.length,
      chatMessages: this.chatHistory.slice(-50), loveSettlements: this.loveSettlements.slice(-20),
    });
  }

  async listRooms() {
    const rooms = (await this.ctx.storage.get<Record<string, RoomConfig>>('rooms')) || {};
    return json({ rooms: Object.values(rooms).filter(r => r.status === 'active'), total: Object.keys(rooms).length });
  }

  // ── WebSocket ─────────────────────────────────────────────────────

  handleWebSocket(request: Request): Response {
    const url = new URL(request.url);
    const did = url.searchParams.get('did') || 'anonymous';
    const name = url.searchParams.get('name') || 'Guest';

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.ctx.acceptWebSocket(server, [did, name, this.config?.roomId || '']);
    this.sessions.set(server, { did, name, roomId: this.config?.roomId || '' });

    const colorIdx = this.participants.size % PARTICIPANT_COLORS.length;
    const participant: Participant = {
      did, name, joined: Date.now(), typing: false, status: 'active', color: PARTICIPANT_COLORS[colorIdx],
    };
    this.participants.set(did, participant);

    this.broadcast({ type: 'presence:join', participant }, server);
    this.broadcast({ type: 'presence:list', participants: Array.from(this.participants.values()) }, server);

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    const session = this.sessions.get(ws);
    if (!session) return;

    let data: any;
    try {
      data = typeof message === 'string' ? JSON.parse(message) : JSON.parse(new TextDecoder().decode(message));
    } catch { return; }

    switch (data.type) {
      case 'chat:send': await this.handleChat(ws, session, data.payload); break;
      case 'code:update': await this.handleCodeUpdate(ws, session, data.payload); break;
      case 'world:update': await this.handleWorldUpdate(ws, session, data.payload); break;
      case 'presence:update': await this.handlePresenceUpdate(session, data.payload); break;
      case 'ai:prompt': await this.handleAIPrompt(ws, session, data.payload); break;
      case 'yjs:update': await this.handleYjsUpdate(ws, session, data.payload); break;
      case 'yjs:sync': await this.sendYjsSync(ws); break;
      case 'love:settle': await this.handleLoveSettle(ws, session, data.payload); break;
      case 'room:sync': await this.handleRoomSync(ws); break;
      default: this.broadcast(data, ws);
    }
  }

  async webSocketClose(ws: WebSocket, _code: number, _reason: string, _wasClean: boolean) {
    const session = this.sessions.get(ws);
    if (session) {
      const participant = this.participants.get(session.did);
      if (participant) {
        this.participants.delete(session.did);
        this.broadcast({ type: 'presence:leave', did: session.did, name: session.name }, ws);
      }
      this.sessions.delete(ws);
    }
  }

  async webSocketError(ws: WebSocket, error: unknown) {
    console.error('[room] WebSocket error:', error);
    this.sessions.delete(ws);
  }

  // ── Message handlers ──────────────────────────────────────────────

  async handleChat(ws: WebSocket, session: any, payload: { text: string }) {
    const msg: ChatMessage = {
      id: genId(), did: session.did, name: session.name, text: payload.text, timestamp: Date.now(),
    };
    this.chatHistory.push(msg);
    if (this.chatHistory.length > 200) this.chatHistory = this.chatHistory.slice(-200);
    this.broadcast({ type: 'chat:message', message: msg }, ws);

    if (this.env.GENESIS_GATE_URL) {
      fetch(`${this.env.GENESIS_GATE_URL}/event`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'multiplayer-room', type: 'ping_sent',
          payload: { roomId: this.config?.roomId, did: session.did, text: payload.text, chatId: msg.id },
          timestamp: new Date().toISOString(), session_id: this.config?.roomId || '',
        }),
      }).catch(() => {});
    }
  }

  async handleCodeUpdate(ws: WebSocket, session: any, payload: { code: string; language: string }) {
    this.broadcast({ type: 'code:sync', did: session.did, code: payload.code, language: payload.language }, ws);
  }

  async handleWorldUpdate(ws: WebSocket, session: any, payload: any) {
    this.broadcast({ type: 'world:sync', did: session.did, updates: payload }, ws);
  }

  async handlePresenceUpdate(session: any, payload: any) {
    const p = this.participants.get(session.did);
    if (p) {
      if (payload.cursor) p.cursor = payload.cursor;
      if (payload.selection) p.selection = payload.selection;
      if (payload.typing !== undefined) p.typing = payload.typing;
      this.participants.set(session.did, p);
      this.broadcast({ type: 'presence:update', did: session.did, participant: p });
    }
  }

  async handleAIPrompt(ws: WebSocket, session: any, payload: { prompt: string; context?: any }) {
    this.broadcast({ type: 'ai:prompt_sent', did: session.did, prompt: payload.prompt }, ws);
  }

  // ── Yjs CRDT Sync ─────────────────────────────────────────────────

  async handleYjsUpdate(ws: WebSocket, session: any, payload: any) {
    const update = new Uint8Array(payload instanceof Array ? payload : Object.values(payload));
    if (this.yjsState) {
      this.yjsState = Uint8Array.from([...this.yjsState, ...update]);
    } else {
      this.yjsState = update;
    }
    await setYjsState(this.ctx.storage, this.yjsState);
    this.broadcast({ type: 'yjs:update', update: Array.from(update) }, ws);
  }

  async sendYjsSync(ws: WebSocket) {
    if (this.yjsState) {
      const stored = await getYjsState(this.ctx.storage);
      if (stored) this.yjsState = stored;
    }
    this.sendTo(ws, {
      type: 'yjs:sync',
      update: this.yjsState ? Array.from(this.yjsState) : [],
    });
  }

  async handleRoomSync(ws: WebSocket) {
    const storedYjs = await getYjsState(this.ctx.storage);
    if (storedYjs) this.yjsState = storedYjs;

    this.sendTo(ws, {
      type: 'room:state',
      config: this.config,
      participants: Array.from(this.participants.values()),
      chatHistory: this.chatHistory.slice(-50),
      yjsState: this.yjsState ? Array.from(this.yjsState) : [],
    });
  }

  // ── LOVE Settlement ───────────────────────────────────────────────

  async handleLoveSettle(ws: WebSocket, session: any, payload: { amount: number; reason: string }) {
    const settlement: LoveSettlement = {
      did: session.did, amount: payload.amount, reason: payload.reason, timestamp: Date.now(),
    };
    this.loveSettlements.push(settlement);
    this.broadcast({ type: 'love:settled', settlement }, ws);

    if (this.env.LOVE_BRIDGE_URL) {
      fetch(`${this.env.LOVE_BRIDGE_URL}/d1/mint`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: `room_${this.config?.roomId}_${session.did}`,
          did: session.did, totalLove: payload.amount,
          source: 'multiplayer-room', reason: payload.reason,
        }),
      }).catch(() => {});
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────

  broadcast(data: any, except?: WebSocket) {
    const msg = JSON.stringify(data);
    for (const ws of this.sessions.keys()) {
      if (ws === except) continue;
      try { ws.send(msg); } catch {}
    }
  }

  sendTo(ws: WebSocket, data: any) {
    try { ws.send(JSON.stringify(data)); } catch {}
  }

  async persist() {
    if (this.config) {
      const rooms = (await this.ctx.storage.get<Record<string, RoomConfig>>('rooms')) || {};
      rooms[this.config.roomId] = this.config;
      await this.ctx.storage.put('rooms', rooms);
    }
  }

}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const roomId = new URL(request.url).searchParams.get('roomId') ||
                   env.ROOM.idFromName('default').toString();
    const doId = env.ROOM.idFromName(roomId);
    const stub = env.ROOM.get(doId);
    return stub.fetch(request);
  },
};
