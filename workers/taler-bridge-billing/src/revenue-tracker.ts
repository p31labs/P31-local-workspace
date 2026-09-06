import { DurableObject } from 'cloudflare:workers';

export interface RevenueEvent {
  wallet: string;
  amount: string;
  source: string;
  timestamp: number;
  txId?: string;
}

export class RevenueTracker extends DurableObject {
  private totalRevenue: number = 0;
  private recentEvents: RevenueEvent[] = [];

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/' || url.pathname === '') {
      return Response.json({ totalRevenue: String(this.totalRevenue), recentEvents: this.recentEvents.slice(0, 50) });
    }

    if (url.pathname === '/record' && request.method === 'POST') {
      const body = await request.json() as RevenueEvent;
      const amount = parseFloat(body.amount) || 0;
      this.totalRevenue += amount;
      this.recentEvents.unshift({ ...body, amount: String(amount) });
      if (this.recentEvents.length > 100) this.recentEvents.length = 100;
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'not found' }, { status: 404 });
  }
}
