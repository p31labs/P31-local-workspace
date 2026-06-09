/**
 * SpIn Mesh — Logistics Durable Object v0.1
 *
 * Coordinates double-blind physical hand-offs for a locked TTC cycle.
 * Creates ephemeral X3DH key exchange, suggests venues, and destroys
 * shared secrets upon completion.
 *
 * Bound to Matchmaking DO as LOGISTICS binding.
 */

interface HandoverState {
  cycleId: string;
  participants: string[];
  resourceIds: string[];
  midpoint: { lat: number; lon: number };
  geohash: string;
  venues: Array<{ name: string; lat: number; lon: number }>;
  pubkeys: Record<string, Uint8Array>;        // userId -> X25519 pubkey (raw 32B)
  completed: Set<string>;                      // userIds who confirmed
  createdAt: number;
}

type SubmitKeyRequest = {
  userId: string;
  pubkey: string; // hex string
};

type Message = {
  type: 'handover_ready' | 'handover_complete' | 'error';
  cycleId: string;
  midpoint?: { lat: number; lon: number };
  venues?: Array<{ name: string; lat: number; lon: number }>;
  remotePubkey?: Uint8Array;
  resourceIds?: string[];
};

export class HandoverDO {
  state: any;
  env: any;

  constructor(state: any, env: any) {
    this.state = state;
    this.env = env;
    // Auto-expire after 24h
    this.state.blockUntil('expire', Date.now() + 24*60*60*1000);
  }

  async alarm(): Promise<void> {
    const s: HandoverState = await this.state.get();
    if (s && Date.now() - s.createdAt > 24*60*60*1000) {
      await this.state.delete();
    }
    this.state.blockUntil('expire', Date.now() + 24*60*60*1000);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/init' && request.method === 'POST') return this.init(request);
    if (path === '/key' && request.method === 'POST') return this.submitKey(request);
    if (path === '/ready' && request.method === 'GET') return this.ready(request);
    if (path === '/complete' && request.method === 'POST') return this.complete(request);
    if (path === '/health') return new Response('OK', { status: 200 });

    return new Response('Not Found', { status: 404 });
  }

  // POST /init — Matchmaking DO creates handover record
  async init(request: Request): Promise<Response> {
    const body: any = await request.json();
    const state: HandoverState = {
      cycleId: body.cycleId,
      participants: body.participants as string[],
      resourceIds: body.resourceIds as string[],
      midpoint: body.midpoint,
      geohash: body.geohash,
      venues: body.venues || [],
      pubkeys: {},
      completed: new Set<string>(),
      createdAt: Date.now(),
    };
    await this.state.put(state);
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  }

  // POST /key — participant submits ephemeral X25519 public key (hex string)
  async submitKey(request: Request): Promise<Response> {
    const body = (await request.json()) as SubmitKeyRequest;
    const { userId, pubkey } = body;
    const state: HandoverState = await this.state.get();
    if (!state) return new Response('Handover unknown', { status: 404 });

    state.pubkeys[userId] = Uint8Array.from(Buffer.from(pubkey, 'hex'));
    await this.state.put(state);

    // If all keys received, push 'ready' to both via Matchmaking DO WebSocket? For now, return.
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  }

  // GET /ready?userId=… — returns remote pubkey and handover metadata when ready
  async ready(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    if (!userId) return new Response('userId required', { status: 400 });

    const state: HandoverState = await this.state.get();
    if (!state) return new Response('Handover unknown', { status: 404 });

    // Not ready until we have both pubkeys
    if (!(userId in state.pubkeys)) {
      const waiting = state.participants.filter(p => !(p in state.pubkeys));
      return new Response(JSON.stringify({ ready: false, waitingFor: waiting }), { headers: { 'Content-Type': 'application/json' } });
    }

    const otherId = state.participants.find(p => p !== userId);
    if (!otherId) {
      return new Response(JSON.stringify({ ready: false, waitingFor: [userId] }), { headers: { 'Content-Type': 'application/json' } });
    }
    const remotePub = state.pubkeys[otherId];
    if (!remotePub) {
      return new Response(JSON.stringify({ ready: false, waitingFor: [otherId] }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      ready: true,
      cycleId: state.cycleId,
      midpoint: state.midpoint,
      geohash: state.geohash,
      venues: state.venues,
      remotePubkey: Array.from(remotePub),
      resourceIds: state.resourceIds,
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  // POST /complete — participant acknowledges physical handover; triggers secret destruction when all done
  async complete(request: Request): Promise<Response> {
    const { userId } = await request.json() as { userId: string };
    const state: HandoverState = await this.state.get();
    if (!state) return new Response('Handover unknown', { status: 404 });

    state.completed.add(userId);
    await this.state.put(state);

    if (state.completed.size === state.participants.length) {
      // Mint L.O.V.E. tokens (single-mint per cycle)
      await this.mintLoveTokens(state);
      // Destroy state — privacy wipe
      await this.state.delete();
    }
    return new Response(JSON.stringify({ ok: true, completed: state.completed.size }), { headers: { 'Content-Type': 'application/json' } });
  }

  async mintLoveTokens(state: HandoverState): Promise<void> {
    // Placeholder: in future, call EigenTrust service or write to a global ledger
    console.log(`[L.O.V.E.] Mint for cycle ${state.cycleId} by ${state.participants.join(',')}`);
  }
}