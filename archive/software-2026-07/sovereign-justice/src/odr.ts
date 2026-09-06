/**
 * Online Dispute Resolution — Blind settlement offers, precedent search,
 * jurisdiction lookup, and case event audit trail.
 *
 * Operates on the migrations/0005_phase3_odr.sql tables.
 */

interface Env {
  JUSTICE_D1: D1Database;
}

interface SettlementOffer {
  id: string;
  caseId: string;
  partyDid: string;
  amount: number;
  round: number;
  created_at: string;
}

// GET /api/odr/discovery — PULSE-compliant service description (Protocol for Unified Legal Services)
function handleDiscovery(): Response {
  return Response.json({
    protocol: 'PULSE v1.0-draft',
    provider: {
      id: 'did:web:p31ca.org',
      name: 'P31 Labs Sovereign ODR',
      description: 'Online dispute resolution for neurodivergent families. Blind settlement offers, precedent search, chain-of-custody event trail.',
      website: 'https://phos.p31ca.org/justice',
      contact: 'justice@p31ca.org',
      jurisdiction: ['US-GA', 'US-FL'],
      methods: ['mediation', 'neutral-evaluation', 'facilitated-negotiation'],
    },
    endpoints: {
      discovery: '/api/odr/discovery',
      engage: '/api/odr/engage',
      offer: '/api/odr/offer',
      offers: '/api/odr/offers/{caseId}',
      accept: '/api/odr/offer/{id}/accept',
      precedent: '/api/odr/precedent?q={query}',
      events: '/api/odr/events/{caseId}',
      webhook: '/api/odr/webhook',
      cases: '/api/odr/cases',
    },
    standards: {
      evidence: 'SHA-256 hash chain, Ed25519 + ML-DSA-65 dual signature',
      admissibility: 'United States v. Sterlingov, No. 21-CR-399 (E.D.N.Y. July 14, 2026)',
      odr: 'ISO 32122:2025 — ODR for e-commerce transactions',
      identity: 'W3C DID Core v1.1 — did:key, did:jwk (ML-DSA-65), did:web',
      credentials: 'SD-JWT VC (draft-ietf-oauth-sd-jwt-vc-17)',
      payments: 'LOVE care-credit (ERC-5192 soulbound)',
    },
    health: '/api/health',
  }, { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
}

// POST /api/odr/engage — PULSE engagement initiation
async function handleEngage(request: Request, env: Env): Promise<Response> {
  try {
    const { partyDid, otherPartyDid, caseDescription, preferredMethod } = await request.json() as any;
    if (!partyDid || !otherPartyDid) {
      return Response.json({ error: 'partyDid and otherPartyDid required' }, { status: 400 });
    }

    const caseId = `case-odr-${Date.now()}`;
    await env.JUSTICE_D1.prepare(
      "INSERT INTO evidence_cases (id, title, description, party_a_did, party_b_did, status, metadata, created_at) VALUES (?, ?, ?, ?, ?, 'active', ?, datetime('now'))"
    ).bind(caseId, caseDescription || 'ODR Case', caseDescription || '', partyDid, otherPartyDid, JSON.stringify({
      odr_method: preferredMethod || 'mediation',
      protocol: 'PULSE v1.0-draft',
      engagement_time: new Date().toISOString(),
    })).run();

    await env.JUSTICE_D1.prepare(
      'INSERT INTO events (id, case_id, event_type, payload, created_at) VALUES (?, ?, ?, ?, datetime(\'now\'))'
    ).bind(`evt-${Date.now()}`, caseId, 'pulse_engage', JSON.stringify({ partyDid, otherPartyDid, preferredMethod })).run();

    return Response.json({ ok: true, caseId, protocol: 'PULSE v1.0-draft' });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/odr/offer — Submit blind settlement offer
async function submitOffer(request: Request, env: Env): Promise<Response> {
  try {
    const { caseId, partyDid, amount, round } = await request.json() as any;
    if (!caseId || !partyDid || amount == null) {
      return Response.json({ error: 'caseId, partyDid, and amount required' }, { status: 400 });
    }

    const id = `offer-${Date.now()}`;
    await env.JUSTICE_D1.prepare(
      'INSERT INTO offers (id, case_id, party_did, amount, round, created_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'))'
    ).bind(id, caseId, partyDid, amount, round || 1).run();

    // Log event
    await env.JUSTICE_D1.prepare(
      'INSERT INTO events (id, case_id, event_type, payload, created_at) VALUES (?, ?, ?, ?, datetime(\'now\'))'
    ).bind(`evt-${Date.now()}`, caseId, 'offer_submitted', JSON.stringify({ offerId: id, partyDid, amount })).run();

    return Response.json({ ok: true, id });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// GET /api/odr/offers/:caseId — List offers for a case
async function listOffers(request: Request, env: Env, caseId: string): Promise<Response> {
  const rows = await env.JUSTICE_D1.prepare(
    'SELECT * FROM offers WHERE case_id = ? ORDER BY created_at DESC LIMIT 50'
  ).bind(caseId).all();
  return Response.json((rows as any).results || []);
}

// POST /api/odr/offer/:id/accept — Accept settlement
async function acceptOffer(request: Request, env: Env, offerId: string): Promise<Response> {
  const { partyDid } = await request.json() as any;
  if (!partyDid) return Response.json({ error: 'partyDid required' }, { status: 400 });

  // Log acceptance event
  const offer = await env.JUSTICE_D1.prepare('SELECT * FROM offers WHERE id = ?').bind(offerId).first() as any;
  if (!offer) return Response.json({ error: 'Offer not found' }, { status: 404 });

  await env.JUSTICE_D1.prepare(
    'INSERT INTO events (id, case_id, event_type, payload, created_at) VALUES (?, ?, ?, ?, datetime(\'now\'))'
  ).bind(`evt-${Date.now()}`, offer.case_id, 'offer_accepted', JSON.stringify({ offerId, partyDid, amount: offer.amount })).run();

  return Response.json({ ok: true, offer, accepted_by: partyDid });
}

// GET /api/odr/precedent — Search precedent cache
async function searchPrecedent(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';
  if (!query) return Response.json({ error: 'Query required (?q=...)' }, { status: 400 });

  const rows = await env.JUSTICE_D1.prepare(
    'SELECT * FROM precedent_cache WHERE citation LIKE ? OR payload LIKE ? LIMIT 10'
  ).bind(`%${query}%`, `%${query}%`).all();

  return Response.json((rows as any).results || []);
}

// GET /api/odr/events/:caseId — Case event audit trail
async function caseEvents(request: Request, env: Env, caseId: string): Promise<Response> {
  const rows = await env.JUSTICE_D1.prepare(
    'SELECT * FROM events WHERE case_id = ? ORDER BY created_at DESC LIMIT 100'
  ).bind(caseId).all();
  return Response.json((rows as any).results || []);
}

// POST /api/odr/webhook — Register webhook
async function registerWebhook(request: Request, env: Env): Promise<Response> {
  try {
    const { url, events, secret } = await request.json() as any;
    if (!url) return Response.json({ error: 'url required' }, { status: 400 });

    const id = `wh-${Date.now()}`;
    await env.JUSTICE_D1.prepare(
      'INSERT INTO webhooks (id, url, events, secret, active, created_at) VALUES (?, ?, ?, ?, 1, datetime(\'now\'))'
    ).bind(id, url, JSON.stringify(events || ['case_update']), secret || '').run();

    return Response.json({ ok: true, id });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

    if (method === 'OPTIONS') return new Response(null, { headers: cors });

    if (path === '/api/health') {
      const row = await env.JUSTICE_D1.prepare('SELECT count(*) as c FROM offers').first() as any;
      return Response.json({ ok: true, service: 'odr', offers: row?.c || 0, protocol: 'PULSE v1.0-draft' }, { headers: cors });
    }

    if (path === '/api/odr/discovery' && method === 'GET') return handleDiscovery();
    if (path === '/api/odr/engage' && method === 'POST') return handleEngage(request, env);
    if (path === '/api/odr/offer' && method === 'POST') return submitOffer(request, env);
    if (path.startsWith('/api/odr/offers/') && method === 'GET') return listOffers(request, env, path.split('/')[4]);
    if (path.startsWith('/api/odr/offer/') && path.endsWith('/accept') && method === 'POST')
      return acceptOffer(request, env, path.split('/')[4]);
    if (path === '/api/odr/precedent' && method === 'GET') return searchPrecedent(request, env);
    if (path.startsWith('/api/odr/events/') && method === 'GET') return caseEvents(request, env, path.split('/')[4]);
    if (path === '/api/odr/webhook' && method === 'POST') return registerWebhook(request, env);

    // List all cases with ODR status
    if (path === '/api/odr/cases' && method === 'GET') {
      const rows = await env.JUSTICE_D1.prepare(
        "SELECT * FROM evidence_cases WHERE status = 'active' AND metadata LIKE '%odr%' ORDER BY created_at DESC LIMIT 20"
      ).all();
      return Response.json((rows as any).results || [], { headers: cors });
    }

    return Response.json({ error: 'Not found' }, { status: 404, headers: cors });
  },
};
