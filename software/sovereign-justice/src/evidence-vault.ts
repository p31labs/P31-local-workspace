import { requireAuth, getKnownKeys } from './auth';
import { hexToBytes, bytesToHex } from './hex';

interface Env {
  JUSTICE_D1: D1Database;
  EVIDENCE_R2: R2Bucket;
  JUSTICE_KV: KVNamespace;
  EVIDENCE_QUEUE: Queue;
}

interface CaseRequest {
  title: string;
  description?: string;
  partyADid: string;
  partyBDid: string;
  arbitratorDid?: string;
}

const ALLOWED_ORIGINS = ['https://phos.p31ca.org', 'http://localhost:5173'];

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin');
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return {};
  }
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  };
}

export function json(body: unknown, status: number | Request = 200, request?: Request): Response {
  if (status instanceof Request) {
    request = status;
    status = 200;
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...(request ? corsHeaders(request) : {}) },
  });
}

function err(message: string, status: number, request?: Request): Response {
  return new Response(message, { status, headers: request ? corsHeaders(request) : {} });
}

async function verifyEd25519Signature(
  data: string,
  signatureHex: string,
  submitterDid: string,
  knownKeys: Record<string, string>
): Promise<boolean> {
  const publicKeyHex = knownKeys[submitterDid];
  if (!publicKeyHex) return false;

  try {
    const publicKeyBytes = hexToBytes(publicKeyHex);
    const signatureBytes = hexToBytes(signatureHex);
    const publicKey = await crypto.subtle.importKey(
      'raw', publicKeyBytes, { name: 'Ed25519' }, false, ['verify']
    );
    const dataBytes = new TextEncoder().encode(data);
    return crypto.subtle.verify('Ed25519', publicKey, signatureBytes, dataBytes);
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    if (pathParts[0] === 'api' && pathParts[1] === 'evidence') {
      if (pathParts[2] === 'upload' && request.method === 'POST') {
        return this.handleUpload(request, env);
      }
      if (pathParts[2] === 'verify' && pathParts[3] && request.method === 'GET') {
        return this.handleVerify(pathParts[3], env, request, await getKnownKeys(env));
      }
      if (pathParts[2] === 'get' && pathParts[3] && request.method === 'GET') {
        return this.handleGet(pathParts[3], env, request);
      }
      if (pathParts[2] === 'list' && request.method === 'GET') {
        return this.handleList(request, env);
      }
      if (pathParts[2] === 'chain' && pathParts[3] && request.method === 'GET') {
        return this.handleChain(pathParts[3], env, request);
      }
    }

    if (pathParts[0] === 'api' && pathParts[1] === 'cases') {
      if (request.method === 'POST') {
        return this.handleCreateCase(request, env);
      }
      if (pathParts[2] && request.method === 'GET') {
        return this.handleGetCase(pathParts[2], env, request);
      }
      if (pathParts[2] && request.method === 'PATCH') {
        return this.handleUpdateCase(request, pathParts[2], env);
      }
      if (request.method === 'GET') {
        return this.handleListCases(request, env);
      }
    }

    if (pathParts[0] === 'api' && pathParts[1] === 'health' && request.method === 'GET') {
      return json({ status: 'ok', service: 'evidence-vault' }, 200, request);
    }

    return err('Not found', 404, request);
  },

  async handleUpload(request: Request, env: Env): Promise<Response> {
    const knownKeys = await getKnownKeys(env);
    try {
      await requireAuth(request, { knownKeys, requireNonce: false });
    } catch (error) {
      if (error instanceof Response) return error;
      return json({ error: 'Authentication required' }, 401, request);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const caseId = formData.get('caseId') as string;
    const submittedByDid = formData.get('submittedByDid') as string;
    const metadataRaw = formData.get('metadata') as string || '{}';
    const metadata = JSON.parse(metadataRaw);

    if (!file || !caseId || !submittedByDid) {
      return err('Missing required fields: file, caseId, submittedByDid', 400, request);
    }

    const fileData = new Uint8Array(await file.arrayBuffer());
    const evidenceId = crypto.randomUUID();
    const r2Key = `cases/${caseId}/evidence/${evidenceId}/${file.name}`;
    const timestamp = Date.now();

    const hashBuffer = await crypto.subtle.digest('SHA-256', fileData as BufferSource);
    const sha256Hash = bytesToHex(new Uint8Array(hashBuffer));

    let ed25519Signature = '';
    let mldsa65Signature = '';
    try {
      const edKeyPair = await crypto.subtle.generateKey(
        { name: 'Ed25519' }, false, ['sign', 'verify']
      );
      const hashBytes = new TextEncoder().encode(sha256Hash);
      const edSig = await crypto.subtle.sign('Ed25519', edKeyPair.privateKey, hashBytes as BufferSource);
      ed25519Signature = bytesToHex(new Uint8Array(edSig));
    } catch (e) {
      console.log('Ed25519 signing failed:', e);
      ed25519Signature = 'pending_ed25519_key';
    }

    try {
      const mldsaKeyPair = await crypto.subtle.generateKey(
        { name: 'ML-DSA-65' } as AlgorithmIdentifier, false, ['sign', 'verify']
      ).catch(() => { throw new Error('ML-DSA-65 not available'); });
      const hashBytes = new TextEncoder().encode(sha256Hash);
      const mldsaSig = await crypto.subtle.sign(
        { name: 'ML-DSA-65' } as AlgorithmIdentifier,
        mldsaKeyPair.privateKey,
        hashBytes as BufferSource
      );
      mldsa65Signature = bytesToHex(new Uint8Array(mldsaSig));
    } catch (e) {
      console.log('ML-DSA-65 signing failed (may not be available in this runtime):', e);
      mldsa65Signature = 'pending_mldsa65_key';
    }

    const prevEntry = await env.JUSTICE_D1.prepare(`
      SELECT chain_hash FROM evidence_items
      WHERE case_id = ? AND status = 'active'
      ORDER BY created_at DESC LIMIT 1
    `).bind(caseId).first<{ chain_hash: string }>();

    const chainPrevHash = prevEntry?.chain_hash || null;
    const chainInput = JSON.stringify({
      evidenceId, caseId, sha256Hash, prevHash: chainPrevHash, timestamp,
    });
    const chainBuffer = await crypto.subtle.digest(
      'SHA-256', new TextEncoder().encode(chainInput)
    );
    const chainHash = bytesToHex(new Uint8Array(chainBuffer));

    await env.EVIDENCE_R2.put(r2Key, fileData, {
      httpMetadata: { contentType: file.type || 'application/octet-stream' },
      customMetadata: {
        evidenceId, caseId, sha256Hash, submittedByDid,
        ed25519Signature, mldsa65Signature, chainHash,
      },
    });

    await env.JUSTICE_D1.prepare(`
      INSERT INTO evidence_items (id, case_id, submitted_by_did, file_name, file_size, mime_type,
        sha256_hash, r2_key, ed25519_signature, mldsa65_signature, chain_prev_hash, chain_hash, metadata, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'))
    `).bind(
      evidenceId, caseId, submittedByDid, file.name, fileData.length,
      file.type || 'application/octet-stream', sha256Hash, r2Key,
      ed25519Signature, mldsa65Signature, chainPrevHash, chainHash,
      JSON.stringify(metadata)
    ).run();

    await env.JUSTICE_D1.prepare(`
      INSERT INTO evidence_chain (id, evidence_id, action, actor_did, prev_hash, chain_hash, signature, metadata, created_at)
      VALUES (?, ?, 'upload', ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      crypto.randomUUID(), evidenceId, submittedByDid,
      chainPrevHash, chainHash, mldsa65Signature || ed25519Signature,
      JSON.stringify({ fileName: file.name, fileSize: fileData.length })
    ).run();

    try {
      await env.EVIDENCE_QUEUE.send(JSON.stringify({
        type: 'pin_to_ipfs', evidenceId, r2Key, sha256Hash,
      }));
    } catch {
      // Queue not yet provisioned
    }

    return json({
      evidenceId, fileName: file.name, fileSize: fileData.length,
      sha256Hash, r2Key, ed25519Signature, mldsa65Signature,
      chainHash, chainPrevHash,
    }, request);
  },

  async handleVerify(evidenceId: string, env: Env, request?: Request, knownKeys?: Record<string, string>): Promise<Response> {
    const evidence = await env.JUSTICE_D1.prepare(`
      SELECT * FROM evidence_items WHERE id = ?
    `).bind(evidenceId).first();

    if (!evidence) {
      return err('Evidence not found', 404, request);
    }

    const r2Key = evidence.r2_key as string;
    const r2Object = await env.EVIDENCE_R2.get(r2Key);
    const fileExists = r2Object !== null;

    let hashMatches = false;
    let ed25519Valid = false;
    let mldsa65Valid = false;
    let chainValid = false;

    if (r2Object) {
      const fileData = new Uint8Array(await r2Object.arrayBuffer());
      const hashBuffer = await crypto.subtle.digest('SHA-256', fileData as BufferSource);
      const recomputedHash = bytesToHex(new Uint8Array(hashBuffer));
      hashMatches = recomputedHash === (evidence.sha256_hash as string);

      try {
        const submitterDid = evidence.submitted_by_did as string;
        const storedSig = evidence.ed25519_signature as string;
        if (storedSig && storedSig !== 'pending_ed25519_key') {
          ed25519Valid = await verifyEd25519Signature(evidence.sha256_hash as string, storedSig, submitterDid, knownKeys || {});
        } else {
          ed25519Valid = false;
        }
      } catch {
        ed25519Valid = false;
      }

      if (evidence.chain_hash) {
        const chainInput = JSON.stringify({
          evidenceId: evidence.id,
          caseId: evidence.case_id,
          sha256Hash: evidence.sha256_hash,
          prevHash: evidence.chain_prev_hash,
        });
        const chainBuffer = await crypto.subtle.digest(
          'SHA-256', new TextEncoder().encode(chainInput)
        );
        const recomputedChain = bytesToHex(new Uint8Array(chainBuffer));
        chainValid = recomputedChain === (evidence.chain_hash as string);
      }
    }

    await env.JUSTICE_D1.prepare(`
      INSERT INTO evidence_chain (id, evidence_id, action, actor_did, chain_hash, signature, metadata, created_at)
      VALUES (?, ?, 'verify', ?, ?, ?, ?, datetime('now'))
    `).bind(
      crypto.randomUUID(), evidenceId, 'system-verifier',
      evidence.chain_hash as string, '',
      JSON.stringify({ hashMatches, ed25519Valid, mldsa65Valid, chainValid })
    ).run();

    return json({
      evidenceId,
      verified: hashMatches && chainValid,
      ed25519Valid, mldsa65Valid, hashMatches, chainValid, fileExists,
    }, request);
  },

  async handleGet(evidenceId: string, env: Env, request?: Request): Promise<Response> {
    const evidence = await env.JUSTICE_D1.prepare(`
      SELECT * FROM evidence_items WHERE id = ?
    `).bind(evidenceId).first();

    if (!evidence) {
      return err('Evidence not found', 404, request);
    }

    return json({
      ...evidence,
      metadata: JSON.parse(evidence.metadata as string || '{}'),
    }, request);
  },

  async handleList(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const caseId = url.searchParams.get('caseId');
    const status = url.searchParams.get('status') || 'active';

    let query = 'SELECT * FROM evidence_items WHERE status = ?';
    const params: string[] = [status];

    if (caseId) {
      query += ' AND case_id = ?';
      params.push(caseId);
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const stmt = env.JUSTICE_D1.prepare(query);
    const result = await stmt.bind(...params).all();

    return json({
      evidence: (result.results || []).map((r: Record<string, unknown>) => ({
        ...r,
        metadata: JSON.parse(r.metadata as string || '{}'),
      })),
      count: result.results?.length || 0,
    }, request);
  },

  async handleChain(evidenceId: string, env: Env, request?: Request): Promise<Response> {
    const entries = await env.JUSTICE_D1.prepare(`
      SELECT * FROM evidence_chain WHERE evidence_id = ? ORDER BY created_at ASC
    `).bind(evidenceId).all();

    return json({
      evidenceId,
      chain: entries.results || [],
      length: entries.results?.length || 0,
    }, request);
  },

  async handleCreateCase(request: Request, env: Env): Promise<Response> {
    const knownKeys = await getKnownKeys(env);
    try {
      await requireAuth(request, { knownKeys, requireNonce: false });
    } catch (error) {
      if (error instanceof Response) return error;
      return json({ error: 'Authentication required' }, 401, request);
    }

    const body = await request.json() as CaseRequest;

    if (!body.title || !body.partyADid || !body.partyBDid) {
      return err('Missing required fields: title, partyADid, partyBDid', 400, request);
    }

    const caseId = crypto.randomUUID();
    await env.JUSTICE_D1.prepare(`
      INSERT INTO evidence_cases (id, title, description, arbitrator_did, party_a_did, party_b_did, status, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'open', ?, datetime('now'), datetime('now'))
    `).bind(
      caseId, body.title, body.description || null,
      body.arbitratorDid || null, body.partyADid, body.partyBDid,
      JSON.stringify({})
    ).run();

    return json({ success: true, caseId }, request);
  },

  async handleGetCase(caseId: string, env: Env, request?: Request): Promise<Response> {
    const caseData = await env.JUSTICE_D1.prepare(`
      SELECT * FROM evidence_cases WHERE id = ?
    `).bind(caseId).first();

    if (!caseData) {
      return err('Case not found', 404, request);
    }

    return json(caseData, request);
  },

  async handleUpdateCase(request: Request, caseId: string, env: Env): Promise<Response> {
    const knownKeys = await getKnownKeys(env);
    try {
      await requireAuth(request, { knownKeys, requireNonce: false });
    } catch (error) {
      if (error instanceof Response) return error;
      return json({ error: 'Authentication required' }, 401, request);
    }

    const body = await request.json() as Partial<CaseRequest & { status: string }>;

    const updates: string[] = [];
    const params: (string | null)[] = [];

    if (body.title) { updates.push('title = ?'); params.push(body.title); }
    if (body.description) { updates.push('description = ?'); params.push(body.description); }
    if (body.arbitratorDid) { updates.push('arbitrator_did = ?'); params.push(body.arbitratorDid); }
    if (body.status) { updates.push('status = ?'); params.push(body.status); }

    if (updates.length === 0) {
      return err('No fields to update', 400, request);
    }

    updates.push("updated_at = datetime('now')");
    params.push(caseId);

    await env.JUSTICE_D1.prepare(`
      UPDATE evidence_cases SET ${updates.join(', ')} WHERE id = ?
    `).bind(...params).run();

    return json({ success: true, caseId }, request);
  },

  async handleListCases(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const partyDid = url.searchParams.get('partyDid');

    let query = 'SELECT * FROM evidence_cases WHERE 1=1';
    const params: string[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (partyDid) {
      query += ' AND (party_a_did = ? OR party_b_did = ?)';
      params.push(partyDid, partyDid);
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const stmt = env.JUSTICE_D1.prepare(query);
    const bound = params.length > 0 ? stmt.bind(...params) : stmt;
    const result = await bound.all();

    return json({
      cases: result.results || [],
      count: result.results?.length || 0,
    }, request);
  },
};
