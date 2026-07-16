import { DurableObject } from 'cloudflare:workers';
import { verifyRequest, unauthorizedResponse } from '../../lib/edge/verify';
import { logEvent } from '../../lib/edge/logging';

export interface Env {
  CONTRACT_ENGINE: DurableObjectNamespace;
  LOVE_DB: D1Database;
  CONTRACTS_DB: D1Database;
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3, label = 'd1_query'): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, 100 * Math.pow(2, i)));
      }
    }
  }
  logEvent({ event: `${label}_retry_exhausted`, service: 'contract-engine', success: false, error: String(lastErr) });
  throw lastErr;
}

export class ContractEngine extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    return new Response('Legacy DO endpoint');
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    if (method === 'GET' && url.pathname === '/health') {
      const dbCheck = await withRetry(() => env.CONTRACTS_DB.prepare('SELECT 1 as ok').first(), 3, 'health_db_check');
      return new Response(JSON.stringify({ status: 'ok', service: 'contract-engine', timestamp: new Date().toISOString() }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (method === 'GET' && url.pathname === '/contract') {
      const contractId = url.searchParams.get('contractId') || 'default';

      const result = await withRetry(
        () => env.CONTRACTS_DB.prepare(
          `SELECT id, type, status, title, description,
                  party_a_did, party_b_did, party_a_signature, party_b_signature,
                  terms_json, stakes_json, metadata_json, hash_chain_json,
                  created_at, updated_at, activated_at, fulfilled_at, dissolved_at
           FROM contracts WHERE id = ?`
        ).bind(contractId).first(),
        3,
        'contract_get'
      );

      if (!result) {
        return new Response(JSON.stringify({ contract: null }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const contract = {
        id: result.id,
        type: result.type,
        status: result.status,
        title: result.title,
        description: result.description,
        parties: [
          { did: result.party_a_did, displayName: '', signedAt: '', signature: result.party_a_signature || '' },
          { did: result.party_b_did, displayName: '', signedAt: '', signature: result.party_b_signature || '' }
        ],
        terms: JSON.parse(result.terms_json),
        stakes: JSON.parse(result.stakes_json),
        metadata: JSON.parse(result.metadata_json),
        hashChain: JSON.parse(result.hash_chain_json),
        signatures: {
          partyA: result.party_a_signature || '',
          partyB: result.party_b_signature || ''
        },
        createdAt: result.created_at,
        updatedAt: result.updated_at,
        activatedAt: result.activated_at,
        fulfilledAt: result.fulfilled_at,
        dissolvedAt: result.dissolved_at,
      };

      return new Response(JSON.stringify({ contract }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (method === 'POST' && url.pathname === '/contract/initiate') {
      try {
        if (!await verifyRequest(request, 'partyADid')) {
          logEvent({ event: 'initiate_sig_fail', service: 'contract-engine', success: false });
          return unauthorizedResponse();
        }
        const body = jsonBodySafe(await request.text());
        const requesterDid = body.partyADid || body.did || '';
        const otherDid = body.partyBDid || '';
        const id = body.id || `contract-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        const now = Date.now();

        const terms = Array.isArray(body.terms) ? body.terms : [];
        const stakes = Array.isArray(body.stakes) ? body.stakes : [];
        const metadataRaw = body.metadata && typeof body.metadata === 'object' ? body.metadata : null;

        const termsJson = JSON.stringify(terms);
        const stakesJson = JSON.stringify(stakes);
        const metadataJson = metadataRaw ? JSON.stringify(metadataRaw) : JSON.stringify({
          jurisdiction: 'Georgia',
          governingLaw: 'O.C.G.A.',
          version: '1.0.0'
        });
        const hashChainJson = JSON.stringify([]);

        const bound = await withRetry(
          () => env.CONTRACTS_DB.prepare(
            `INSERT INTO contracts (
              id, type, status, title, description,
              party_a_did, party_b_did, party_a_signature, party_b_signature,
              terms_json, stakes_json, metadata_json, hash_chain_json,
              created_at, updated_at
            ) VALUES (
              ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
            )`
          ).bind(
            id,
            'ROCCA',
            'draft',
            body.title || 'Untitled Contract',
            body.description || '',
            requesterDid,
            otherDid,
            '',
            '',
            termsJson,
            stakesJson,
            metadataJson,
            hashChainJson,
            now,
            now
          ).run(),
          3,
          'contract_insert'
        );

        logEvent({
          event: 'contract_initiated',
          service: 'contract-engine',
          did: requesterDid,
          success: true,
          data: { contractId: id, partyBDid: otherDid, title: body.title },
        });

        const responseBody = {
          contract: {
            id,
            type: 'ROCCA',
            status: 'draft',
            title: body.title || 'Untitled Contract',
            description: body.description || '',
            parties: [
              { did: requesterDid, displayName: '', signedAt: '', signature: '' },
              { did: otherDid, displayName: '', signedAt: '', signature: '' }
            ],
            terms,
            stakes,
            metadata: metadataRaw ?? JSON.parse(metadataJson),
            hashChain: [],
            signatures: { partyA: '', partyB: '' },
            createdAt: now,
            updatedAt: now,
            activatedAt: '',
            fulfilledAt: '',
            dissolvedAt: '',
          },
          message: 'Contract initiated',
        };

        return new Response(JSON.stringify(responseBody), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err: any) {
        console.error('/contract/initiate error:', err);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    if (method === 'POST' && url.pathname === '/contract/sign') {
      if (!await verifyRequest(request, 'partyId')) {
        logEvent({ event: 'sign_sig_fail', service: 'contract-engine', success: false });
        return unauthorizedResponse();
      }
      try {
        const body = jsonBodySafe(await request.text());
        const contractId = body.contractId || '';
        const partyId = body.partyId || '';
        const signature = body.signature || '';

        if (!contractId || !partyId) {
          return new Response(JSON.stringify({ error: 'contractId and partyId required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const current = await withRetry(
          () => env.CONTRACTS_DB.prepare(
            'SELECT id, party_a_did, party_b_did FROM contracts WHERE id = ?'
          ).bind(contractId).first(),
          3,
          'contract_sign_get'
        );

        if (!current) {
          return new Response(JSON.stringify({ error: 'Contract not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const isPartyA = current.party_a_did === partyId;
        const isPartyB = current.party_b_did === partyId;

        if (!isPartyA && !isPartyB) {
          return new Response(JSON.stringify({ error: 'Party not a party to contract' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const now = Date.now();
        const updateSql = isPartyA
          ? 'UPDATE contracts SET party_a_signature = ?, updated_at = ? WHERE id = ?'
          : 'UPDATE contracts SET party_b_signature = ?, updated_at = ? WHERE id = ?';

        await withRetry(
          () => env.CONTRACTS_DB.prepare(updateSql).bind(signature, now, contractId).run(),
          3,
          'contract_sign_update'
        );

        logEvent({
          event: 'contract_signed',
          service: 'contract-engine',
          did: partyId,
          success: true,
          data: { contractId, signedAs: isPartyA ? 'partyA' : 'partyB' },
        });

        return new Response(JSON.stringify({ ok: true, contractId, signedBy: partyId, signedAs: isPartyA ? 'partyA' : 'partyB' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err: any) {
        console.error('/contract/sign error:', err);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    if (method === 'POST' && url.pathname === '/contract/activate') {
      if (!await verifyRequest(request, 'partyADid')) {
        return unauthorizedResponse();
      }
      try {
        const body = jsonBodySafe(await request.text());
        const contractId = body.contractId || '';

        if (!contractId) {
          return new Response(JSON.stringify({ error: 'contractId required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const now = Date.now();
        const result = await withRetry(
          () => env.CONTRACTS_DB.prepare(
            'UPDATE contracts SET status = ?, activated_at = ?, updated_at = ? WHERE id = ? AND status = ?'
          ).bind('active', now, now, contractId, 'draft').run(),
          3,
          'contract_activate'
        );

        if (result.meta.changed_row_count === 0) {
          return new Response(JSON.stringify({ error: 'Contract not found or not in draft' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({ ok: true, contractId, status: 'active', activatedAt: now }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err: any) {
        console.error('/contract/activate error:', err);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    if (method === 'POST' && url.pathname === '/contract/fulfill') {
      if (!await verifyRequest(request, 'partyADid')) {
        logEvent({ event: 'fulfill_sig_fail', service: 'contract-engine', success: false });
        return unauthorizedResponse();
      }
      try {
        const body = jsonBodySafe(await request.text());
        const contractId = body.contractId || '';
        const attestation = body.attestation || null;

        const now = Date.now();
        const result = await withRetry(
          () => env.CONTRACTS_DB.prepare(
            'UPDATE contracts SET status = ?, fulfilled_at = ?, updated_at = ? WHERE id = ? AND status = ?'
          ).bind('fulfilled', now, now, contractId, 'active').run(),
          3,
          'contract_fulfill'
        );

        if (result.meta.changed_row_count === 0) {
          return new Response(JSON.stringify({ error: 'Contract not found or not active' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        logEvent({
          event: 'contract_fulfilled',
          service: 'contract-engine',
          success: true,
          data: { contractId },
        });

        return new Response(JSON.stringify({ ok: true, contractId, status: 'fulfilled', fulfilledAt: now, attestation: attestation ? JSON.parse(attestation) : null }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err: any) {
        logEvent({ event: 'fulfill_failed', service: 'contract-engine', success: false, data: { error: err.message || String(err) } });
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    if (method === 'POST' && url.pathname === '/contract/dissolve') {
      if (!await verifyRequest(request, 'partyADid')) {
        logEvent({ event: 'dissolve_sig_fail', service: 'contract-engine', success: false });
        return unauthorizedResponse();
      }
      try {
        const body = jsonBodySafe(await request.text());
        const contractId = body.contractId || '';
        const reason = body.reason || '';

        const now = Date.now();
        const result = await withRetry(
          () => env.CONTRACTS_DB.prepare(
            'UPDATE contracts SET status = ?, dissolved_at = ?, updated_at = ? WHERE id = ? AND status IN (?, ?)'
          ).bind('dissolved', now, now, contractId, 'draft', 'active').run(),
          3,
          'contract_dissolve'
        );

        if (result.meta.changed_row_count === 0) {
          return new Response(JSON.stringify({ error: 'Contract not found or cannot be dissolved' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        logEvent({
          event: 'contract_dissolved',
          service: 'contract-engine',
          success: true,
          data: { contractId, reason },
        });

        return new Response(JSON.stringify({ ok: true, contractId, status: 'dissolved', dissolvedAt: now, reason }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err: any) {
        logEvent({ event: 'dissolve_failed', service: 'contract-engine', success: false, data: { error: err.message || String(err) } });
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  },
};

function jsonBodySafe(text: string): Record<string, any> {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}
