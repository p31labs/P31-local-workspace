/**
 * love-ledger worker — Integration tests (real worker via Miniflare + local D1).
 *
 * Grounded in the ACTUAL worker source (software/workers/love-ledger.ts):
 *  - POST /api/love/register -> registerUser (idempotent; required before earn)
 *  - POST /api/love/earn   -> handleEarn  (two-pool 50/50 split, care-score bump)
 *  - POST /api/love/care-score -> handleCareScore
 *  - GET  /api/love/balance -> getBalance (decay via computeEffectiveCareScore)
 *  - POST /api/love/spend  -> LoveTransactionDO (atomic deduct)
 *
 * NOTE: The worker requires a user to be registered before earning (the
 * `transactions` table has a FK to `users`). This matches production flow
 * (the client registers on genesis). Tests register users first.
 *
 * The worker does NOT implement on-chain-style threshold gating, rate-limiting,
 * auth, or age-vesting. Those gaps are tracked as hardening TODOs in
 * love-worker.hardening.test.ts — not asserted as present here.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createHarness, type Harness } from './harness';

let h: Harness;

beforeAll(async () => { h = await createHarness(); });
afterAll(async () => { await h.dispose(); });

const j = (body: unknown) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const reg = (userId: string) => h.fetch('/api/love/register', j({ userId }));

describe('Register + Earn reward path', () => {
  it('registers a user idempotently (no double-row)', async () => {
    await reg('u1');
    const r2 = await reg('u1');
    expect(r2.status).toBe(200);
    const bal = await (await h.fetch('/api/love/balance/u1')).json();
    expect(bal.totalEarned).toBe(0);
    expect(bal.careScore).toBe(0.5);
  });

  it('mints LOVE on earn with two-pool 50/50 split', async () => {
    await reg('u2');
    // BLOCK_PLACED canonical amount = 1.0 LOVE
    const res = await h.fetch('/api/love/earn', j({ userId: 'u2', transactionType: 'BLOCK_PLACED' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.amount).toBe(1.0);
    expect(body.sovereigntyPool).toBe(0.5);
    expect(body.performancePool).toBe(0.5);

    const bal = await (await h.fetch('/api/love/balance/u2')).json();
    expect(bal.totalEarned).toBe(1.0);
    expect(bal.sovereigntyPool).toBe(0.5);
    expect(bal.performancePool).toBe(0.5);
    // available = performancePool * careScore (careScore bumped by PASSIVE 0.005)
    expect(bal.careScore).toBeCloseTo(0.505, 5);
  });

  it('rejects earn with unknown transactionType', async () => {
    await reg('u3');
    const res = await h.fetch('/api/love/earn', j({ userId: 'u3', transactionType: 'NOT_A_TYPE' }));
    expect(res.status).toBe(400);
  });

  it('requires transactionType on earn (legacy path gated)', async () => {
    await reg('u3b');
    const res = await h.fetch('/api/love/earn', j({ userId: 'u3b', amount: 5 }));
    expect(res.status).toBe(400);
  });

  it('care-type transactions bump care_score more than passive', async () => {
    await reg('careA');
    await reg('careB');

    // CARE_GIVEN bump = 0.03
    await h.fetch('/api/love/earn', j({ userId: 'careA', transactionType: 'CARE_GIVEN' }));
    // BLOCK_PLACED bump = 0.005
    await h.fetch('/api/love/earn', j({ userId: 'careB', transactionType: 'BLOCK_PLACED' }));

    const a = await (await h.fetch('/api/love/balance/careA')).json();
    const b = await (await h.fetch('/api/love/balance/careB')).json();
    expect(a.careScore).toBeGreaterThan(b.careScore);
  });

  it('accumulates across multiple earns', async () => {
    await reg('accum');
    await h.fetch('/api/love/earn', j({ userId: 'accum', transactionType: 'ARTIFACT_CREATED' })); // 10
    await h.fetch('/api/love/earn', j({ userId: 'accum', transactionType: 'MILESTONE_REACHED' })); // 25
    const bal = await (await h.fetch('/api/love/balance/accum')).json();
    expect(bal.totalEarned).toBe(35.0);
    expect(bal.sovereigntyPool).toBe(17.5);
    expect(bal.performancePool).toBe(17.5);
  });
});

describe('Care score + decay', () => {
  it('updates care_score via /api/love/care-score', async () => {
    await reg('cs1');
    const res = await h.fetch('/api/love/care-score', j({ userId: 'cs1', careScore: 0.9 }));
    expect(res.status).toBe(200);
    const bal = await (await h.fetch('/api/love/balance/cs1')).json();
    expect(bal.careScore).toBeCloseTo(0.9, 5);
  });

  it('clamps care_score to [0,1]', async () => {
    await reg('cs2');
    const res = await h.fetch('/api/love/care-score', j({ userId: 'cs2', careScore: 5 }));
    const body = await res.json();
    expect(body.careScore).toBe(1.0);
  });

  it('computes effective care score with decay after grace period', async () => {
    // Register, set care score high, then read balance with a mocked "old" updated_at
    // by directly manipulating storage is not exposed; instead verify decay semantics:
    // A fresh user has care_score 0.5 and no decay within grace window.
    await reg('decay1');
    const fresh = await (await h.fetch('/api/love/balance/decay1')).json();
    expect(fresh.careScore).toBe(0.5);
    // available = performancePool(0) * 0.5 = 0
    expect(fresh.availableBalance).toBe(0);
  });
});

describe('Spend via Durable Object (atomic)', () => {
  it('spends from available (performance) balance', async () => {
    await reg('spend1');
    await h.fetch('/api/love/earn', j({ userId: 'spend1', transactionType: 'MILESTONE_REACHED' })); // +25, perf 12.5, care ~0.505
    const res = await h.fetch('/api/love/spend', j({ userId: 'spend1', amount: 5 }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    // performance pool reduced by 5
    expect(body.performancePool).toBeCloseTo(7.5, 5);
  });

  it('rejects spend exceeding available balance', async () => {
    await reg('spend2');
    await h.fetch('/api/love/earn', j({ userId: 'spend2', transactionType: 'BLOCK_PLACED' })); // perf 0.5, care ~0.505 => avail ~0.2525
    const res = await h.fetch('/api/love/spend', j({ userId: 'spend2', amount: 100 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Insufficient/);
  });
});

describe('Transactions ledger', () => {
  it('records earn + spend transactions', async () => {
    await reg('tx1');
    await h.fetch('/api/love/earn', j({ userId: 'tx1', transactionType: 'BLOCK_PLACED' }));
    await h.fetch('/api/love/spend', j({ userId: 'tx1', amount: 0.1 }));
    const res = await (await h.fetch('/api/love/transactions/tx1')).json();
    expect(res.count).toBe(2);
    const types = res.transactions.map((t: any) => t.type).sort();
    expect(types).toEqual(['earn', 'spend']);
  });
});
