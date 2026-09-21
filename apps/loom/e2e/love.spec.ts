import { test, expect } from '@playwright/test';

/**
 * LOVE care proof — the privacy-preserving read.
 *
 * GET /api/loom/love/:did returns what the ledger attests (bound, careScore,
 * verified, pools) WITHOUT the care events. This spec proves the surface
 * works end-to-end through the dev middleware, against the LIVE ledger when
 * reachable and a graceful `bound: false` when it is not.
 */
test('love care proof — a DID resolves to a care proof, never the events', async ({ request }) => {
  const res = await request.get('/api/loom/love/did:key:test-love-proof-1');
  expect(res.ok()).toBe(true);
  const proof = await res.json();

  // The shape is stable regardless of ledger reachability.
  expect(proof).toHaveProperty('did');
  expect(proof).toHaveProperty('bound');
  expect(proof).toHaveProperty('careScore');
  expect(proof).toHaveProperty('verified');
  expect(proof).toHaveProperty('sovereigntyPool');
  expect(proof).toHaveProperty('performancePool');
  expect(proof).toHaveProperty('totalEarned');

  // The privacy promise: the response is a verdict + balances. It must NOT
  // contain the underlying care events or any intimate detail.
  const body = JSON.stringify(proof);
  expect(body).not.toContain('transactions');
  expect(body).not.toContain('event');

  // careScore is a number in [0,1]; verified is its boolean verdict.
  expect(proof.careScore).toBeGreaterThanOrEqual(0);
  expect(proof.careScore).toBeLessThanOrEqual(1);
  expect(typeof proof.verified).toBe('boolean');
  expect(proof.verified).toBe(proof.careScore >= 0.5);
});

test('love care proof — a missing did is rejected', async ({ request }) => {
  const res = await request.get('/api/loom/love/');
  // An empty decoded did is rejected by the dev middleware (400) / route (404).
  expect([400, 404]).toContain(res.status());
});