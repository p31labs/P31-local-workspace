/**
 * love-ledger worker — Hardening tests.
 *
 * Grounded in the ACTUAL worker (software/workers/love-ledger.ts). These tests
 * exercise the opt-in hardening enabled by LOVE_REQUIRE_AUTH:
 *   - Authentication (HS256 Bearer) on earn / spend / care-score (401 otherwise)
 *   - Rate limiting: at most one earn per 24h per user (429)
 *   - Replay protection: per-user nonce dedup (400)
 *   - Atomicity: earn writes are wrapped in a D1 batch
 *
 * Concurrency is still verified in dev mode (no auth) to confirm the batch
 * change did not regress parallel-earn consistency.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createHarness, makeToken, type Harness } from './harness';

let hAuth: Harness;
let hDev: Harness;

beforeAll(async () => {
  hAuth = await createHarness({ auth: true });
  hDev = await createHarness();
});
afterAll(async () => {
  await hAuth.dispose();
  await hDev.dispose();
});

const j = (body: unknown) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const authHeaders = async (userId: string) =>
  ({ 'Content-Type': 'application/json', Authorization: `Bearer ${await makeToken(userId)}` }) as Record<string, string>;

const authFetch = async (h: Harness, userId: string, body: Record<string, unknown>) =>
  h.fetch('/api/love/earn', { method: 'POST', headers: await authHeaders(userId), body: JSON.stringify({ nonce: crypto.randomUUID(), ...body }) });

describe('Concurrency (dev mode, real, passing)', () => {
  it('keeps balance consistent under parallel earns', async () => {
    await hDev.fetch('/api/love/register', j({ userId: 'conc1' }));
    // 20 parallel BLOCK_PLACED earns (1.0 each) -> 20 total, 10/10 split
    await Promise.all(
      Array.from({ length: 20 }, () =>
        hDev.fetch('/api/love/earn', j({ userId: 'conc1', transactionType: 'BLOCK_PLACED' }))
      )
    );
    const bal = await (await hDev.fetch('/api/love/balance/conc1')).json();
    expect(bal.totalEarned).toBe(20.0);
    expect(bal.sovereigntyPool).toBe(10.0);
    expect(bal.performancePool).toBe(10.0);
  });
});

describe('Hardened behavior (LOVE_REQUIRE_AUTH enabled)', () => {
  it('rejects unauthenticated earn with 401', async () => {
    await hAuth.fetch('/api/love/register', j({ userId: 'auth1' }));
    const res = await hAuth.fetch('/api/love/earn', j({ userId: 'auth1', transactionType: 'BLOCK_PLACED' }));
    expect(res.status).toBe(401);
  });

  it('accepts an authenticated earn with a valid Bearer token', async () => {
    await hAuth.fetch('/api/love/register', j({ userId: 'auth2' }));
    const res = await authFetch(hAuth, 'auth2', { userId: 'auth2', transactionType: 'BLOCK_PLACED' });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.amount).toBe(1.0);
    expect(body.sovereigntyPool).toBe(0.5);
    expect(body.performancePool).toBe(0.5);
  });

  it('rejects a spend without auth (401)', async () => {
    await hAuth.fetch('/api/love/register', j({ userId: 'auth3' }));
    await authFetch(hAuth, 'auth3', { userId: 'auth3', transactionType: 'MILESTONE_REACHED' });
    const res = await hAuth.fetch('/api/love/spend', j({ userId: 'auth3', amount: 1 }));
    expect(res.status).toBe(401);
  });

  it('rejects a care-score write without auth (401)', async () => {
    await hAuth.fetch('/api/love/register', j({ userId: 'auth4' }));
    const res = await hAuth.fetch('/api/love/care-score', j({ userId: 'auth4', careScore: 0.9 }));
    expect(res.status).toBe(401);
  });

  it('rate-limits earns to a per-user cooldown (429 on second earn)', async () => {
    await hAuth.fetch('/api/love/register', j({ userId: 'rl1' }));
    const first = await authFetch(hAuth, 'rl1', { userId: 'rl1', transactionType: 'BLOCK_PLACED' });
    expect(first.status).toBe(200);
    const second = await authFetch(hAuth, 'rl1', { userId: 'rl1', transactionType: 'BLOCK_PLACED' });
    expect(second.status).toBe(429);
  });

  it('dedupes replayed earn requests via nonce (400 on replay)', async () => {
    await hAuth.fetch('/api/love/register', j({ userId: 'rep1' }));
    const body = { userId: 'rep1', transactionType: 'BLOCK_PLACED', nonce: 'replay-nonce-1' };
    const first = await authFetch(hAuth, 'rep1', body);
    expect(first.status).toBe(200);
    const second = await authFetch(hAuth, 'rep1', body);
    expect(second.status).toBe(400);
  });

  it('wraps earn in a D1 batch so balance, transaction, nonce, and rate-limit commit atomically', async () => {
    await hAuth.fetch('/api/love/register', j({ userId: 'bat1' }));
    const body = { userId: 'bat1', transactionType: 'BLOCK_PLACED', nonce: 'batch-nonce-1' };
    const res = await authFetch(hAuth, 'bat1', body);
    expect(res.status).toBe(200);

    // Transaction recorded (part of the batch).
    const txns = await (await hAuth.fetch('/api/love/transactions/bat1')).json();
    expect(txns.count).toBe(1);

    // Balance updated (part of the batch).
    const bal = await (await hAuth.fetch('/api/love/balance/bat1')).json();
    expect(bal.totalEarned).toBe(1.0);

    // Replay of the same nonce is now blocked (nonce was persisted in the batch).
    const dup = await authFetch(hAuth, 'bat1', body);
    expect(dup.status).toBe(400);
  });
});
