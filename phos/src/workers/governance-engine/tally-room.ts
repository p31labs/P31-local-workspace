import { DurableObject } from 'cloudflare:workers';

export interface Env {
  GOVERNANCE_DB: D1Database;
}

export class TallyRoom extends DurableObject {
  private sessions: Map<string, WebSocket> = new Map();
  private proposalId: string | null = null;
  private currentTally: any = null;
  private pollInterval: any = null;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const proposalId = url.searchParams.get('proposalId');
    if (!proposalId) {
      return new Response('proposalId required', { status: 400 });
    }

    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
      return new Response(JSON.stringify({ error: 'Expected WebSocket upgrade', wsUrl: `/tally?proposalId=${encodeURIComponent(proposalId)}` }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (this.proposalId && this.proposalId !== proposalId) {
      for (const [_, ws] of this.sessions) { try { ws.close(1000, 'New proposal'); } catch {} }
      this.sessions.clear();
      this.stopPolling();
    }
    this.proposalId = proposalId;

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    this.ctx.acceptWebSocket(server);
    const sessionId = crypto.randomUUID();
    this.sessions.set(sessionId, server);

    const tally = await this.fetchTally();
    this.currentTally = tally;
    try { server.send(JSON.stringify({ type: 'tally_update', proposalId, tally, timestamp: Date.now() })); } catch {}

    if (this.sessions.size === 1) {
      this.startPolling();
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    try {
      const data = JSON.parse(message as string);
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      }
    } catch {}
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    for (const [id, socket] of this.sessions) {
      if (socket === ws) { this.sessions.delete(id); break; }
    }
    if (this.sessions.size === 0) this.stopPolling();
  }

  private startPolling(): void {
    if (this.pollInterval) return;
    this.pollInterval = setInterval(async () => {
      try {
        const tally = await this.fetchTally();
        if (JSON.stringify(tally) !== JSON.stringify(this.currentTally)) {
          this.currentTally = tally;
          this.broadcast();
        }
      } catch {}
    }, 2000);
  }

  private stopPolling(): void {
    if (this.pollInterval) { clearInterval(this.pollInterval); this.pollInterval = null; }
  }

  private async fetchTally(): Promise<any> {
    if (!this.proposalId) return null;
    const result = await this.env.GOVERNANCE_DB.prepare(`
      WITH RECURSIVE delegation_chain AS (
        SELECT v.voter_did, v.choice AS vote_type, 1 AS depth
        FROM votes v WHERE v.proposal_id = ?
        UNION ALL
        SELECT d.delegate_did, dc.vote_type, dc.depth + 1
        FROM delegation_chain dc
        JOIN vote_delegations d ON d.delegator_did = dc.voter_did
          AND d.revoked = 0 AND (d.expires_at IS NULL OR d.expires_at > unixepoch())
        WHERE dc.depth < 10
      )
      SELECT vote_type, COUNT(*) AS weighted_count FROM delegation_chain GROUP BY vote_type
    `).bind(this.proposalId).all();

    const counts = { for: 0, against: 0, abstain: 0 };
    (result.results || []).forEach((row: any) => {
      if (row.vote_type === 'for') counts.for = row.weighted_count;
      else if (row.vote_type === 'against') counts.against = row.weighted_count;
      else if (row.vote_type === 'abstain') counts.abstain = row.weighted_count;
    });
    return { counts, totalWeighted: counts.for + counts.against + counts.abstain, timestamp: Date.now() };
  }

  private broadcast(): void {
    if (!this.proposalId || !this.currentTally) return;
    const msg = JSON.stringify({ type: 'tally_update', proposalId: this.proposalId, tally: this.currentTally, timestamp: Date.now() });
    for (const [_, ws] of this.sessions) { try { ws.send(msg); } catch {} }
  }
}
