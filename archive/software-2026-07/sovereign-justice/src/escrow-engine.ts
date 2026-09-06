import { requireAuth, getKnownKeys } from './auth';
import { hexToBytes, bytesToHex } from './hex';

interface Env {
  JUSTICE_D1: D1Database;
  ESCROW_DO: DurableObjectNamespace;
  LOVE_D1?: D1Database;
}

interface DepositRequest {
  caseId: string;
  partyDid: string;
  partyBDid: string;
  amount: number;
  poolType?: 'escrow' | 'sovereignty' | 'performance';
}

interface ReleaseRequest {
  escrowId: string;
  toDid: string;
  amount: number;
  actorDid: string;
}

interface ApproveRequest {
  escrowId: string;
  signerDid: string;
  signature?: string;
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

function json(body: unknown, status = 200, request?: Request): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...(request ? corsHeaders(request) : {}) },
  });
}

function err(message: string, status: number, request?: Request): Response {
  return new Response(message, { status, headers: request ? corsHeaders(request) : {} });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // Health endpoint — public
    if (pathParts[0] === 'api' && pathParts[1] === 'health' && request.method === 'GET') {
      return json({ status: 'ok', service: 'escrow-engine' }, 200, request);
    }

    // Resolve known keys from D1 registry (shared source of truth)
    const knownKeys = await getKnownKeys(env);

    // All other endpoints require DID auth
    let authDid = '';
    if (pathParts[0] === 'api' && pathParts[1] === 'escrow') {
      try {
        const auth = await requireAuth(request, { knownKeys, requireNonce: false });
        authDid = auth.did;
      } catch (error) {
        if (error instanceof Response) return error;
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    if (pathParts[0] === 'api' && pathParts[1] === 'escrow') {
      if (pathParts[2] === 'deposit' && request.method === 'POST') {
        return this.handleDeposit(request, env);
      }
      if (pathParts[2] === 'status' && pathParts[3] && request.method === 'GET') {
        return this.handleStatus(request, pathParts[3], env);
      }
      if (pathParts[2] === 'list' && request.method === 'GET') {
        return this.handleList(request, env);
      }
      if (pathParts[2] === 'verify' && request.method === 'POST') {
        return this.handleVerify(request, env, knownKeys);
      }

      // Route to Durable Object for stateful operations
      if (pathParts[2] && request.method === 'POST') {
        const escrowId = pathParts[2];
        const doId = env.ESCROW_DO.idFromName(escrowId);
        const stub = env.ESCROW_DO.get(doId);
        const doUrl = new URL(request.url);
        return stub.fetch(new Request(doUrl.href, {
          method: 'POST',
          body: JSON.stringify({ ...(await request.json()), actorDid: authDid }),
          headers: { 'Content-Type': 'application/json' },
        }));
      }
    }

    return err('Not found', 404, request);
  },

  async handleDeposit(request: Request, env: Env): Promise<Response> {
    const body = await request.json() as DepositRequest;

    if (!body.caseId || !body.partyDid || !body.partyBDid || !body.amount || body.amount <= 0) {
      return err('Missing or invalid fields: caseId, partyDid, partyBDid, amount', 400, request);
    }

    const escrowId = crypto.randomUUID();
    const poolType = body.poolType || 'escrow';
    const timestamp = Date.now();

    await env.JUSTICE_D1.prepare(`
      INSERT INTO escrow_accounts (id, case_id, party_a_did, party_b_did, pool_type, balance, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'locked', datetime('now'), datetime('now'))
    `).bind(
      escrowId, body.caseId, body.partyDid, body.partyBDid, poolType, body.amount
    ).run();

    await env.JUSTICE_D1.prepare(`
      INSERT INTO escrow_transactions (id, escrow_id, action, amount, actor_did, metadata, created_at)
      VALUES (?, ?, 'deposit', ?, ?, ?, datetime('now'))
    `).bind(
      crypto.randomUUID(), escrowId, body.amount, body.partyDid,
      JSON.stringify({ poolType, timestamp })
    ).run();

    return json({
      success: true,
      escrowId,
      caseId: body.caseId,
      party_a_did: body.partyDid,
      party_b_did: body.partyBDid,
      amount: body.amount,
      poolType,
      status: 'locked',
    }, 200, request);
  },

  async handleStatus(request: Request, escrowId: string, env: Env): Promise<Response> {
    const escrow = await env.JUSTICE_D1.prepare(`
      SELECT * FROM escrow_accounts WHERE id = ?
    `).bind(escrowId).first();

    if (!escrow) {
      return err('Escrow account not found', 404, request);
    }

    const transactions = await env.JUSTICE_D1.prepare(`
      SELECT * FROM escrow_transactions WHERE escrow_id = ? ORDER BY created_at DESC LIMIT 20
    `).bind(escrowId).all();

    const approvals = await env.JUSTICE_D1.prepare(`
      SELECT * FROM escrow_approvals WHERE escrow_id = ?
    `).bind(escrowId).all();

    return json({
      ...escrow,
      conditions: JSON.parse((escrow as Record<string, unknown>).conditions_json as string || '{}'),
      transactions: transactions.results || [],
      approvals: approvals.results || [],
    }, 200, request);
  },

  async handleList(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const caseId = url.searchParams.get('caseId');
    const status = url.searchParams.get('status');
    const partyDid = url.searchParams.get('partyDid');

    let query = 'SELECT * FROM escrow_accounts WHERE 1=1';
    const params: string[] = [];

    if (caseId) { query += ' AND case_id = ?'; params.push(caseId); }
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (partyDid) {
      query += ' AND (party_a_did = ? OR party_b_did = ?)';
      params.push(partyDid, partyDid);
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const stmt = env.JUSTICE_D1.prepare(query);
    const bound = params.length > 0 ? stmt.bind(...params) : stmt;
    const result = await bound.all();

    return json({
      escrowAccounts: result.results || [],
      count: result.results?.length || 0,
    }, 200, request);
  },

  async handleVerify(request: Request, env: Env, knownKeys: Record<string, string>): Promise<Response> {
    const body = await request.json() as { escrowId?: string; signature?: string; submitterDid?: string };

    if (!body.escrowId) {
      return json({ error: 'Missing escrowId' }, 400, request);
    }

    const escrow = await env.JUSTICE_D1.prepare(`
      SELECT * FROM escrow_accounts WHERE id = ?
    `).bind(body.escrowId).first();

    if (!escrow) {
      return json({ error: 'Escrow not found' }, 404, request);
    }

    const escrowRecord = escrow as Record<string, unknown>;
    const submitterDid = body.submitterDid || (escrowRecord.party_a_did as string) || '';
    const dataToVerify = JSON.stringify({
      escrowId: body.escrowId,
      caseId: escrowRecord.case_id,
      status: escrowRecord.status,
      balance: escrowRecord.balance,
      timestamp: Date.now(),
    });

    let ed25519Valid = false;
    if (body.signature) {
      ed25519Valid = await verifyEd25519Signature(dataToVerify, body.signature, submitterDid, knownKeys);
    }

    return json({
      escrowId: body.escrowId,
      ed25519Valid,
      submitterDid,
      note: ed25519Valid ? 'Signature verified against KNOWN_KEYS registry' : 'Verification failed — signature missing or key not found',
    }, 200, request);
  },
};

export class DisputeEscrowDO implements DurableObject {
  private state: DurableObjectState;
  private env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const escrowId = pathParts[2];
    const action = pathParts[3] || url.searchParams.get('action') || 'status';

    if (!escrowId) {
      return json({ error: 'Missing escrowId' }, 400);
    }

    switch (action) {
      case 'release':
        return this.handleRelease(request, escrowId);
      case 'refund':
        return this.handleRefund(request, escrowId);
      case 'approve':
        return this.handleApprove(request, escrowId);
      case 'lock':
        return this.handleLock(request, escrowId);
      case 'unlock':
        return this.handleUnlock(request, escrowId);
      case 'status':
        return this.handleStatus(request, escrowId);
      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  }

  private async handleRelease(request: Request, escrowId: string): Promise<Response> {
    const body = await request.json() as ReleaseRequest;
    const timestamp = Date.now();

    if (!body.toDid || !body.amount || body.amount <= 0) {
      return json({ error: 'Missing or invalid: toDid, amount' }, 400);
    }

    const escrow = await this.env.JUSTICE_D1.prepare(`
      SELECT * FROM escrow_accounts WHERE id = ?
    `).bind(escrowId).first();

    if (!escrow) {
      return json({ error: 'Escrow not found' }, 404);
    }

    const escrowRecord = escrow as Record<string, unknown>;
    if (escrowRecord.status !== 'arbitrating' && escrowRecord.status !== 'ready_to_release') {
      return json({
        error: `Escrow is in '${escrowRecord.status}' state. Must be 'arbitrating' or 'ready_to_release' to release.`,
        currentStatus: escrowRecord.status,
      }, 400);
    }

    if ((escrowRecord.balance as number) < body.amount) {
      return json({
        error: 'Insufficient escrow balance',
        balance: escrowRecord.balance,
        requested: body.amount,
      }, 400);
    }

    const conditions = JSON.parse(escrowRecord.conditions_json as string || '{}');
    if (conditions.requireMultiSig) {
      const approvalCount = await this.env.JUSTICE_D1.prepare(`
        SELECT COUNT(*) as count FROM escrow_approvals WHERE escrow_id = ? AND approved = 1
      `).bind(escrowId).first<{ count: number }>();

      const requiredApprovals = conditions.requiredApprovals || 1;
      if (!approvalCount || approvalCount.count < requiredApprovals) {
        return json({
          error: `Insufficient approvals. Required: ${requiredApprovals}, Current: ${approvalCount?.count || 0}`,
        }, 400);
      }
    }

    const newBalance = (escrowRecord.balance as number) - body.amount;
    const newStatus = newBalance <= 0 ? 'released' : 'ready_to_release';

    await this.env.JUSTICE_D1.prepare(`
      UPDATE escrow_accounts SET balance = ?, status = ?, updated_at = datetime('now') WHERE id = ?
    `).bind(newBalance, newStatus, escrowId).run();

    await this.env.JUSTICE_D1.prepare(`
      INSERT INTO escrow_transactions (id, escrow_id, action, amount, actor_did, metadata, created_at)
      VALUES (?, ?, 'release', ?, ?, ?, datetime('now'))
    `).bind(
      crypto.randomUUID(), escrowId, body.amount, body.actorDid,
      JSON.stringify({ toDid: body.toDid, timestamp })
    ).run();

    if (this.env.LOVE_D1) {
      try {
        await this.env.LOVE_D1.prepare(`
          INSERT INTO transactions (id, user_id, type, amount, description, metadata, created_at)
          VALUES (?, ?, 'earn', ?, ?, ?, ?)
        `).bind(
          crypto.randomUUID(), body.toDid, body.amount,
          'DISPUTE_SETTLEMENT',
          JSON.stringify({ escrowId, caseId: escrowRecord.case_id }),
          timestamp
        ).run();
      } catch {
        // love-ledger is optional
      }
    }

    return json({
      success: true,
      escrowId,
      releasedTo: body.toDid,
      amount: body.amount,
      remainingBalance: newBalance,
      status: newStatus,
    }, 200);
  }

  private async handleRefund(request: Request, escrowId: string): Promise<Response> {
    const escrow = await this.env.JUSTICE_D1.prepare(`
      SELECT * FROM escrow_accounts WHERE id = ?
    `).bind(escrowId).first() as Record<string, unknown> | null;

    if (!escrow) {
      return json({ error: 'Escrow not found' }, 404);
    }

    if (escrow.status !== 'locked') {
      return json({
        error: `Cannot refund escrow in '${escrow.status}' state. Must be 'locked'.`,
        currentStatus: escrow.status,
      }, 400);
    }

    await this.env.JUSTICE_D1.prepare(`
      UPDATE escrow_accounts SET status = 'refunded', balance = 0, updated_at = datetime('now') WHERE id = ?
    `).bind(escrowId).run();

    await this.env.JUSTICE_D1.prepare(`
      INSERT INTO escrow_transactions (id, escrow_id, action, amount, actor_did, metadata, created_at)
      VALUES (?, ?, 'refund', ?, ?, ?, datetime('now'))
    `).bind(
      crypto.randomUUID(), escrowId, escrow.balance as number,
      escrow.party_a_did as string,
      JSON.stringify({ reason: 'dispute_not_filed', timestamp: Date.now() })
    ).run();

    return json({ success: true, escrowId, status: 'refunded' }, 200);
  }

  private async handleApprove(request: Request, escrowId: string): Promise<Response> {
    const body = await request.json() as ApproveRequest;

    if (!body.signerDid) {
      return json({ error: 'Missing signerDid' }, 400);
    }

    await this.env.JUSTICE_D1.prepare(`
      INSERT INTO escrow_approvals (id, escrow_id, signer_did, approved, signature, signed_at, created_at)
      VALUES (?, ?, ?, 1, ?, datetime('now'), datetime('now'))
      ON CONFLICT(escrow_id, signer_did) DO UPDATE SET
        approved = 1,
        signature = COALESCE(?, signature),
        signed_at = datetime('now')
    `).bind(
      crypto.randomUUID(), escrowId, body.signerDid,
      body.signature || '', body.signature || ''
    ).run();

    await this.env.JUSTICE_D1.prepare(`
      INSERT INTO escrow_transactions (id, escrow_id, action, amount, actor_did, metadata, created_at)
      VALUES (?, ?, 'approve', 0, ?, ?, datetime('now'))
    `).bind(
      crypto.randomUUID(), escrowId, body.signerDid,
      JSON.stringify({ timestamp: Date.now() })
    ).run();

    const conditions = await this.env.JUSTICE_D1.prepare(`
      SELECT conditions_json FROM escrow_accounts WHERE id = ?
    `).bind(escrowId).first<{ conditions_json: string }>();

    const cond = conditions ? JSON.parse(conditions.conditions_json) : {};
    if (cond.requireMultiSig && cond.autoReleaseOnApproval) {
      const approvalCount = await this.env.JUSTICE_D1.prepare(`
        SELECT COUNT(*) as count FROM escrow_approvals WHERE escrow_id = ? AND approved = 1
      `).bind(escrowId).first<{ count: number }>();

      if (approvalCount && approvalCount.count >= (cond.requiredApprovals || 1)) {
        await this.env.JUSTICE_D1.prepare(`
          UPDATE escrow_accounts SET status = 'ready_to_release', updated_at = datetime('now') WHERE id = ?
        `).bind(escrowId).run();
      }
    }

    return json({ success: true, escrowId, signerDid: body.signerDid }, 200);
  }

  private async handleLock(request: Request, escrowId: string): Promise<Response> {
    await this.env.JUSTICE_D1.prepare(`
      UPDATE escrow_accounts SET status = 'arbitrating', updated_at = datetime('now') WHERE id = ?
    `).bind(escrowId).run();

    await this.env.JUSTICE_D1.prepare(`
      INSERT INTO escrow_transactions (id, escrow_id, action, amount, actor_did, metadata, created_at)
      VALUES (?, ?, 'lock', 0, 'system', ?, datetime('now'))
    `).bind(
      crypto.randomUUID(), escrowId,
      JSON.stringify({ timestamp: Date.now(), reason: 'dispute_filed' })
    ).run();

    return json({ success: true, escrowId, status: 'arbitrating' }, 200);
  }

  private async handleUnlock(request: Request, escrowId: string): Promise<Response> {
    await this.env.JUSTICE_D1.prepare(`
      UPDATE escrow_accounts SET status = 'ready_to_release', updated_at = datetime('now') WHERE id = ?
    `).bind(escrowId).run();

    return json({ success: true, escrowId, status: 'ready_to_release' }, 200);
  }

  private async handleStatus(request: Request, escrowId: string): Promise<Response> {
    const escrow = await this.env.JUSTICE_D1.prepare(`
      SELECT * FROM escrow_accounts WHERE id = ?
    `).bind(escrowId).first();

    if (!escrow) {
      return json({ error: 'Escrow not found' }, 404);
    }

    return json(escrow, 200);
  }
}
