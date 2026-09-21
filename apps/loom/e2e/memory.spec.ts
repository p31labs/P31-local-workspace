import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const logPath = resolve(here, '..', '.loom', 'ci-events.jsonl');
const chainPath = logPath.replace(/\.jsonl$/, '.chain.jsonl');

test.beforeEach(() => {
  mkdirSync(dirname(logPath), { recursive: true });
  writeFileSync(logPath, '');
  writeFileSync(chainPath, '');
});

test.setTimeout(60000);

/**
 * Lumi's persistent memory — a deterministic fold of the log, surfaced as one
 * derived sentence on the launchpad. The tests prove:
 *   1. an empty log → no memory line ("Lumi is new here");
 *   2. after the child makes an artifact, /api/loom/memory returns the four
 *      tiers and the launchpad shows the narrative;
 *   3. memory is derived (same log, same sentence) and never auto-advances.
 */
test('memory — an empty log shows no memory line', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.launchpad-start')).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator('.launchpad-memory')).toHaveCount(0);
});

test('memory — after making an artifact, Lumi remembers on the launchpad', async ({ page }) => {
  // Build the arc: meet Lumi, make it glow, pick a color, confirm.
  await page.goto('/');
  await page.locator('.launchpad-start').click();
  await page.locator('.chapter-action').click();
  await page.locator('[data-agent-action="loom.focus"][data-agent-target="orb"]').click();
  const yes = page.locator('[data-agent-action="proposal.approve"]');
  await expect(yes).toHaveCount(1, { timeout: 10000 });
  await yes.click();
  await page.locator('.chapter-next').click();
  await page.locator('[data-agent-action="color.pick"][data-agent-target="color-amber"]').click();
  await page.locator('[data-agent-action="make.confirm"]').click();
  await expect(page.locator('.chapter-next')).toHaveCount(1, { timeout: 5000 });

  // The memory endpoint returns the four tiers.
  const memory = await (await page.request.get('/api/loom/memory')).json();
  expect(memory.narrative).toContain('made');
  expect(memory.colors).toContain('Amber');
  expect(memory.sharedHumanCount).toBeGreaterThan(0);
  expect(Array.isArray(memory.episodic)).toBe(true);

  // Back on the launchpad, the memory line appears — derived, not a store.
  await page.goto('/');
  const line = page.locator('.launchpad-memory');
  await expect(line).toHaveCount(1, { timeout: 5000 });
  const text = await line.innerText();
  expect(text).toContain('made');

  // It never auto-advances — Start is still the only way in.
  await expect(page.locator('.launchpad-start')).toHaveCount(1);
  await expect(page.locator('.chapter-action')).toHaveCount(0);
});

test('memory — the fold is deterministic (same log, same sentence)', async ({ request }) => {
  await request.post('/api/loom/event', {
    data: { input: { writer: 'human', kind: 'focus', node: 'orb', scope: 'shared' } },
  });
  await request.post('/api/loom/event', {
    data: { input: { writer: 'agent', kind: 'propose', id: 'p1', node: 'color-amber', body: { color: 'Amber' } } },
  });
  await request.post('/api/loom/event', {
    data: { input: { writer: 'human', kind: 'approve', proposal: 'p1', scope: 'shared' } },
  });

  const a = await (await request.get('/api/loom/memory')).json();
  const b = await (await request.get('/api/loom/memory')).json();
  expect(a.narrative).toBe(b.narrative);
  expect(a.narrative).toContain('made 1 thing');
  expect(a.colors).toEqual(['Amber']);
});