/**
 * SpIn Mesh — Matchmaking Durable Object (Revised)
 *
 * In-memory intents + 60s alarm cycle detection; WebSocket push.
 * Upon cycle lock, also creates a Logistics DO request for midpoint/venues.
 */

interface Intent {
  userId: string;
  resourceId: string;
  desiredResourceId: string;
  expiresAt?: number;
}
interface CycleLock {
  cycleId: string;
  participants: string[];
  resourceIds: string[];
  lockedAt: number;
  midpoint?: { lat: number; lon: number };
  venues?: Array<{ name: string; lat: number; lon: number }>;
}
type Message = {
  type: 'cycle_locked' | 'handover_ready';
  cycleId: string;
  participants?: string[];
  resources?: string[];
  midpoint?: { lat: number; lon: number };
  venues?: Array<{ name: string; lat: number; lon: number }>;
};

export default class MatchmakingDO {
  intents: Map<string, Intent>;
  cycleLocks: Map<string, CycleLock>;
  websockets: Map<string, WebSocket>;
  state: any;
  env: any;

  constructor(state: any, env: any) {
    this.state = state;
    this.env = env;
    this.intents = new Map<string, Intent>();
    this.cycleLocks = new Map<string, CycleLock>();
    this.websockets = new Map<string, WebSocket>();
    this.state.blockUntil('detectCycles', Date.now() + 60_000);
  }

  async alarm(): Promise<void> {
    await this.detectCycles();
    this.state.blockUntil('detectCycles', Date.now() + 60_000);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/intent' && request.method === 'POST') return this.handlePostIntent(request);
    if (path === '/cycles' && request.method === 'GET') return this.handleGetCycles(request);
    if (path === '/ws' && request.headers.get('Upgrade') === 'websocket') return this.handleWebSocket(request);
    if (path === '/health') return new Response('OK', { status: 200 });

    return new Response('Not Found', { status: 404 });
  }

  async handlePostIntent(request: Request): Promise<Response> {
    const body: Intent = await request.json();
    const key = `${body.userId}|${body.resourceId}`;
    this.intents.set(key, { ...body, expiresAt: body.expiresAt });
    await this.detectCycles();
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  }

  async handleGetCycles(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    if (!userId) return new Response('Missing userId', { status: 400 });

    const cycles = Array.from(this.cycleLocks.values()).filter(c => c.participants.includes(userId));
    return new Response(JSON.stringify(cycles), { headers: { 'Content-Type': 'application/json' } });
  }

  async handleWebSocket(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    if (!userId) return new Response('userId required', { status: 400 });

    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];
    this.websockets.set(userId, server);

    server.addEventListener('close', () => this.websockets.delete(userId));
    return new Response(null, { status: 101, webSocket: client });
  }

  async detectCycles(): Promise<void> {
    // Build ownership & graph
    const resourceOwner: Record<string, string> = {};
    for (const intent of this.intents.values()) {
      if (intent.expiresAt && intent.expiresAt < Date.now()/1000) continue;
      resourceOwner[intent.resourceId] = intent.userId;
    }
    const graph: Record<string, string> = {};
    for (const intent of this.intents.values()) {
      if (intent.expiresAt && intent.expiresAt < Date.now()/1000) continue;
      const targetOwner = resourceOwner[intent.desiredResourceId];
      if (targetOwner && targetOwner !== intent.userId) graph[intent.userId] = targetOwner;
    }

    // Tarjan's SCC — for MVP we only accept 2‑party cycles (pairwise swaps)
    const indexMap: Record<string, number> = {};
    const lowlink: Record<string, number> = {};
    const stack: string[] = [];
    const onStack = new Set<string>();
    let index = 0;
    const cycles: string[][] = [];

    const strongconnect = (v: string) => {
      indexMap[v] = index; lowlink[v] = index; index++; stack.push(v); onStack.add(v);
      const w = graph[v];
      if (w !== undefined) {
        if (indexMap[w] === undefined) { strongconnect(w); lowlink[v] = Math.min(lowlink[v], lowlink[w]); }
        else if (onStack.has(w)) lowlink[v] = Math.min(lowlink[v], indexMap[w]);
      }
      if (lowlink[v] === indexMap[v]) {
        const scc: string[] = [];
        let w2: string;
        do { w2 = stack.pop()!; onStack.delete(w2); scc.push(w2); } while (w2 !== v);
        if (scc.length === 2) cycles.push(scc); // MVP: only 2‑person cycles
      }
    };

    for (const v of Object.keys(graph)) if (indexMap[v] === undefined) strongconnect(v);

    // Lock cycles & request logistics
    for (const cycle of cycles) {
      const sorted = [...cycle].sort();
      const cycleId = await sha256(sorted.join('|'));
      if (this.cycleLocks.has(cycleId)) continue;

      const userResources = cycle.map(u => {
        const intent = Array.from(this.intents.values()).find(i => i.userId === u);
        return intent?.resourceId || '';
      });

      const lock: CycleLock = { cycleId, participants: cycle, resourceIds: userResources, lockedAt: Date.now() };
      this.cycleLocks.set(cycleId, lock);

      // Notify participants
      const msg: Message = { type: 'cycle_locked', cycleId, participants: cycle, resources: userResources };
      for (const userId of cycle) this.notify(userId, msg);

      // Spin up Logistics DO for handover coordination
      try {
        const logDO = this.env.LOGISTICS.get(cycleId);
        await logDO.fetch('http://logistics/init', {
          method: 'POST',
          body: JSON.stringify({
            cycleId,
            participants: cycle,
            resourceIds: userResources,
            midpoint: { lat: 0, lon: 0 }, // TODO: lookup from user profiles
            geohash: '00000',
            venues: []
          }),
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {
        console.error('Logistics DO init failed', e);
      }

      // Trigger logistics DO (placeholder: direct fetch to another DO bound as LOGISTICS)
      // In production, bind a Logistics DO in wrangler.toml and call:
      // await env.LOGISTICS.get(cycleId).fetch(...) with participant location data
    }
  }

  notify(userId: string, payload: Message): void {
    const ws = this.websockets.get(userId);
    if (ws && ws.readyState === 1) ws.send(JSON.stringify(payload));
  }
}

async function sha256(data: string): Promise<string> {
  const buf = new TextEncoder().encode(data);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}