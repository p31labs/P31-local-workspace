import { Hono } from 'hono';
import { MarketplaceCatalogDO, Listing, Offer, Trade } from './marketplace-catalog/index';

type Bindings = {
  CATALOG_DO: DurableObjectNamespace<MarketplaceCatalogDO>;
  LOVE_DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

app.use('*', async (c, next) => {
  if (c.req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  await next();
  c.res.headers.set('Access-Control-Allow-Origin', '*');
});

// ─── Helpers ──────────────────────────────────────────────────────────

async function getCatalog(env: Bindings) {
  const id = env.CATALOG_DO.idFromName('main');
  const stub = env.CATALOG_DO.get(id);
  return stub;
}

async function jsonResponse(stub: DurableObjectStub, path: string, method: string, body?: any): Promise<Response> {
  const res = await stub.fetch(`http://internal${path}`, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json' },
  });
  return res;
}

// ─── Listings ─────────────────────────────────────────────────────────

app.post('/api/listings', async (c) => {
  const body = await c.req.json();
  const required = ['sellerDid', 'title', 'category'];
  for (const field of required) {
    if (!body[field]) return c.json({ error: `Missing required field: ${field}` }, 400);
  }

  const listing = {
    seller_did: body.sellerDid,
    title: body.title,
    description: body.description || '',
    category: body.category,
    condition: body.condition || 'good',
    price_love: body.priceLove || 0,
    price_usd: body.priceUsd || 0,
    accepts_barter: body.acceptsBarter || false,
    images: body.images || [],
  };

  const stub = await getCatalog(c.env);
  const res = await jsonResponse(stub, '/list', 'POST', listing);
  return c.json(await res.json(), res.status);
});

app.get('/api/listings', async (c) => {
  const category = c.req.query('category');
  const status = c.req.query('status') || 'active';
  const limit = parseInt(c.req.query('limit') || '50');

  const stub = await getCatalog(c.env);
  const url = new URL('http://internal/search');
  if (category) url.searchParams.set('category', category);
  url.searchParams.set('status', status);
  url.searchParams.set('limit', String(limit));

  const res = await stub.fetch(url.toString());
  const data = await res.json();
  return c.json(data);
});

app.get('/api/listings/:id', async (c) => {
  const id = c.req.param('id');
  const stub = await getCatalog(c.env);
  const res = await jsonResponse(stub, `/listing/${id}`, 'GET');
  const data = await res.json();
  return c.json(data, res.status);
});

app.put('/api/listings/:id/status', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const stub = await getCatalog(c.env);
  const res = await jsonResponse(stub, `/listing/${id}/status`, 'PUT', { status: body.status });
  return c.json(await res.json(), res.status);
});

// ─── Offers ───────────────────────────────────────────────────────────

app.post('/api/offers', async (c) => {
  const body = await c.req.json();
  const required = ['listingId', 'buyerDid'];
  for (const field of required) {
    if (!body[field]) return c.json({ error: `Missing required field: ${field}` }, 400);
  }

  const offer = {
    listing_id: body.listingId,
    buyer_did: body.buyerDid,
    seller_did: body.sellerDid || '',
    offer_love: body.offerLove || 0,
    offer_usd: body.offerUsd || 0,
    offer_items: body.offerItems || [],
  };

  const stub = await getCatalog(c.env);
  const res = await jsonResponse(stub, '/offer', 'POST', offer);
  return c.json(await res.json(), res.status);
});

app.get('/api/offers', async (c) => {
  const listingId = c.req.query('listingId');
  const userId = c.req.query('userId');

  const stub = await getCatalog(c.env);
  if (listingId) {
    const res = await jsonResponse(stub, `/offers/listing/${listingId}`, 'GET');
    return c.json(await res.json());
  }

  if (userId) {
    const res = await jsonResponse(stub, `/offers/user/${userId}`, 'GET');
    return c.json(await res.json());
  }

  return c.json({ error: 'listingId or userId required' }, 400);
});

app.put('/api/offers/:id/accept', async (c) => {
  const id = c.req.param('id');
  const stub = await getCatalog(c.env);
  const res = await jsonResponse(stub, `/offer/${id}/accept`, 'POST');
  return c.json(await res.json(), res.status);
});

app.put('/api/offers/:id/reject', async (c) => {
  const id = c.req.param('id');
  const stub = await getCatalog(c.env);
  const res = await jsonResponse(stub, `/offer/${id}/reject`, 'POST');
  return c.json(await res.json(), res.status);
});

// ─── Trades ───────────────────────────────────────────────────────────

app.get('/api/trades/:userDid', async (c) => {
  const userDid = c.req.param('userDid');
  const status = c.req.query('status');
  const stub = await getCatalog(c.env);
  let url = `/trades/${userDid}`;
  if (status) {
    const u = new URL('http://internal' + url);
    u.searchParams.set('status', status);
    url = u.toString().replace('http://internal', '');
  }
  const res = await jsonResponse(stub, url, 'GET');
  return c.json(await res.json());
});

app.get('/api/trades/:id/sbt', async (c) => {
  const id = c.req.param('id');
  const stub = await getCatalog(c.env);
  const res = await jsonResponse(stub, `/trade/${id}/sbt`, 'GET');
  return c.json(await res.json(), res.status);
});

app.get('/api/escrow/:escrowId', async (c) => {
  const escrowId = c.req.param('escrowId');
  const stub = await getCatalog(c.env);
  const res = await jsonResponse(stub, `/escrow/${escrowId}`, 'GET');
  return c.json(await res.json(), res.status);
});

app.put('/api/trades/:id/complete', async (c) => {
  const id = c.req.param('id');
  const stub = await getCatalog(c.env);
  const res = await jsonResponse(stub, `/trade/${id}/complete`, 'POST');
  return c.json(await res.json(), res.status);
});

app.put('/api/trades/:id/dispute', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const stub = await getCatalog(c.env);
  const res = await jsonResponse(stub, `/trade/${id}/dispute`, 'POST', { evidence: body.evidence });
  return c.json(await res.json(), res.status);
});

// ─── Health ───────────────────────────────────────────────────────────

app.get('/health', (c) => c.json({ ok: true, service: 'marketplace', version: '2.0.0' }));

export { MarketplaceCatalogDO } from './marketplace-catalog/index';
export default app;
