import { test, expect } from '@playwright/test';

/**
 * The DuetUI bidirectional loop, end to end: a human's focus is reflected by
 * the field, an agent reacts by traversing (visible cursor) and proposing
 * (visible ghost). The agent's writes are simulated by POSTing to the same
 * /api/loom/event the agent would call — the point is to prove the DOM loop,
 * not the MCP transport.
 */
test('human focus → agent traversal → proposal is visible end to end', async ({ page }) => {
  await page.goto('/?mode=canvas');

  // 1. Every graph node is agent-legible — the AAF loom.focus action is on the
  //    DOM, not just declared in the manifest.
  const focusNodes = page.locator('[data-agent-action="loom.focus"]');
  await expect(focusNodes.first()).toHaveCount(1, { timeout: 5000 });

  // Settle: wait for React Flow to finish its initial layout so node
  // positions are stable (no fitView animation with duration: 0, but
  // the first paint may still be mid-render).
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-agent-action="loom.focus"]');
    if (!el) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    const key = `${Math.round(r.x)},${Math.round(r.y)}`;
    const w = window as unknown as { __loomNodeKey?: string };
    const stable = w.__loomNodeKey === key;
    w.__loomNodeKey = key;
    return stable;
  }, { timeout: 5000 });

  const nodeName = (await focusNodes.first().getAttribute('data-agent-target')) ?? '';

  // 2. A human focuses a node; the field responds (focused class lands).
  await page.request.post('/api/loom/event', {
    data: { input: { writer: 'human', kind: 'focus', node: nodeName } },
  });
  await expect(page.locator('.loom-node--focused')).toHaveCount(1, { timeout: 5000 });

  // 3. The agent reacts by traversing to the focused node — the presence
  //    cursor appears, pinned to the node.
  await page.request.post('/api/loom/event', {
    data: { input: { writer: 'agent', kind: 'traverse', from: nodeName, to: nodeName, reason: 'focus-reaction' } },
  });
  await expect(page.locator('.agent-cursor')).toHaveCount(1, { timeout: 5000 });

  // 4. The agent proposes against the node — a reviewable ghost renders.
  const proposalId = `duet-${Date.now()}`;
  await page.request.post('/api/loom/event', {
    data: {
      input: { writer: 'agent', kind: 'propose', id: proposalId, node: nodeName, body: { change: 'test' }, author: 'duet-agent' },
    },
  });
  await expect(page.getByText(proposalId, { exact: false }).first()).toHaveCount(1, { timeout: 5000 });
});
