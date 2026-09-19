import { test, expect } from '@playwright/test';

/**
 * β-2 canvas convergence — the write → render → SSE loop, end to end.
 *
 * Drives the SAME endpoint the canvas uses (POST /api/loom/event -> commit())
 * to simulate an agent, then asserts the canvas reflects it: the proposal
 * ghost node appears and the event log lists the event. This stands in for the
 * β-1 demo agent as a child process until that lane lands; swapping the direct
 * POSTs for `spawn('node', ['scripts/loom-demo-agent.mjs'])` is the one-line
 * change the brief calls out.
 */
test('canvas reflects events committed through the API', async ({ request, page }) => {
  const id = `prop_e2e_${Date.now()}`;

  const focus = await request.post('/api/loom/event', {
    data: { input: { writer: 'human', kind: 'focus', node: '--p31-accent' } },
  });
  expect(focus.ok()).toBe(true);

  const propose = await request.post('/api/loom/event', {
    data: { input: { writer: 'agent', kind: 'propose', id, node: '.feature-card', body: { e2e: true } } },
  });
  expect(propose.ok()).toBe(true);

  await page.goto('/');

  // The proposal renders as a ghost node.
  await expect(page.getByText(`✳ ${id}`, { exact: false }).first()).toHaveCount(1, { timeout: 5000 });

  // The event log shows the propose and its writer.
  await expect(page.getByText('propose', { exact: true }).first()).toHaveCount(1);
  await expect(page.getByText('agent', { exact: true }).first()).toHaveCount(1);
});
