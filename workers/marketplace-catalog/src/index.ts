/**
 * marketplace-catalog — Durable Object for Sovereign Marketplace
 *
 * Uses embedded SQLite for hot listing/offer/trade state.
 * Cold persistence and reputation sync to D1 happens asynchronously.
 */

import { DurableObject, DurableObjectState, DurableObjectNamespace, SqlStorage } from 'cloudflare:workers';

export interface Env {
  CATALOG_DO: DurableObjectNamespace<MarketplaceCatalogDO>;
  LOVE_DB: D1Database;
  LOVE_LEDGER_URL: string;
  JUSTICE_HUB_URL: string;
}

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

// ─── DO Implementation ────────────────────────────────────────────────

export class MarketplaceCatalogDO extends DurableObject<Env> {
  private sql: SqlStorage;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;

    // Initialize tables
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS listings (
        id TEXT PRIMARY KEY,
        seller_did TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        category TEXT DEFAULT 'other',
        condition TEXT DEFAULT 'fair',
        price_love INTEGER DEFAULT 0,
        price_usd INTEGER DEFAULT 0,
        accepts_barter BOOLEAN DEFAULT FALSE,
        images TEXT DEFAULT '[]',
        status TEXT DEFAULT 'active',
        trust_tier TEXT DEFAULT 'basic',
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_listings_status_date ON listings(status, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_did);
      CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
    `);

    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS offers (
        id TEXT PRIMARY KEY,
        listing_id TEXT NOT NULL,
        buyer_did TEXT NOT NULL,
        seller_did TEXT NOT NULL,
        offer_love INTEGER DEFAULT 0,
        offer_usd INTEGER DEFAULT 0,
        offer_items TEXT DEFAULT '[]',
        status TEXT DEFAULT 'pending',
        escrow_id TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_offers_listing ON offers(listing_id);
      CREATE INDEX IF NOT EXISTS idx_offers_buyer ON offers(buyer_did);
      CREATE INDEX IF NOT EXISTS idx_offers_seller ON offers(seller_did);
    `);

    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS trades (
        id TEXT PRIMARY KEY,
        listing_id TEXT NOT NULL,
        buyer_did TEXT NOT NULL,
        seller_did TEXT NOT NULL,
        amount_love INTEGER DEFAULT 0,
        amount_usd INTEGER DEFAULT 0,
        escrow_id TEXT,
        status TEXT DEFAULT 'escrow',
        created_at INTEGER NOT NULL,
        completed_at INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_trades_buyer ON trades(buyer_did);
      CREATE INDEX IF NOT EXISTS idx_trades_seller ON trades(seller_did);
      CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
    `);
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  private json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  private error(message: string, status = 400): Response {
    return this.json({ error: message }, status);
  }

  private async getTrustTier(did: string): Promise<string> {
    try {
      const result = await this.env.LOVE_DB.prepare(
        `SELECT trust_tier FROM profiles WHERE did = ?`
      ).bind(did).first<{ trust_tier: string }>();
      return result?.trust_tier || 'basic';
    } catch {
      return 'basic';
    }
  }

  // ── Listings ────────────────────────────────────────────────────────

  async createListing(body: any): Promise<Response> {
    const required = ['seller_did', 'title', 'category'];
    for (const field of required) {
      if (!body[field]) return this.error(`Missing required field: ${field}`);
    }

    const id = crypto.randomUUID();
    const ts = Date.now();
    const trustTier = await this.getTrustTier(body.seller_did);
    const expiresAt = ts + 30 * 86400000; // 30 days

    this.sql.exec(
      `INSERT INTO listings (id, seller_did, title, description, category, condition, price_love, price_usd, accepts_barter, images, status, trust_tier, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
      id, body.seller_did, body.title, body.description || '', body.category,
      body.condition || 'good', body.price_love || 0, body.price_usd || 0,
      body.accepts_barter ? 1 : 0, JSON.stringify(body.images || []),
      trustTier, ts, expiresAt
    );

    return this.json({ id, status: 'active', trust_tier: trustTier, expires_at: expiresAt });
  }

  async searchListings(params: { category?: string; status?: string; seller_did?: string; limit?: number }): Promise<Response> {
    const status = params.status || 'active';
    const limit = params.limit || 50;
    let query = `SELECT * FROM listings WHERE status = ? AND expires_at > ?`;
    const queryParams: any[] = [status, Date.now()];

    if (params.category) {
      query += ` AND category = ?`;
      queryParams.push(params.category);
    }
    if (params.seller_did) {
      query += ` AND seller_did = ?`;
      queryParams.push(params.seller_did);
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;
    queryParams.push(limit);

    const rows = [...this.sql.exec(query, ...queryParams)];
    const listings = rows.map((row: any) => ({
      ...row,
      images: JSON.parse(row.images || '[]'),
      accepts_barter: !!row.accepts_barter,
    }));

    return this.json({ listings, count: listings.length });
  }

  async getListing(id: string): Promise<Response> {
    const rows = [...this.sql.exec(`SELECT * FROM listings WHERE id = ?`, id)];
    if (rows.length === 0) return this.error('Listing not found', 404);
    const listing = rows[0] as any;
    return this.json({
      ...listing,
      images: JSON.parse(listing.images || '[]'),
      accepts_barter: !!listing.accepts_barter,
    });
  }

  async updateListingStatus(id: string, status: string): Promise<Response> {
    this.sql.exec(`UPDATE listings SET status = ? WHERE id = ?`, status, id);
    return this.json({ id, status });
  }

  // ── Offers ──────────────────────────────────────────────────────────

  async createOffer(body: any): Promise<Response> {
    const required = ['listing_id', 'buyer_did'];
    for (const field of required) {
      if (!body[field]) return this.error(`Missing required field: ${field}`);
    }

    const id = crypto.randomUUID();
    const ts = Date.now();

    this.sql.exec(
      `INSERT INTO offers (id, listing_id, buyer_did, seller_did, offer_love, offer_usd, offer_items, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      id, body.listing_id, body.buyer_did, body.seller_did || '',
      body.offer_love || 0, body.offer_usd || 0,
      JSON.stringify(body.offer_items || []), ts, ts
    );

    return this.json({ id, status: 'pending' });
  }

  async acceptOffer(id: string): Promise<Response> {
    const rows = [...this.sql.exec(`SELECT * FROM offers WHERE id = ?`, id)];
    if (rows.length === 0) return this.error('Offer not found', 404);

    const offer = rows[0] as any;
    const escrowId = `escrow-${crypto.randomUUID()}`;

    this.sql.exec(
      `UPDATE offers SET status = 'escrow', escrow_id = ?, updated_at = ? WHERE id = ?`,
      escrowId, Date.now(), id
    );

    // Mark listing as sold
    this.sql.exec(`UPDATE listings SET status = 'sold' WHERE id = ?`, offer.listing_id);

    // Create trade record
    const tradeId = crypto.randomUUID();
    this.sql.exec(
      `INSERT INTO trades (id, listing_id, buyer_did, seller_did, amount_love, amount_usd, escrow_id, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'escrow', ?)`,
      tradeId, offer.listing_id, offer.buyer_did, offer.seller_did,
      offer.offer_love, offer.offer_usd, escrowId, Date.now()
    );

    // Deposit into Justice Hub escrow
    try {
      await fetch(this.env.JUSTICE_HUB_URL + '/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'justice_escrow_deposit',
          params: {
            escrowId,
            payerDid: offer.buyer_did,
            payeeDid: offer.seller_did,
            arbiterDid: '',
            amount: offer.offer_love,
            condition: 'trade_completion',
          },
        }),
      });
    } catch {
      // Degrade gracefully if Justice Hub is unavailable
    }

    return this.json({ id, status: 'escrow', escrow_id: escrowId, trade_id: tradeId });
  }

  async rejectOffer(id: string): Promise<Response> {
    this.sql.exec(`UPDATE offers SET status = 'rejected', updated_at = ? WHERE id = ?`, Date.now(), id);
    return this.json({ id, status: 'rejected' });
  }

  async getOffersForListing(listingId: string): Promise<Response> {
    const rows = [...this.sql.exec(`SELECT * FROM offers WHERE listing_id = ? ORDER BY created_at DESC`, listingId)];
    const offers = rows.map((row: any) => ({
      ...row,
      offer_items: JSON.parse(row.offer_items || '[]'),
    }));
    return this.json({ offers, count: offers.length });
  }

  async getOffersForUser(did: string): Promise<Response> {
    const rows = [...this.sql.exec(
      `SELECT * FROM offers WHERE buyer_did = ? OR seller_did = ? ORDER BY created_at DESC`,
      did, did
    )];
    const offers = rows.map((row: any) => ({
      ...row,
      offer_items: JSON.parse(row.offer_items || '[]'),
    }));
    return this.json({ offers, count: offers.length });
  }

  // ── Trades ──────────────────────────────────────────────────────────

  async completeTrade(id: string): Promise<Response> {
    const rows = [...this.sql.exec(`SELECT * FROM trades WHERE id = ?`, id)];
    if (rows.length === 0) return this.error('Trade not found', 404);
    const trade = rows[0] as any;

    this.sql.exec(
      `UPDATE trades SET status = 'completed', completed_at = ? WHERE id = ?`,
      Date.now(), id
    );

    // Mint SBT via ledger-bridge
    try {
      await fetch(this.env.LOVE_LEDGER_URL + '/sbt/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          did: trade.buyer_did,
          reason: 'marketplace_trade',
          listing_id: trade.listing_id,
        }),
      });
    } catch {
      // Degrade gracefully if ledger-bridge is unavailable
    }

    // Release escrow via Justice Hub
    if (trade.escrow_id) {
      try {
        await fetch(this.env.JUSTICE_HUB_URL + '/mcp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'justice_escrow_release',
            params: {
              escrowId: trade.escrow_id,
              signerDid: trade.seller_did,
            },
          }),
        });
      } catch {
        // Degrade gracefully if Justice Hub is unavailable
      }
    }

    return this.json({ id, status: 'completed' });
  }

  async disputeTrade(id: string, evidence?: string): Promise<Response> {
    const rows = [...this.sql.exec(`SELECT * FROM trades WHERE id = ?`, id)];
    if (rows.length === 0) return this.error('Trade not found', 404);
    const trade = rows[0] as any;

    this.sql.exec(`UPDATE trades SET status = 'disputed' WHERE id = ?`, id);

    // Create ODR case via Justice Hub
    try {
      await fetch(this.env.JUSTICE_HUB_URL + '/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'justice_odr_offer',
          params: {
            caseId: 'dispute-' + id,
            partyDid: trade.seller_did,
            amount: trade.amount_love,
            round: 1,
          },
        }),
      });
    } catch {
      // Degrade gracefully if Justice Hub is unavailable
    }

    return this.json({ id, status: 'disputed', evidence });
  }

  async getTradeHistory(did: string): Promise<Response> {
    const rows = [...this.sql.exec(
      `SELECT * FROM trades WHERE buyer_did = ? OR seller_did = ? ORDER BY created_at DESC LIMIT 50`,
      did, did
    )];
return this.json({ trades: rows, count: rows.length });
   }

   async getSBTStatus(tradeId: string): Promise<Response> {
     const rows = [...this.sql.exec(`SELECT * FROM trades WHERE id = ?`, tradeId)];
     if (rows.length === 0) return this.error('Trade not found', 404);
     const trade = rows[0] as any;
     return this.json({ tradeId: trade.id, status: trade.status, sbtMinted: trade.status === 'completed', buyerDid: trade.buyer_did });
   }

   async getEscrowStatus(escrowId: string): Promise<Response> {
     const offerRows = [...this.sql.exec(`SELECT * FROM offers WHERE escrow_id = ?`, escrowId)];
     if (offerRows.length === 0) return this.error('Escrow not found', 404);
     const offer = offerRows[0] as any;
     const tradeRows = [...this.sql.exec(`SELECT * FROM trades WHERE escrow_id = ?`, escrowId)];
     const trade = tradeRows[0] as any;
     return this.json({ escrowId, status: offer.status, tradeStatus: trade?.status || 'unknown', offerId: offer.id });
   }

   // ── Health ──────────────────────────────────────────────────────────

  async health(): Promise<Response> {
    const listingCount = [...this.sql.exec(`SELECT COUNT(*) as cnt FROM listings`)][0]?.cnt ?? 0;
    const offerCount = [...this.sql.exec(`SELECT COUNT(*) as cnt FROM offers`)][0]?.cnt ?? 0;
    const tradeCount = [...this.sql.exec(`SELECT COUNT(*) as cnt FROM trades`)][0]?.cnt ?? 0;
    return this.json({
      status: 'ok',
      service: 'marketplace-catalog',
      listings: listingCount,
      offers: offerCount,
      trades: tradeCount,
    });
  }

  // ─── Fetch ──────────────────────────────────────────────────────────

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    const path = url.pathname;

    try {
      // Health
      if (path === '/health' && method === 'GET') {
        return this.health();
      }

      // Listings
      if (path === '/list' && method === 'POST') {
        const body = await request.json<any>();
        return this.createListing(body);
      }

      if (path === '/search' && method === 'GET') {
        const params = {
          category: url.searchParams.get('category') || undefined,
          status: url.searchParams.get('status') || undefined,
          seller_did: url.searchParams.get('seller_did') || undefined,
          limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined,
        };
        return this.searchListings(params);
      }

      const listingMatch = path.match(/^\/listing\/([^/]+)(?:\/status)?$/);
      if (listingMatch) {
        const id = listingMatch[1];
        if (method === 'GET') {
          return this.getListing(id);
        }
        if (method === 'PUT') {
          const body = await request.json<any>();
          return this.updateListingStatus(id, body.status);
        }
      }

      // Offers
      if (path === '/offer' && method === 'POST') {
        const body = await request.json<any>();
        return this.createOffer(body);
      }

      const offerMatch = path.match(/^\/offer\/([^/]+)\/(accept|reject)$/);
      if (offerMatch && method === 'POST') {
        if (offerMatch[2] === 'accept') {
          return this.acceptOffer(offerMatch[1]);
        }
        return this.rejectOffer(offerMatch[1]);
      }

      const offersListingMatch = path.match(/^\/offers\/listing\/([^/]+)$/);
      if (offersListingMatch && method === 'GET') {
        return this.getOffersForListing(offersListingMatch[1]);
      }

      const offersUserMatch = path.match(/^\/offers\/user\/([^/]+)$/);
      if (offersUserMatch && method === 'GET') {
        return this.getOffersForUser(offersUserMatch[1]);
      }

      // Trades
      const tradeMatch = path.match(/^\/trade\/([^/]+)\/(complete|dispute)$/);
      if (tradeMatch && method === 'POST') {
        if (tradeMatch[2] === 'complete') {
          return this.completeTrade(tradeMatch[1]);
        }
        const body = await request.json<any>();
        return this.disputeTrade(tradeMatch[1], body.evidence);
      }

       const tradesMatch = path.match(/^\/trades\/([^/]+)$/);
       if (tradesMatch && method === 'GET') {
         return this.getTradeHistory(tradesMatch[1]);
       }

       // SBT mint status for a trade
       const sbtMatch = path.match(/^\/trade\/([^/]+)\/sbt$/);
       if (sbtMatch && method === 'GET') {
         return this.getSBTStatus(sbtMatch[1]);
       }

       // Escrow status
       const escrowMatch = path.match(/^\/escrow\/([^/]+)$/);
       if (escrowMatch && method === 'GET') {
         return this.getEscrowStatus(escrowMatch[1]);
       }

       return this.error('Not found', 404);
    } catch (e: any) {
      return this.error(e.message || 'Internal error', 500);
    }
  }
}

// ─── Worker Entry Point ──────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // All traffic goes to the DO
    const id = env.CATALOG_DO.idFromName('main');
    const stub = env.CATALOG_DO.get(id);

    // Rewrite the URL to strip /mcp? (if any)
    const newPath = path.replace(/^\/mcp/, '') || '/';
    const req = new Request(
      new URL(newPath + url.search, url.origin).toString(),
      { method: request.method, headers: request.headers, body: request.body }
    );

    return stub.fetch(req);
  },
};
