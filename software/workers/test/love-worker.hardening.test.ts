/**
 * love-ledger worker — Hardening tests.
 *
 * Grounded in the ACTUAL worker (software/workers/love-ledger.ts). Several
 * protections described in the Phase 5 research synthesis do NOT exist in the
 * real worker. Those are tracked here:
 *   - No authentication (comment: "tracked, not yet implemented")
 *   - No rate limiting / 1-day cooldown (no `lastMintAt`)
 *   - No replay protection / idempotency key on earn
 *   - No age-gated vesting schedule (sovereignty is simply "immutable")
 *   - No D1Batch atomicity (sequential prepares)
 *
 * Tests that assert the DESIRED hardened behavior are written but `.skip`-ped
 * so they fail loudly once the gap is closed. Tests that pin the CURRENT
 * (insecure) behavior are marked "GAP" and should be deleted when fixed.
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

describe('Concurrency (real, passing)', () => {
  it('keeps balance consistent under parallel earns', async () => {
    await h.fetch('/api/love/register', j({ userId: 'conc1' }));
    // 20 parallel BLOCK_PLACED earns (1.0 each) -> 20 total, 10/10 split
    await Promise.all(
      Array.from({ length: 20 }, () =>
        h.fetch('/api/love/earn', j({ userId: 'conc1', transactionType: 'BLOCK_PLACED' }))
      )
    );
    const bal = await (await h.fetch('/api/love/balance/conc1')).json();
    expect(bal.totalEarned).toBe(20.0);
    expect(bal.sovereigntyPool).toBe(10.0);
    expect(bal.performancePool).toBe(10.0);
  });
});

describe('Known hardening gaps (current insecure state — delete when fixed)', () => {
  it('GAP: earn succeeds WITHOUT any authentication', async () => {
    // HARDENING TODO: require DID:key / JWT; must return 401/403.
    await h.fetch('/api/love/register', j({ userId: 'gap_auth' }));
    const res = await h.fetch('/api/love/earn', j({ userId: 'gap_auth', transactionType: 'BLOCK_PLACED' }));
    expect(res.status).toBe(200); // currently unauthenticated -> succeeds
  });

  it('GAP: no rate limiting — repeated earns all mint', async () => {
    // HARDENING TODO: per-user cooldown (e.g. 1 day) between mints.
    await h.fetch('/api/love/register', j({ userId: 'gap_rl' }));
    const r1 = await h.fetch('/api/love/earn', j({ userId: 'gap_rl', transactionType: 'BLOCK_PLACED' }));
    const r2 = await h.fetch('/api/love/earn', j({ userId: 'gap_rl', transactionType: 'BLOCK_PLACED' }));
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200); // currently no cooldown -> second mint allowed
    const bal = await (await h.fetch('/api/love/balance/gap_rl')).json();
    expect(bal.totalEarned).toBe(2.0);
  });

  it('GAP: no replay/idempotency protection on earn', async () => {
    // HARDENING TODO: dedupe by request nonce/timestamp.
    await h.fetch('/api/love/register', j({ userId: 'gap_replay' }));
    const body = JSON.stringify({ userId: 'gap_replay', transactionType: 'BLOCK_PLACED' });
    const a = await h.fetch('/api/love/earn', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    const b = await h.fetch('/api/love/earn', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    expect(a.status).toBe(200);
    expect(b.status).toBe(200); // identical request mints twice
  });

  it('GAP: no age-vesting schedule (sovereignty fully earned immediately)', async () => {
    // HARDENING TODO: implement unlock schedule (e.g. 10%@13 .. 100%@25).
    await h.fetch('/api/love/register', j({ userId: 'gap_vest' }));
    await h.fetch('/api/love/earn', j({ userId: 'gap_vest', transactionType: 'MILESTONE_REACHED' })); // +25
    const bal = await (await h.fetch('/api/love/balance/gap_vest')).json();
    // sovereignty_pool holds the full 12.5 immediately; nothing is locked/unvested
    expect(bal.sovereigntyPool).toBe(12.5);
  });
});

describe('Desired hardened behavior (skipped until implemented)', () => {
  it.skip('should reject unauthenticated earn with 401', () => {
    // Depends on DID:key / JWT auth enforcement.
  });
  it.skip('should rate-limit earns to a per-user cooldown', () => {
    // Depends on lastMintAt cooldown.
  });
  it.skip('should dedupe replayed earn requests', () => {
    // Depends on nonce/timestamp idempotency.
  });
  it.skip('should wrap earn in a D1 batch for atomicity', () => {
    // Depends on D1Batch usage instead of sequential prepares.
  });
});
