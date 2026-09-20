import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const logPath = resolve(here, '..', '.loom', 'ci-events.jsonl');

test.beforeEach(() => {
  mkdirSync(dirname(logPath), { recursive: true });

test.setTimeout(60000);

  writeFileSync(logPath, '');
});

/**
 * Chapter 4 — You have an idea. The roles reverse. The child picks a color,
 * Lumi formalizes it, the child confirms. Three events: a focus (the pick),
 * an agent propose (Lumi's review), an approve (the confirm).
 */
async function reachCreative(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.locator('.launchpad-start').click();
  await page.locator('.chapter-action').click(); // Meet Lumi
  const orb = page.locator('[data-agent-action="loom.focus"][data-agent-target="orb"]');
  await expect(orb).toHaveCount(1, { timeout: 5000 });
  await orb.click(); // Make something happen
  const yes = page.locator('[data-agent-action="proposal.approve"]');
  await expect(yes).toHaveCount(1, { timeout: 10000 });
  await yes.click(); // Lumi has an idea — yes
  await expect(page.locator('.chapter-next')).toHaveCount(1, { timeout: 5000 });
  await page.locator('.chapter-next').click(); // See what we made -> Chapter 4
}

test('chapter 4 — child proposes a color, Lumi reviews, child confirms', async ({ page }) => {
  await reachCreative(page);

  // The picker: three swatches, a clear question, no chrome.
  const amber = page.locator('[data-agent-action="color.pick"][data-agent-target="color-amber"]');
  const green = page.locator('[data-agent-action="color.pick"][data-agent-target="color-green"]');
  const pink = page.locator('[data-agent-action="color.pick"][data-agent-target="color-pink"]');
  await expect(amber).toHaveCount(1, { timeout: 5000 });
  await expect(green).toHaveCount(1);
  await expect(pink).toHaveCount(1);
  await expect(page.getByText('What color should we make?', { exact: false }).first()).toHaveCount(1);
  await expect(page.locator('.loom-bar')).toBeHidden();

  // Swatch clears the 64px child/elder target.
  const amberBox = await amber.boundingBox();
  expect(amberBox?.height ?? 0).toBeGreaterThanOrEqual(64);

  // Pick a color -> the child's idea lands as a focus, Lumi's propose follows.
  await amber.click();
  await expect(page.locator('[data-agent-action="make.confirm"]')).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator('[data-agent-action="color.repick"]')).toHaveCount(1);
  await expect(page.getByText('I like this! Can I make it for you?', { exact: false }).first()).toHaveCount(1);

  // Both review buttons clear the 48px floor.
  const confirmBox = await page.locator('[data-agent-action="make.confirm"]').boundingBox();
  const repickBox = await page.locator('[data-agent-action="color.repick"]').boundingBox();
  expect(confirmBox?.height ?? 0).toBeGreaterThanOrEqual(48);
  expect(repickBox?.height ?? 0).toBeGreaterThanOrEqual(48);

  // Confirm -> celebration -> hand-off.
  await page.locator('[data-agent-action="make.confirm"]').click();
  await expect(page.getByText('Making it!', { exact: false }).first()).toHaveCount(1, {
    timeout: 5000,
  });
  await expect(page.locator('.chapter-next')).toHaveCount(1, { timeout: 5000 });

  // The log holds the arc: the child's pick (focus), Lumi's propose, the approve.
  const events = await (await page.request.get('/api/loom/events')).json();
  expect(
    events.some(
      (e: { writer: string; kind: string; node?: string }) =>
        e.writer === 'human' && e.kind === 'focus' && e.node === 'color-amber',
    ),
  ).toBe(true);
  expect(
    events.some(
      (e: { writer: string; kind: string; author?: string; body?: unknown }) =>
        e.writer === 'agent' &&
        e.kind === 'propose' &&
        e.author === 'lumi' &&
        (e.body as { color?: string } | undefined)?.color === 'Amber',
    ),
  ).toBe(true);
  expect(events.some((e: { kind: string }) => e.kind === 'approve')).toBe(true);
});

test('chapter 4 — Pick another color is fully reversible', async ({ page }) => {
  await reachCreative(page);

  // Pick green, then go back.
  await page.locator('[data-agent-action="color.pick"][data-agent-target="color-green"]').click();
  await expect(page.locator('[data-agent-action="color.repick"]')).toHaveCount(1, { timeout: 5000 });
  await page.locator('[data-agent-action="color.repick"]').click();

  // Back at the picker. Pick amber this time.
  await expect(
    page.locator('[data-agent-action="color.pick"][data-agent-target="color-amber"]'),
  ).toHaveCount(1, { timeout: 5000 });
  await page.locator('[data-agent-action="color.pick"][data-agent-target="color-amber"]').click();

  // The review card is fresh — buttons enabled, no stale "confirmed" state.
  await expect(page.locator('[data-agent-action="make.confirm"]')).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator('[data-agent-action="color.repick"]')).toHaveCount(1);

  // The log has both picks and Lumi's proposal for the final color.
  const events = await (await page.request.get('/api/loom/events')).json();
  const focuses = events.filter(
    (e: { writer: string; kind: string; node?: string }) =>
      e.writer === 'human' && e.kind === 'focus' && (e.node === 'color-green' || e.node === 'color-amber'),
  );
  expect(focuses.length).toBeGreaterThanOrEqual(2);
  expect(
    events.some(
      (e: { writer: string; kind: string; body?: unknown }) =>
        e.writer === 'agent' &&
        e.kind === 'propose' &&
        (e.body as { color?: string } | undefined)?.color === 'Amber',
    ),
  ).toBe(true);
});