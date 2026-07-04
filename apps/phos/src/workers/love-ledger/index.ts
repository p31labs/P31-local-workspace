import { DurableObject } from 'cloudflare:workers';
import { verifyRequest, unauthorizedResponse } from '../../lib/edge/verify';
import { logEvent } from '../../lib/edge/logging';

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
  logEvent({ event: `${label}_retry_exhausted`, service: 'love-ledger', success: false, error: String(lastErr) });
  throw lastErr;
}

export interface Env {
  LOVE_DB: D1Database;
}

export class LoveTransactionDO extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    return new Response('Legacy love transaction endpoint — use D1-based API', { status: 410 });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    if (method === 'GET' && url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', service: 'love-ledger', timestamp: new Date().toISOString() }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (method === 'GET' && url.pathname === '/balance') {
      const did = url.searchParams.get('did');
      if (!did) return new Response(JSON.stringify({ error: 'Missing did' }), { status: 400 });

      const result = await withRetry(() => env.LOVE_DB.prepare(
        'SELECT balance, staked, earned, reputation FROM love_accounts WHERE did = ?'
      ).bind(did).first(), 3, 'balance_select');

      if (!result) {
        return new Response(JSON.stringify({ did, balance: 0, staked: 0, earned: 0, reputation: 50 }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (method === 'POST' && url.pathname === '/transfer') {
      try {
        if (!await verifyRequest(request, 'from')) {
          logEvent({ event: 'transfer_sig_fail', service: 'love-ledger', success: false });
          return unauthorizedResponse();
        }
        const body = await request.json() as {
          from: string;
          to: string;
          amount: number;
          signature: string;
        };

        const fromAccount = await withRetry(() => env.LOVE_DB.prepare(
          'SELECT balance FROM love_accounts WHERE did = ?'
        ).bind(body.from).first<{ balance: number }>(), 3, 'transfer_select');

        if (!fromAccount || fromAccount.balance < body.amount) {
          return new Response(JSON.stringify({ error: 'Insufficient balance' }), { status: 400 });
        }

        await withRetry(() => env.LOVE_DB.prepare(
          'UPDATE love_accounts SET balance = balance - ?, updated_at = datetime("now") WHERE did = ?'
        ).bind(body.amount, body.from).run(), 3, 'balance_update');

        await withRetry(() => env.LOVE_DB.prepare(
          'UPDATE love_accounts SET balance = balance + ?, updated_at = datetime("now") WHERE did = ?'
        ).bind(body.amount, body.to).run(), 3, 'balance_update');

        const txId = crypto.randomUUID();
        await withRetry(() => env.LOVE_DB.prepare(`
          INSERT INTO love_transactions (id, from_did, to_did, amount, type, signature)
          VALUES (?, ?, ?, ?, 'transfer', ?)
        `).bind(txId, body.from, body.to, body.amount, body.signature).run(), 3, 'transfer_insert');

        logEvent({
          event: 'transfer_completed',
          service: 'love-ledger',
          did: body.from,
          success: true,
          data: { txId, to: body.to, amount: body.amount },
        });

        return new Response(JSON.stringify({
          success: true,
          transactionId: txId,
          from: body.from,
          to: body.to,
          amount: body.amount,
          timestamp: new Date().toISOString(),
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (err: any) {
        logEvent({ event: 'transfer_error', service: 'love-ledger', success: false, error: err?.message || String(err) });
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }

    if (method === 'POST' && url.pathname === '/stake') {
      try {
        if (!await verifyRequest(request, 'did')) {
          logEvent({ event: 'stake_sig_fail', service: 'love-ledger', success: false });
          return unauthorizedResponse();
        }
        const body = await request.json() as {
          did: string;
          contractId: string;
          amount: number;
          signature: string;
        };

        const account = await withRetry(() => env.LOVE_DB.prepare(
          'SELECT balance FROM love_accounts WHERE did = ?'
        ).bind(body.did).first<{ balance: number }>(), 3, 'stake_select');

        if (!account || account.balance < body.amount) {
          return new Response(JSON.stringify({ error: 'Insufficient balance' }), { status: 400 });
        }

        await withRetry(() => env.LOVE_DB.prepare(
          'UPDATE love_accounts SET balance = balance - ?, staked = staked + ? WHERE did = ?'
        ).bind(body.amount, body.amount, body.did).run(), 3, 'stake_update');

        const unlockedAt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
        await withRetry(() => env.LOVE_DB.prepare(`
          INSERT INTO love_stakes (contract_id, staker_did, amount, unlocked_at, status)
          VALUES (?, ?, ?, ?, 'locked')
        `).bind(body.contractId, body.did, body.amount, unlockedAt).run(), 3, 'stake_insert');

        logEvent({
          event: 'stake_completed',
          service: 'love-ledger',
          did: body.did,
          success: true,
          data: { contractId: body.contractId, amount: body.amount },
        });

        return new Response(JSON.stringify({
          success: true,
          contractId: body.contractId,
          staker: body.did,
          amount: body.amount,
          unlockedAt,
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (err: any) {
        logEvent({ event: 'stake_error', service: 'love-ledger', success: false, error: err?.message || String(err) });
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }

    return new Response('Not found', { status: 404 });
  }
};
