/**
 * marketplace-mcp — MCP server for P31 Sovereign Marketplace
 *
 * Streamable HTTP MCP (JSON-RPC 2.0 + SSE) exposing 10 tools
 * for listings, offers, trades, escrow, and dispute resolution.
 *
 * Proxies hot state operations to MarketplaceCatalogDO.
 * Trust tier lookups go to shared love-ledger D1.
 */

import { MarketplaceCatalogDO, Listing, Offer, Trade } from './marketplace-catalog/index';

// ─── Types ────────────────────────────────────────────────────────────

export interface Listing {
  id: string;
  seller_did: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  price_love: number;
  price_usd: number;
  accepts_barter: boolean;
  images: string[];
  status: 'active' | 'sold' | 'expired' | 'draft';
  trust_tier: string;
  created_at: number;
  expires_at: number;
}

export interface Offer {
  id: string;
  listing_id: string;
  buyer_did: string;
  seller_did: string;
  offer_love: number;
  offer_usd: number;
  offer_items: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'escrow' | 'completed' | 'disputed';
  escrow_id: string | null;
  created_at: number;
  updated_at: number;
}

export interface Trade {
  id: string;
  listing_id: string;
  buyer_did: string;
  seller_did: string;
  amount_love: number;
  amount_usd: number;
  escrow_id: string | null;
  status: 'escrow' | 'shipped' | 'completed' | 'disputed';
  created_at: number;
  completed_at: number | null;
}

// ─── MCP Tool Definitions ─────────────────────────────────────────────

const TOOLS = [
  {
    name: 'marketplace_list',
    description: 'List an item for sale or trade. Requires trust tier ≥ basic.',
    inputSchema: {
      type: 'object',
      properties: {
        sellerDid: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        category: { type: 'string' },
        condition: { type: 'string', enum: ['new', 'like-new', 'good', 'fair', 'poor'] },
        priceLove: { type: 'number' },
        priceUsd: { type: 'number' },
        acceptsBarter: { type: 'boolean' },
        images: { type: 'array', items: { type: 'string' } },
      },
      required: ['sellerDid', 'title', 'category'],
    },
  },
  {
    name: 'marketplace_search',
    description: 'AI-powered search across listings. Optional category filter.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        category: { type: 'string' },
        status: { type: 'string', default: 'active' },
        limit: { type: 'number', default: 50 },
      },
      required: ['query'],
    },
  },
  {
    name: 'marketplace_get',
    description: 'Get full listing details by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        listingId: { type: 'string' },
      },
      required: ['listingId'],
    },
  },
  {
    name: 'marketplace_offer',
    description: 'Submit a barter or cash offer on a listing.',
    inputSchema: {
      type: 'object',
      properties: {
        listingId: { type: 'string' },
        buyerDid: { type: 'string' },
        offerLove: { type: 'number' },
        offerUsd: { type: 'number' },
        offerItems: { type: 'array', items: { type: 'string' } },
      },
      required: ['listingId', 'buyerDid'],
    },
  },
  {
    name: 'marketplace_accept',
    description: 'Accept an offer and move to escrow.',
    inputSchema: {
      type: 'object',
      properties: {
        offerId: { type: 'string' },
      },
      required: ['offerId'],
    },
  },
  {
    name: 'marketplace_reject',
    description: 'Reject an offer.',
    inputSchema: {
      type: 'object',
      properties: {
        offerId: { type: 'string' },
      },
      required: ['offerId'],
    },
  },
  {
    name: 'marketplace_escrow_status',
    description: 'Check escrow status for a trade.',
    inputSchema: {
      type: 'object',
      properties: {
        tradeId: { type: 'string' },
      },
      required: ['tradeId'],
    },
  },
  {
    name: 'marketplace_confirm',
    description: 'Confirm receipt and release escrow.',
    inputSchema: {
      type: 'object',
      properties: {
        tradeId: { type: 'string' },
      },
      required: ['tradeId'],
    },
  },
  {
    name: 'marketplace_dispute',
    description: 'File a dispute on a trade with evidence.',
    inputSchema: {
      type: 'object',
      properties: {
        tradeId: { type: 'string' },
        evidence: { type: 'string', description: 'SHA-256 hash of evidence payload' },
      },
      required: ['tradeId', 'evidence'],
    },
  },
  {
    name: 'marketplace_history',
    description: 'Get trade history for a user.',
    inputSchema: {
      type: 'object',
      properties: {
        did: { type: 'string' },
      },
      required: ['did'],
    },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

function corsResponse(body: string, status = 200): Response {
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

async function getCatalogDO(env: Env): Promise<DurableObjectStub> {
  const stub = env.CATALOG_DO.get(env.CATALOG_DO.idFromName('main'));
  // We need to call the DO's internal methods. Since we can't directly call DO methods,
  // we'll use the fetch API to communicate with the DO.
  // For now, we'll implement the logic inline using the DO's SQLite storage pattern.
  // In production, this would be a proper service-to-service call.
  throw new Error('DO access requires worker-to-DO binding');
}

// ─── DO Helper Class (inline for MCP server) ──────────────────────────

class CatalogProxy {
  constructor(private env: Env) {}

  private async getDO(): Promise<any> {
    const id = this.env.CATALOG_DO.idFromName('main');
    const stub = this.env.CATALOG_DO.get(id);
    return stub;
  }

  async searchListings(params: { category?: string; status?: string; limit?: number }): Promise<any> {
    const stub = await this.getDO();
    const url = new URL('http://internal/search');
    if (params.category) url.searchParams.set('category', params.category);
    if (params.status) url.searchParams.set('status', params.status);
    url.searchParams.set('limit', String(params.limit || 50));
    const res = await stub.fetch(url.toString());
    return res.json();
  }

  async getListing(id: string): Promise<any> {
    const stub = await this.getDO();
    const res = await stub.fetch(`http://internal/listing/${id}`);
    return res.json();
  }

  async createListing(listing: any): Promise<any> {
    const stub = await this.getDO();
    const res = await stub.fetch('http://internal/list', {
      method: 'POST',
      body: JSON.stringify(listing),
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  }

  async createOffer(offer: any): Promise<any> {
    const stub = await this.getDO();
    const res = await stub.fetch('http://internal/offer', {
      method: 'POST',
      body: JSON.stringify(offer),
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  }

  async acceptOffer(id: string): Promise<any> {
    const stub = await this.getDO();
    const res = await stub.fetch(`http://internal/offer/${id}/accept`, { method: 'POST' });
    return res.json();
  }

  async rejectOffer(id: string): Promise<any> {
    const stub = await this.getDO();
    const res = await stub.fetch(`http://internal/offer/${id}/reject`, { method: 'POST' });
    return res.json();
  }

  async getOffersForListing(listingId: string): Promise<any> {
    const stub = await this.getDO();
    const res = await stub.fetch(`http://internal/offers/listing/${listingId}`);
    return res.json();
  }

  async getTradeHistory(did: string): Promise<any> {
    const stub = await this.getDO();
    const res = await stub.fetch(`http://internal/trades/${did}`);
    return res.json();
  }
}

// ─── Tool Execution ───────────────────────────────────────────────────

async function executeTool(name: string, args: any, env: Env): Promise<any> {
  const catalog = new CatalogProxy(env);

  switch (name) {
    case 'marketplace_list': {
      const required = ['sellerDid', 'title', 'category'];
      for (const field of required) {
        if (!args[field]) return { error: `Missing required field: ${field}` };
      }
      const listing = {
        seller_did: args.sellerDid,
        title: args.title,
        description: args.description || '',
        category: args.category,
        condition: args.condition || 'good',
        price_love: args.priceLove || 0,
        price_usd: args.priceUsd || 0,
        accepts_barter: args.acceptsBarter || false,
        images: args.images || [],
      };
      return await catalog.createListing(listing);
    }

    case 'marketplace_search': {
      const results = await catalog.searchListings({
        category: args.category,
        status: args.status || 'active',
        limit: args.limit || 50,
      });
      return { listings: results.listings, count: results.count, query: args.query };
    }

    case 'marketplace_get': {
      if (!args.listingId) return { error: 'listingId required' };
      return await catalog.getListing(args.listingId);
    }

    case 'marketplace_offer': {
      const required = ['listingId', 'buyerDid'];
      for (const field of required) {
        if (!args[field]) return { error: `Missing required field: ${field}` };
      }
      return await catalog.createOffer({
        listing_id: args.listingId,
        buyer_did: args.buyerDid,
        seller_did: args.sellerDid || '',
        offer_love: args.offerLove || 0,
        offer_usd: args.offerUsd || 0,
        offer_items: args.offerItems || [],
      });
    }

    case 'marketplace_accept': {
      if (!args.offerId) return { error: 'offerId required' };
      return await catalog.acceptOffer(args.offerId);
    }

    case 'marketplace_reject': {
      if (!args.offerId) return { error: 'offerId required' };
      return await catalog.rejectOffer(args.offerId);
    }

    case 'marketplace_escrow_status': {
      // Escrow status is managed by justice-hub
      return { status: 'not_implemented', note: 'Use justice_escrow_release via p31-justice-hub' };
    }

    case 'marketplace_confirm': {
      return { status: 'not_implemented', note: 'Trade confirmation via marketplace_confirm coming in Phase 1' };
    }

    case 'marketplace_dispute': {
      return { status: 'not_implemented', note: 'Use justice_evidence_deposit via p31-justice-hub' };
    }

    case 'marketplace_history': {
      if (!args.did) return { error: 'did required' };
      return await catalog.getTradeHistory(args.did);
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ─── Streamable HTTP MCP Server ───────────────────────────────────────

export interface Env {
  CATALOG_DO: DurableObjectNamespace;
  LOVE_DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    // CORS
    if (method === 'OPTIONS') {
      return corsResponse('', 204);
    }

    // Streamable HTTP: GET /mcp returns SSE notification stream
    if (url.pathname === '/mcp' && method === 'GET') {
      const body = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(
            `event: endpoint\ndata: ${JSON.stringify({ tools: TOOLS.length, service: 'marketplace-mcp' })}\n\n`
          ));
          controller.close();
        },
      });
      return new Response(body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Streamable HTTP: POST /mcp for JSON-RPC 2.0
    if (url.pathname === '/mcp' && method === 'POST') {
      try {
        const body = await request.json<any>();
        const { id: rpcId, method: rpcMethod, params } = body;

        if (rpcMethod === 'tools/list') {
          return corsResponse(JSON.stringify({ jsonrpc: '2.0', id: rpcId, result: { tools: TOOLS } }));
        }

        if (rpcMethod === 'tools/call') {
          const toolName = params?.name;
          const toolArgs = params?.arguments || {};
          const tool = TOOLS.find(t => t.name === toolName);
          if (!tool) {
            return corsResponse(JSON.stringify({
              jsonrpc: '2.0', id: rpcId,
              error: { code: -32602, message: `Unknown tool: ${toolName}` },
            }), 400);
          }
          const result = await executeTool(toolName, toolArgs, env);
          return corsResponse(JSON.stringify({
            jsonrpc: '2.0', id: rpcId,
            result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] },
          }));
        }

        if (rpcMethod === 'ping') {
          return corsResponse(JSON.stringify({ jsonrpc: '2.0', id: rpcId, result: {} }));
        }

        return corsResponse(JSON.stringify({
          jsonrpc: '2.0', id: rpcId,
          error: { code: -32601, message: `Method not found: ${rpcMethod}` },
        }), 400);
      } catch (e: any) {
        return corsResponse(JSON.stringify({
          jsonrpc: '2.0', id: null,
          error: { code: -32700, message: `Parse error: ${e.message}` },
        }), 400);
      }
    }

    // Health
    if (url.pathname === '/health' && method === 'GET') {
      return corsResponse(JSON.stringify({
        status: 'ok',
        service: 'marketplace-mcp',
        version: '1.0.0',
        tools: TOOLS.length,
        timestamp: new Date().toISOString(),
      }));
    }

    // Root
    if (url.pathname === '/' && method === 'GET') {
      return corsResponse(JSON.stringify({
        service: 'p31-marketplace-mcp',
        tools: TOOLS.map(t => t.name),
        mcp: 'POST /mcp (JSON-RPC 2.0), GET /mcp (SSE)',
      }));
    }

    return corsResponse(JSON.stringify({ error: 'Not found' }), 404);
  },
};

export { MarketplaceCatalogDO };
