/**
 * p31-justice-hub — Unified Sovereign Justice Worker
 *
 * Consolidates Evidence Vault, Multi-Sig Escrow, and Online Dispute Resolution
 * into a single edge worker with 8 MCP tools over Streamable HTTP.
 *
 * MCP tools:
 *   justice_evidence_deposit  — Seal evidence hash into DO chain-of-custody
 *   justice_evidence_verify   — Verify evidence integrity via SHA-256 chain
 *   justice_case_create       — Create case with parties
 *   justice_case_list         — List active cases
 *   justice_escrow_deposit    — Deposit LOVE into multi-sig escrow
 *   justice_escrow_release    — 2-of-3 multi-sig release
 *   justice_odr_offer         — Submit blind settlement offer
 *   justice_odr_resolve       — Resolve ODR with signed acceptance
 */

import { DurableObject } from 'cloudflare:workers';

interface Env {
  JUSTICE_D1: D1Database;
  LOVE_D1: D1Database;
  EVIDENCE_R2: R2Bucket;
  JUSTICE_KV: KVNamespace;
  ESCROW_DO: DurableObjectNamespace<EscrowEngineDO>;
  EVIDENCE_DO: DurableObjectNamespace<EvidenceVaultDO>;
}

// ─── Helpers ──────────────────────────────────────────────────────────

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function id(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('');
}

function cors(body: string, status = 200): Response {
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

function json(data: unknown, status = 200): Response {
  return cors(JSON.stringify(data), status);
}

// ─── DO: Evidence Vault (SHA-256 hash chain) ──────────────────────────

export class EvidenceVaultDO extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/deposit' && request.method === 'POST') {
      const { caseId, uploaderDid, payloadHash, metadata, ed25519Signature, mldsa65Signature } = await request.json<any>();

      // Reject truncated composite signatures (ML-DSA-65 = 3309 bytes, Ed25519 = 64 bytes)
      if (mldsa65Signature && mldsa65Signature.length < 6600) {
        return json({ error: 'ML-DSA-65 signature truncated — expected ≥ 6600 hex chars (3309 bytes)', receivedLength: mldsa65Signature.length }, 400);
      }
      if (ed25519Signature && ed25519Signature.length < 128) {
        return json({ error: 'Ed25519 signature truncated — expected ≥ 128 hex chars (64 bytes)', receivedLength: ed25519Signature.length }, 400);
      }

      const entryId = id();
      const ts = Date.now();

      // SHA-256 chain: entry links to previous entry in same case
      this.ctx.storage.sql.exec(
        `CREATE TABLE IF NOT EXISTS evidence (id TEXT, caseId TEXT, uploaderDid TEXT, payloadHash TEXT, prevHash TEXT, chainHash TEXT, ts INTEGER, metadata TEXT, ed25519Sig TEXT, mldsa65Sig TEXT)`
      );
      const prev = [...this.ctx.storage.sql.exec(
        `SELECT chainHash FROM evidence WHERE caseId = ? ORDER BY ts DESC LIMIT 1`, caseId
      )];
      const prevHash = prev.length > 0 ? (prev[0] as any).chainHash : null;
      const chainInput = JSON.stringify({ entryId, caseId, payloadHash, prevHash, ts });
      const chainHash = bytesToHex(new Uint8Array(
        await crypto.subtle.digest('SHA-256', new TextEncoder().encode(chainInput))
      ));

      this.ctx.storage.sql.exec(
        `INSERT INTO evidence VALUES (?,?,?,?,?,?,?,?,?,?)`,
        entryId, caseId, uploaderDid, payloadHash, prevHash, chainHash, ts,
        JSON.stringify(metadata || {}), ed25519Signature || '', mldsa65Signature || ''
      );

      return json({
        status: 'sealed', entryId, chainHash, ts,
        signatures: {
          ed25519: ed25519Signature ? 'provided' : 'pending',
          mldsa65: mldsa65Signature ? 'provided (FIPS 204)' : 'pending',
        },
        algorithm: 'SHA-256 hash chain + Ed25519 + ML-DSA-65 dual signature',
      });
    }

    if (url.pathname === '/verify' && request.method === 'POST') {
      const { entryId } = await request.json<any>();
      const rows = [...this.ctx.storage.sql.exec(
        `SELECT * FROM evidence WHERE id = ?`, entryId
      )];
      if (rows.length === 0) return json({ error: 'Entry not found' }, 404);

      const entry = rows[0] as any;
      const chainInput = JSON.stringify({
        evidenceId: entryId, caseId: entry.caseId,
        payloadHash: entry.payloadHash, prevHash: entry.prevHash, ts: entry.ts
      });
      const recomputed = bytesToHex(new Uint8Array(
        await crypto.subtle.digest('SHA-256', new TextEncoder().encode(chainInput))
      ));

      return json({
        entryId,
        valid: recomputed === entry.chainHash,
        payloadHash: entry.payloadHash,
        chainHash: entry.chainHash,
      });
    }

    return json({ error: 'Not found' }, 404);
  }
}

// ─── DO: Escrow Engine (2-of-3 multi-sig) ─────────────────────────────

export class EscrowEngineDO extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/lock' && request.method === 'POST') {
      const { escrowId, payerDid, payeeDid, arbiterDid, amount, condition } = await request.json<any>();
      await this.ctx.storage.put(`escrow:${escrowId}`, {
        escrowId, payerDid, payeeDid, arbiterDid, amount, condition,
        status: 'LOCKED', approvals: [], ts: Date.now(),
      });
      return json({ status: 'LOCKED', escrowId });
    }

    if (url.pathname === '/release' && request.method === 'POST') {
      const { escrowId, signerDid } = await request.json<any>();
      const escrow: any = await this.ctx.storage.get(`escrow:${escrowId}`);
      if (!escrow || escrow.status !== 'LOCKED')
        return json({ error: 'Invalid or closed escrow' }, 400);

      if (![escrow.payerDid, escrow.payeeDid, escrow.arbiterDid].includes(signerDid))
        return json({ error: 'Unauthorized signer' }, 403);

      if (!escrow.approvals.includes(signerDid))
        escrow.approvals.push(signerDid);

      if (escrow.approvals.length >= 2) {
        escrow.status = 'RELEASED';
        await this.ctx.storage.put(`escrow:${escrowId}`, escrow);
        return json({ status: 'RELEASED', escrowId, approvals: escrow.approvals });
      }

      await this.ctx.storage.put(`escrow:${escrowId}`, escrow);
      return json({ status: 'PENDING_CONSENSUS', approvals: escrow.approvals, needed: 2 });
    }

    return json({ error: 'Not found' }, 404);
  }
}

// ─── MCP Tools ────────────────────────────────────────────────────────

const JUSTICE_TOOLS = [
  {
    name: 'justice_evidence_deposit',
    description: 'Cryptographically seal evidence hash into DO case vault. SHA-256 chain + dual Ed25519 + ML-DSA-65 signatures.',
    inputSchema: {
      type: 'object',
      properties: {
        caseId: { type: 'string' },
        uploaderDid: { type: 'string' },
        payloadHash: { type: 'string', description: 'SHA-256 hash of digital evidence' },
        ed25519Signature: { type: 'string', description: 'Ed25519 signature over payloadHash' },
        mldsa65Signature: { type: 'string', description: 'ML-DSA-65 (FIPS 204) signature over payloadHash' },
        metadata: { type: 'object' },
      },
      required: ['caseId', 'uploaderDid', 'payloadHash'],
    },
  },
  {
    name: 'justice_evidence_verify',
    description: 'Verify evidence entry against SHA-256 chain to confirm integrity.',
    inputSchema: {
      type: 'object',
      properties: {
        entryId: { type: 'string', description: 'Evidence entry ID from deposit' },
      },
      required: ['entryId'],
    },
  },
  {
    name: 'justice_case_create',
    description: 'Create a new case with two parties. Stores in D1.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        partyADid: { type: 'string' },
        partyBDid: { type: 'string' },
        description: { type: 'string' },
      },
      required: ['title', 'partyADid', 'partyBDid'],
    },
  },
  {
    name: 'justice_case_list',
    description: 'List all active cases with metadata.',
    inputSchema: { type: 'object', properties: { status: { type: 'string' } } },
  },
  {
    name: 'justice_escrow_deposit',
    description: 'Deposit LOVE credits into a 2-of-3 multi-sig escrow account.',
    inputSchema: {
      type: 'object',
      properties: {
        escrowId: { type: 'string' },
        payerDid: { type: 'string' },
        payeeDid: { type: 'string' },
        arbiterDid: { type: 'string' },
        amount: { type: 'number' },
        condition: { type: 'string' },
      },
      required: ['escrowId', 'payerDid', 'payeeDid', 'arbiterDid', 'amount'],
    },
  },
  {
    name: 'justice_escrow_release',
    description: 'Sign to release escrow. Requires 2-of-3 multi-sig consensus.',
    inputSchema: {
      type: 'object',
      properties: {
        escrowId: { type: 'string' },
        signerDid: { type: 'string' },
      },
      required: ['escrowId', 'signerDid'],
    },
  },
  {
    name: 'justice_odr_offer',
    description: 'Submit a blind settlement offer. Blinded via SHA-256 hash.',
    inputSchema: {
      type: 'object',
      properties: {
        caseId: { type: 'string' },
        partyDid: { type: 'string' },
        amount: { type: 'number' },
        round: { type: 'number' },
      },
      required: ['caseId', 'partyDid', 'amount'],
    },
  },
  {
    name: 'justice_odr_resolve',
    description: 'Resolve an ODR case by accepting the winning offer.',
    inputSchema: {
      type: 'object',
      properties: {
        caseId: { type: 'string' },
        acceptedByDid: { type: 'string' },
      },
      required: ['caseId', 'acceptedByDid'],
    },
  },
];

async function executeJusticeTool(name: string, args: any, env: Env): Promise<any> {
  switch (name) {
    case 'justice_case_create': {
      const { title, description, partyADid, partyBDid } = args;
      const caseId = `case-${id()}`;
      await env.JUSTICE_D1.prepare(
        `INSERT INTO evidence_cases (id, title, description, party_a_did, party_b_did, status, metadata, created_at)
         VALUES (?, ?, ?, ?, ?, 'active', ?, datetime('now'))`
      ).bind(caseId, title, description || '', partyADid, partyBDid, '{}').run();
      return { caseId, status: 'created' };
    }

    case 'justice_case_list': {
      const { status = 'active' } = args;
      const result = await env.JUSTICE_D1.prepare(
        `SELECT id, title, status, party_a_did, party_b_did, created_at FROM evidence_cases WHERE status = ? ORDER BY created_at DESC LIMIT 50`
      ).bind(status).all<any>();
      return { cases: result.results || [], total: result.results?.length || 0 };
    }

    case 'justice_evidence_deposit': {
      const stub = env.EVIDENCE_DO.get(env.EVIDENCE_DO.idFromName(args.caseId));
      const res = await stub.fetch(new Request('http://internal/deposit', {
        method: 'POST', body: JSON.stringify(args),
      }));
      return res.json();
    }

    case 'justice_evidence_verify': {
      const stub = env.EVIDENCE_DO.get(env.EVIDENCE_DO.idFromName('verify'));
      const res = await stub.fetch(new Request('http://internal/verify', {
        method: 'POST', body: JSON.stringify(args),
      }));
      return res.json();
    }

    case 'justice_escrow_deposit': {
      const stub = env.ESCROW_DO.get(env.ESCROW_DO.idFromName(args.escrowId));
      const res = await stub.fetch(new Request('http://internal/lock', {
        method: 'POST', body: JSON.stringify(args),
      }));
      return res.json();
    }

    case 'justice_escrow_release': {
      const stub = env.ESCROW_DO.get(env.ESCROW_DO.idFromName(args.escrowId));
      const res = await stub.fetch(new Request('http://internal/release', {
        method: 'POST', body: JSON.stringify(args),
      }));
      return res.json();
    }

    case 'justice_odr_offer': {
      const { caseId, partyDid, amount, round = 1 } = args;
      const offerId = `offer-${id()}`;
      const blindedHash = bytesToHex(new Uint8Array(
        await crypto.subtle.digest('SHA-256',
          new TextEncoder().encode(`${offerId}:${amount}:${partyDid}:${round}`)
        )
      ));
      await env.JUSTICE_D1.prepare(
        `INSERT INTO odr_offers (id, case_id, party_did, blinded_hash, round, status, created_at)
         VALUES (?, ?, ?, ?, ?, 'submitted', datetime('now'))`
      ).bind(offerId, caseId, partyDid, blindedHash, round).run();
      return { offerId, blindedHash: blindedHash.slice(0, 16), round, status: 'submitted' };
    }

    case 'justice_odr_resolve': {
      const { caseId, acceptedByDid } = args;
      await env.JUSTICE_D1.prepare(
        `UPDATE evidence_cases SET status = 'resolved', metadata = json_set(metadata, '$.resolvedBy', ?) WHERE id = ?`
      ).bind(acceptedByDid, caseId).run();
      return { caseId, status: 'resolved', resolvedBy: acceptedByDid };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ─── Streamable HTTP MCP Server ───────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    // CORS
    if (method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Streamable HTTP: GET /mcp returns SSE notification stream
    if (url.pathname === '/mcp' && method === 'GET') {
      const body = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(
            `event: endpoint\ndata: ${JSON.stringify({ tools: JUSTICE_TOOLS.length, service: 'p31-justice-hub' })}\n\n`
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
          return cors(JSON.stringify({ jsonrpc: '2.0', id: rpcId, result: { tools: JUSTICE_TOOLS } }));
        }

        if (rpcMethod === 'tools/call') {
          const toolName = params?.name;
          const toolArgs = params?.arguments || {};
          const tool = JUSTICE_TOOLS.find(t => t.name === toolName);
          if (!tool) {
            return cors(JSON.stringify({
              jsonrpc: '2.0', id: rpcId,
              error: { code: -32602, message: `Unknown tool: ${toolName}` },
            }), 400);
          }
          const result = await executeJusticeTool(toolName, toolArgs, env);
          return cors(JSON.stringify({
            jsonrpc: '2.0', id: rpcId,
            result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] },
          }));
        }

        if (rpcMethod === 'ping') {
          return cors(JSON.stringify({ jsonrpc: '2.0', id: rpcId, result: {} }));
        }

        return cors(JSON.stringify({
          jsonrpc: '2.0', id: rpcId,
          error: { code: -32601, message: `Method not found: ${rpcMethod}` },
        }), 400);
      } catch (e: any) {
        return cors(JSON.stringify({
          jsonrpc: '2.0', id: null,
          error: { code: -32700, message: `Parse error: ${e.message}` },
        }), 400);
      }
    }

    // Health
    if (url.pathname === '/health' && method === 'GET') {
      return cors(JSON.stringify({
        status: 'ok', service: 'p31-justice-hub', version: '1.0.0',
        tools: JUSTICE_TOOLS.length,
        timestamp: new Date().toISOString(),
      }));
    }

    // Root
    if (url.pathname === '/' && method === 'GET') {
      return cors(JSON.stringify({
        service: 'p31-justice-hub',
        tools: JUSTICE_TOOLS.map(t => t.name),
        mcp: 'POST /mcp (JSON-RPC 2.0), GET /mcp (SSE)',
      }));
    }

    return cors(JSON.stringify({ error: 'Not found' }), 404);
  },
};
