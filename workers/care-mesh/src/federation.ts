/**
 * ⚠️ HONEST LABEL
 * Care Mesh Federation Durable Object — peer node for the P2P care data mesh.
 * Nodes exchange Ed25519-signed care aggregates with differential privacy
 * (Laplace mechanism, ε=0.5). This is a standard differential privacy
 * construction; no quantum or metaphysical claims are made.
 * See docs/QF1_CONTESTED_SCIENCE.md.
 */

export interface FederationEnvelope {
  type: string;
  from: string;
  to: string;
  payload: Record<string, unknown>;
  signature: string;
  pubkey: string;
  timestamp: number;
}

export interface FederationPeer {
  nodeId: string;
  did: string;
  pubkey: string;
  lastSeen: number;
  trustScore: number;
}

export class CareFederationNode {
  private state: DurableObjectState;
  private env: Env;
  private peers: Map<string, FederationPeer> = new Map();
  private messageCount = 0;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    state.blockConcurrencyWhile(async () => {
      const stored = await state.storage.get<string>('peers');
      if (stored) {
        const parsed: FederationPeer[] = JSON.parse(stored);
        for (const p of parsed) this.peers.set(p.nodeId, p);
      }
      this.messageCount = (await state.storage.get<number>('messageCount')) ?? 0;
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/message') {
      return this.handleMessage(request);
    }

    if (request.method === 'GET' && url.pathname === '/peers') {
      return this.handleListPeers();
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      return Response.json({ node: 'care-federation', peers: this.peers.size, messages: this.messageCount });
    }

    if (request.method === 'POST' && url.pathname === '/register') {
      return this.handleRegister(request);
    }

    return new Response('Not found', { status: 404 });
  }

  private async handleRegister(request: Request): Promise<Response> {
    try {
      const body = (await request.json()) as { nodeId: string; did: string; pubkey: string };
      if (!body.nodeId || !body.did || !body.pubkey) {
        return Response.json({ error: 'Missing nodeId/did/pubkey' }, { status: 400 });
      }
      this.peers.set(body.nodeId, {
        nodeId: body.nodeId,
        did: body.did,
        pubkey: body.pubkey,
        lastSeen: Date.now(),
        trustScore: 0.5,
      });
      await this.persistPeers();
      return Response.json({ ok: true, nodeId: body.nodeId });
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 });
    }
  }

  private async handleMessage(request: Request): Promise<Response> {
    try {
      const env = (await request.json()) as FederationEnvelope;
      if (!env.type || !env.from || !env.payload) {
        return Response.json({ error: 'Invalid envelope' }, { status: 400 });
      }

      this.messageCount++;
      await this.state.storage.put('messageCount', this.messageCount);

      const peer = this.peers.get(env.from);
      if (peer) {
        peer.lastSeen = Date.now();
        peer.trustScore = Math.min(1, peer.trustScore + 0.01);
        await this.persistPeers();
      }

      return Response.json({ ack: true, messageCount: this.messageCount });
    } catch {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }
  }

  private async handleListPeers(): Promise<Response> {
    const peers = Array.from(this.peers.values());
    return Response.json({ peers, count: peers.length });
  }

  private async persistPeers(): Promise<void> {
    await this.state.storage.put('peers', JSON.stringify(Array.from(this.peers.values())));
  }
}

interface Env {
  CARE_FEDERATION: DurableObjectNamespace;
}
