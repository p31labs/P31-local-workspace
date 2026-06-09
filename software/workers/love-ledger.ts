import type { D1Database, DurableObjectNamespace, DurableObject, DurableObjectState, PubSub } from './types';

/**
 * P31 L.O.V.E. Token Ledger
 * 
 * Distributed ledger for the LOVE (Ledger of Ontological Volume and Entropy) currency
 * using D1 for persistence and Durable Objects for atomic transactions.
 * 
 * LOVE tokens are soulbound by convention (no transfer endpoint exists).
 * Cryptographic enforcement requires per-user auth — tracked, not yet implemented.
 *
 * @version 1.3.0
 * @date March 27, 2026
 * 
 * Two-Pool Model:
 * - sovereignty_pool: 50% of all earned LOVE, immutable
 * - performance_pool: 50% of all earned LOVE, liquid based on care_score
 * - care_score: 0-1, modulates available balance from performance pool
 */

export interface Env {
  LOVE_D1: D1Database;
  LOVE_TRANSACTION: DurableObjectNamespace;
  LOVE_PUB_SUB?: PubSub;
}

export interface User {
  id: string;
  wallet_address: string | null;
  created_at: number;
  updated_at: number;
  total_love_earned: number;
  total_spoons_spent: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'earn' | 'spend' | 'bonus';
  amount: number;
  description: string;
  metadata: Record<string, unknown>;
  created_at: number;
}

export interface Balance {
  user_id: string;
  balance: number;
  updated_at: number;
}

// Two-pool balance interface
export interface TwoPoolBalance {
  user_id: string;
  total_earned: number;
  sovereignty_pool: number;
  performance_pool: number;
  care_score: number;
  updated_at: number;
}

export interface TransactionRequest {
  userId: string;
  type: 'earn' | 'spend' | 'bonus';
  amount: number;
  description?: string;
  metadata?: Record<string, unknown>;
}

// Care-type transactions boost care_score more than passive ones.
// CARE_GIVEN/RECEIVED represent direct peer interaction — highest signal.
const CARE_TYPE_BUMP = 0.03;
const PASSIVE_TYPE_BUMP = 0.005;
const CARE_TYPES = new Set(['CARE_GIVEN', 'CARE_RECEIVED', 'COHERENCE_GIFT', 'TETRAHEDRON_BOND']);

// Care score decay: after 7-day grace period, decays 0.005/day, floor 0.1.
// Computed dynamically on balance read — no extra write required.
const CARE_SCORE_GRACE_DAYS = 7;
const CARE_SCORE_DECAY_PER_DAY = 0.005;
const CARE_SCORE_MIN = 0.1;
const CARE_SCORE_MAX = 1.0;
const WORKER_SPOONS_MAX = 12; // mirrors client SPOONS_MAX

function computeEffectiveCareScore(storedScore: number, updatedAt: number): number {
  const daysSince = (Date.now() - updatedAt) / 86_400_000;
  if (daysSince <= CARE_SCORE_GRACE_DAYS) return storedScore;
  const decay = (daysSince - CARE_SCORE_GRACE_DAYS) * CARE_SCORE_DECAY_PER_DAY;
  return Math.max(CARE_SCORE_MIN, storedScore - decay);
}

// Canonical LOVE amounts — earn endpoint validates against this.
// Matches packages/love-ledger/src/types.ts LOVE_AMOUNTS.
const LOVE_AMOUNTS: Record<string, number> = {
  BLOCK_PLACED:      1.0,
  COHERENCE_GIFT:    5.0,
  ARTIFACT_CREATED: 10.0,
  CARE_RECEIVED:     3.0,
  CARE_GIVEN:        2.0,
  TETRAHEDRON_BOND: 15.0,
  VOLTAGE_CALMED:    2.0,
  MILESTONE_REACHED: 25.0,
  PING:              1.0,
};

// D1 SQL Schema (v1.2 - two-pool model)
/*
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  wallet_address TEXT UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  total_love_earned REAL DEFAULT 0,
  total_spoons_spent REAL DEFAULT 0
);

CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  metadata TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);

CREATE TABLE balances (
  user_id TEXT PRIMARY KEY,
  total_earned REAL NOT NULL DEFAULT 0,
  sovereignty_pool REAL NOT NULL DEFAULT 0,
  performance_pool REAL NOT NULL DEFAULT 0,
  care_score REAL NOT NULL DEFAULT 0.5,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
*/

// ── CORS ────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
} as const;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function err(message: string, status: number): Response {
  return new Response(message, { status, headers: CORS_HEADERS });
}

// ── Worker ──────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // Route: GET /api/love/balance/{userId}
    if (pathParts[0] === 'api' && pathParts[1] === 'love' && pathParts[2] === 'balance') {
      const userId = pathParts[3];
      if (request.method === 'GET') {
        return this.getBalance(userId, env);
      }
    }

    // Route: GET /api/love/transactions/{userId}
    if (pathParts[0] === 'api' && pathParts[1] === 'love' && pathParts[2] === 'transactions') {
      const userId = pathParts[3];
      if (request.method === 'GET') {
        return this.getTransactions(userId, env);
      }
    }

    // Route: POST /api/love/earn
    if (pathParts[0] === 'api' && pathParts[1] === 'love' && pathParts[2] === 'earn') {
      if (request.method === 'POST') {
        return this.handleEarn(request, env);
      }
    }

    // Route: POST /api/love/spend → Route to DO for atomic transaction
    if (pathParts[0] === 'api' && pathParts[1] === 'love' && pathParts[2] === 'spend') {
      if (request.method === 'POST') {
        const body = await request.json() as { userId: string; amount: number; description?: string; metadata?: unknown };
        // Route to Durable Object for atomic processing
        const id = env.LOVE_TRANSACTION.idFromName(body.userId);
        const stub = env.LOVE_TRANSACTION.get(id);
        const doUrl = new URL(request.url);
        doUrl.searchParams.set('action', 'spend');
        return stub.fetch(new Request(doUrl.href, {
          method: 'POST',
          body: JSON.stringify(body),
          headers: { 'Content-Type': 'application/json' },
        }));
      }
    }

    // Route: GET /api/love/leaderboard
    if (pathParts[0] === 'api' && pathParts[1] === 'love' && pathParts[2] === 'leaderboard') {
      if (request.method === 'GET') {
        return this.getLeaderboard(env);
      }
    }

    // Route: POST /api/love/register
    if (pathParts[0] === 'api' && pathParts[1] === 'love' && pathParts[2] === 'register') {
      if (request.method === 'POST') {
        return this.registerUser(request, env);
      }
    }

    // Route: POST /api/love/care-score
    if (pathParts[0] === 'api' && pathParts[1] === 'love' && pathParts[2] === 'care-score') {
      if (request.method === 'POST') {
        return this.handleCareScore(request, env);
      }
    }

    return err('Not found', 404);
  },

  async getBalance(userId: string, env: Env): Promise<Response> {
    if (!userId) {
      return err('Missing userId', 400);
    }

    // Query two-pool balance + spoon debt in parallel
    const [result, userRow] = await Promise.all([
      env.LOVE_D1.prepare(`
        SELECT total_earned, sovereignty_pool, performance_pool, care_score, updated_at
        FROM balances WHERE user_id = ?
      `).bind(userId).first<TwoPoolBalance>(),
      env.LOVE_D1.prepare(`
        SELECT total_spoons_spent FROM users WHERE id = ?
      `).bind(userId).first<{ total_spoons_spent: number }>(),
    ]);

    const totalSpoonDebt = userRow?.total_spoons_spent ?? 0;

    if (!result) {
      return json({
        userId,
        totalEarned: 0,
        sovereigntyPool: 0,
        performancePool: 0,
        careScore: 0.5,
        availableBalance: 0,
        frozenBalance: 0,
        totalSpoonDebt,
        updatedAt: null
      });
    }

    const effectiveCareScore = computeEffectiveCareScore(result.care_score, result.updated_at);
    const availableBalance = result.performance_pool * effectiveCareScore;
    const frozenBalance = result.performance_pool * (1 - effectiveCareScore);

    return json({
      userId,
      totalEarned: result.total_earned,
      sovereigntyPool: result.sovereignty_pool,
      performancePool: result.performance_pool,
      careScore: effectiveCareScore,
      availableBalance,
      frozenBalance,
      totalSpoonDebt,
      updatedAt: result.updated_at,
    });
  },

  async getTransactions(userId: string, env: Env): Promise<Response> {
    if (!userId) {
      return err('Missing userId', 400);
    }

    const limit = 50;
    const result = await env.LOVE_D1.prepare(`
      SELECT * FROM transactions 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `).bind(userId, limit).all<Transaction>();

    return json({
      userId,
      transactions: result.results || [],
      count: result.results?.length || 0,
    });
  },

  // Earn endpoint validates transactionType against canonical LOVE_AMOUNTS.
  // Rejects requests with unknown types or amounts that don't match the protocol.
  async handleEarn(request: Request, env: Env): Promise<Response> {
    const body = await request.json() as TransactionRequest & { transactionType?: string };

    if (!body.userId) {
      return err('Missing userId', 400);
    }

    let amount: number;

    if (body.transactionType) {
      const canonical = LOVE_AMOUNTS[body.transactionType];
      if (canonical === undefined) {
        return err(`Unknown transactionType: ${body.transactionType}`, 400);
      }
      amount = canonical;
    } else if (body.amount && body.amount > 0) {
      // Legacy path: accept explicit amount only for DONATION type
      if (body.description !== 'EXTERNAL_DONATION') {
        return err('Earn requests must include transactionType', 400);
      }
      amount = body.amount;
    } else {
      return err('Missing transactionType or amount', 400);
    }

    // Split 50/50 between pools
    const sovereigntyAmount = amount * 0.5;
    const performanceAmount = amount * 0.5;
    const timestamp = Date.now();

    // Care score bump: care-type transactions earn more trust signal
    const careBump = CARE_TYPES.has(body.transactionType ?? '') ? CARE_TYPE_BUMP : PASSIVE_TYPE_BUMP;

    // Update with two-pool split + care score bump
    await env.LOVE_D1.prepare(`
      INSERT INTO balances (user_id, total_earned, sovereignty_pool, performance_pool, care_score, updated_at)
      VALUES (?, ?, ?, ?, 0.5, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        total_earned = total_earned + ?,
        sovereignty_pool = sovereignty_pool + ?,
        performance_pool = performance_pool + ?,
        care_score = MIN(?, care_score + ?),
        updated_at = ?
    `).bind(
      body.userId,
      amount,
      sovereigntyAmount,
      performanceAmount,
      timestamp,
      amount,
      sovereigntyAmount,
      performanceAmount,
      CARE_SCORE_MAX,
      careBump,
      timestamp
    ).run();

    // Extract spoon level from metadata — record cognitive state at time of earn
    const spoonsAtEarn = typeof body.metadata?.spoons === 'number' ? body.metadata.spoons : null;
    const spoonDebt = spoonsAtEarn !== null ? WORKER_SPOONS_MAX - spoonsAtEarn : 0;

    // Log transaction (preserve spoon metadata for future care_score calculations)
    const transactionId = crypto.randomUUID();
    await env.LOVE_D1.prepare(`
      INSERT INTO transactions (id, user_id, type, amount, description, metadata, created_at)
      VALUES (?, ?, 'earn', ?, ?, ?, ?)
    `).bind(
      transactionId,
      body.userId,
      amount,
      body.description || body.transactionType || 'EARN',
      JSON.stringify(body.metadata || {}),
      timestamp
    ).run();

    // Accumulate spoon debt — high value = consistently depleted when earning
    if (spoonDebt > 0) {
      await env.LOVE_D1.prepare(`
        UPDATE users SET total_spoons_spent = total_spoons_spent + ? WHERE id = ?
      `).bind(spoonDebt, body.userId).run();
    }

    // Get new balance
    const newBalance = await env.LOVE_D1.prepare(`
      SELECT total_earned, sovereignty_pool, performance_pool, care_score FROM balances WHERE user_id = ?
    `).bind(body.userId).first<{ total_earned: number; sovereignty_pool: number; performance_pool: number; care_score: number }>();

    // Broadcast via Pub/Sub (optional binding)
    if (env.LOVE_PUB_SUB) {
      try {
        await env.LOVE_PUB_SUB.publish(
          `love:${body.userId}`,
          JSON.stringify({
            type: 'balance_update',
            userId: body.userId,
            amount,
            transactionId,
          })
        );

        await env.LOVE_PUB_SUB.publish(
          'love:global',
          JSON.stringify({
            type: 'transaction',
            userId: body.userId,
            transactionType: 'earn',
            amount,
          })
        );
      } catch (e) {
        console.log('Pub/Sub publish failed:', e);
      }
    }

    return json({
      success: true,
      transactionId,
      userId: body.userId,
      type: 'earn',
      amount,
      newTotalEarned: newBalance?.total_earned || 0,
      sovereigntyPool: newBalance?.sovereignty_pool || 0,
      performancePool: newBalance?.performance_pool || 0,
      timestamp,
    });
  },

  async handleTransaction(request: Request, env: Env, type: 'earn' | 'spend' | 'bonus'): Promise<Response> {
    // This is now only used for non-spend transactions (bonus, legacy earn)
    const body = await request.json() as TransactionRequest;

    if (!body.userId || !body.amount || body.amount <= 0) {
      return err('Invalid transaction', 400);
    }

    // For spend transactions via this path (should be handled by DO), check balance first
    if (type === 'spend') {
      const balance = await env.LOVE_D1.prepare(`
        SELECT balance FROM balances WHERE user_id = ?
      `).bind(body.userId).first<{ balance: number }>();

      if (!balance || balance.balance < body.amount) {
        return json({
          error: 'Insufficient balance',
          currentBalance: balance?.balance || 0,
          requestedAmount: body.amount,
        }, 400);
      }
    }

    const transactionId = crypto.randomUUID();
    const timestamp = Date.now();

    // Insert transaction
    await env.LOVE_D1.prepare(`
      INSERT INTO transactions (id, user_id, type, amount, description, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      transactionId,
      body.userId,
      type,
      body.amount,
      body.description || '',
      JSON.stringify(body.metadata || {}),
      timestamp
    ).run();

    // Update balance (legacy path - for bonus transactions)
    const balanceChange = type === 'spend' ? -body.amount : body.amount;
    await env.LOVE_D1.prepare(`
      INSERT INTO balances (user_id, balance, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        balance = balance + ?,
        updated_at = ?
    `).bind(
      body.userId,
      balanceChange,
      timestamp,
      balanceChange,
      timestamp
    ).run();

    // Update user totals
    if (type === 'earn' || type === 'bonus') {
      await env.LOVE_D1.prepare(`
        UPDATE users SET total_love_earned = total_love_earned + ? WHERE id = ?
      `).bind(body.amount, body.userId).run();
    } else if (type === 'spend') {
      await env.LOVE_D1.prepare(`
        UPDATE users SET total_spoons_spent = total_spoons_spent + ? WHERE id = ?
      `).bind(body.amount, body.userId).run();
    }

    // Get new balance
    const newBalance = await env.LOVE_D1.prepare(`
      SELECT balance FROM balances WHERE user_id = ?
    `).bind(body.userId).first<{ balance: number }>();

    return json({
      success: true,
      transactionId,
      userId: body.userId,
      type,
      amount: body.amount,
      newBalance: newBalance?.balance || 0,
      timestamp,
    });
  },

  async getLeaderboard(env: Env): Promise<Response> {
    const result = await env.LOVE_D1.prepare(`
      SELECT u.id, u.total_love_earned, b.total_earned, b.sovereignty_pool, b.performance_pool
      FROM users u
      LEFT JOIN balances b ON u.id = b.user_id
      ORDER BY b.total_earned DESC
      LIMIT 20
    `).all<{ id: string; total_love_earned: number; total_earned: number; sovereignty_pool: number; performance_pool: number }>();

    return json({
      leaderboard: result.results || [],
      count: result.results?.length || 0,
    });
  },

  async registerUser(request: Request, env: Env): Promise<Response> {
    const body = await request.json() as { userId: string; walletAddress?: string };

    if (!body.userId) {
      return err('Missing userId', 400);
    }

    const timestamp = Date.now();

    // Create user
    await env.LOVE_D1.prepare(`
      INSERT INTO users (id, wallet_address, created_at, updated_at, total_love_earned, total_spoons_spent)
      VALUES (?, ?, ?, ?, 0, 0)
      ON CONFLICT(id) DO NOTHING
    `).bind(
      body.userId,
      body.walletAddress || null,
      timestamp,
      timestamp
    ).run();

    // Initialize balance with two-pool schema
    await env.LOVE_D1.prepare(`
      INSERT INTO balances (user_id, total_earned, sovereignty_pool, performance_pool, care_score, updated_at)
      VALUES (?, 0, 0, 0, 0.5, ?)
      ON CONFLICT(user_id) DO NOTHING
    `).bind(body.userId, timestamp).run();

    return json({
      success: true,
      userId: body.userId,
      walletAddress: body.walletAddress || null,
      createdAt: timestamp,
    });
  },

  async handleCareScore(request: Request, env: Env): Promise<Response> {
    const body = await request.json() as { userId: string; careScore: number };

    if (!body.userId || typeof body.careScore !== 'number') {
      return err('Invalid request', 400);
    }

    const score = Math.max(0, Math.min(1, body.careScore));
    const timestamp = Date.now();

    await env.LOVE_D1.prepare(`
      UPDATE balances SET care_score = ?, updated_at = ? WHERE user_id = ?
    `).bind(score, timestamp, body.userId).run();

    // Get updated balance to return new available amount
    const balance = await env.LOVE_D1.prepare(`
      SELECT performance_pool, care_score FROM balances WHERE user_id = ?
    `).bind(body.userId).first<{ performance_pool: number; care_score: number }>();

    const availableBalance = balance ? balance.performance_pool * score : 0;

    return json({
      success: true,
      userId: body.userId,
      careScore: score,
      availableBalance,
      updatedAt: timestamp,
    });
  },
};

// ── Durable Object for atomic spend transactions ─────────────────────

export class LoveTransactionDO implements DurableObject {
  constructor(private state: DurableObjectState, private env: Env) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'spend') {
      return this.handleSpend(request);
    }
    if (action === 'balance') {
      return this.handleBalance(request);
    }

    return new Response('Not found', { status: 404 });
  }

  private async handleSpend(request: Request): Promise<Response> {
    const body = await request.json() as { userId: string; amount: number; description?: string; metadata?: unknown };
    const transactionId = crypto.randomUUID();
    const timestamp = Date.now();

    if (!body.userId || !body.amount || body.amount <= 0) {
      return json({ error: 'Invalid request' }, 400);
    }

    // DO serializes per-user — safe to use 2-step: compute effective score, then atomic deduct.
    // This is necessary because care score decay uses wall-clock time (can't compute in SQL).
    const current = await this.env.LOVE_D1.prepare(`
      SELECT performance_pool, sovereignty_pool, total_earned, care_score, updated_at
      FROM balances WHERE user_id = ?
    `).bind(body.userId).first<{
      performance_pool: number; sovereignty_pool: number; total_earned: number;
      care_score: number; updated_at: number;
    }>();

    if (!current) {
      return json({ error: 'User not found' }, 400);
    }

    const effectiveCareScore = computeEffectiveCareScore(current.care_score, current.updated_at);
    const availableBalance = current.performance_pool * effectiveCareScore;

    if (availableBalance < body.amount) {
      return json({
        error: 'Insufficient available balance',
        availableBalance,
        requestedAmount: body.amount,
      }, 400);
    }

    // Persist effective care score if decay reduced it, then deduct
    if (effectiveCareScore < current.care_score) {
      await this.env.LOVE_D1.prepare(`
        UPDATE balances SET care_score = ? WHERE user_id = ?
      `).bind(effectiveCareScore, body.userId).run();
    }

    const result = await this.env.LOVE_D1.prepare(`
      UPDATE balances
      SET performance_pool = performance_pool - ?,
          updated_at = ?
      WHERE user_id = ?
      RETURNING performance_pool, sovereignty_pool, care_score, total_earned
    `).bind(body.amount, timestamp, body.userId)
      .first<{ performance_pool: number; sovereignty_pool: number; care_score: number; total_earned: number }>();

    if (!result) {
      return json({ error: 'Spend failed — balance state inconsistent' }, 500);
    }

    // Log the spend transaction
    await this.env.LOVE_D1.prepare(`
      INSERT INTO transactions (id, user_id, type, amount, description, metadata, created_at)
      VALUES (?, ?, 'spend', ?, ?, ?, ?)
    `).bind(
      transactionId,
      body.userId,
      body.amount,
      body.description || 'SPEND',
      JSON.stringify(body.metadata || {}),
      timestamp
    ).run();

    // Update user total spent
    await this.env.LOVE_D1.prepare(`
      UPDATE users SET total_spoons_spent = total_spoons_spent + ? WHERE id = ?
    `).bind(body.amount, body.userId).run();

    // Broadcast via Pub/Sub (optional binding)
    if (this.env.LOVE_PUB_SUB) {
      try {
        await this.env.LOVE_PUB_SUB.publish(
          `love:${body.userId}`,
          JSON.stringify({
            type: 'spend',
            userId: body.userId,
            amount: body.amount,
            transactionId,
          })
        );
      } catch (e) {
        // Ignore Pub/Sub errors
      }
    }

    const postSpendAvailable = result.performance_pool * effectiveCareScore;
    const postSpendFrozen = result.performance_pool * (1 - effectiveCareScore);

    return json({
      success: true,
      transactionId,
      userId: body.userId,
      amount: body.amount,
      newTotalEarned: result.total_earned,
      sovereigntyPool: result.sovereignty_pool,
      performancePool: result.performance_pool,
      careScore: effectiveCareScore,
      availableBalance: postSpendAvailable,
      frozenBalance: postSpendFrozen,
      timestamp,
    });
  }

  private async handleBalance(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') ?? '';

    if (!userId) {
      return json({ error: 'Missing userId' }, 400);
    }

    const row = await this.env.LOVE_D1.prepare(
      `SELECT total_earned, sovereignty_pool, performance_pool, care_score, updated_at FROM balances WHERE user_id = ?`
    ).bind(userId).first<{ total_earned: number; sovereignty_pool: number; performance_pool: number; care_score: number; updated_at: number }>();

    if (!row) {
      return json({
        userId,
        totalEarned: 0,
        sovereigntyPool: 0,
        performancePool: 0,
        careScore: 0.5,
        availableBalance: 0,
        frozenBalance: 0,
      });
    }

    const effectiveCareScore = computeEffectiveCareScore(row.care_score, row.updated_at);
    const availableBalance = row.performance_pool * effectiveCareScore;
    const frozenBalance = row.performance_pool * (1 - effectiveCareScore);

    return json({
      userId,
      totalEarned: row.total_earned,
      sovereigntyPool: row.sovereignty_pool,
      performancePool: row.performance_pool,
      careScore: effectiveCareScore,
      availableBalance,
      frozenBalance,
    });
  }
}
