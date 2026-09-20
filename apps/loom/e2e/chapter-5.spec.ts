import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const logPath = resolve(here, '..', '.loom', 'ci-events.jsonl');

test.beforeEach(() => {
  mkdirSync(dirname(logPath), { recursive: true });
  writeFileSync(logPath, '');
});

/**
 * Chapter 5 — The Workshop. After the child has picked a color, Lumi has
 * formalized it, and the child has confirmed, Chapter 5 shows what they made
 * — derived from the log, not from component state — and opens the door to
 * the instrument.
 */
async function reachWorkshop(
  page: import('@playwright/test').Page,
  color: 'amber' | 'green' | 'pink' = 'amber',
) {
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
  await page.locator('.chapter-next').click(); // -> Chapter 4

  await page.locator(`[data-agent-action="color.pick"][data-agent-target="color-${color}"]`).click();
  await expect(page.locator('[data-agent-action="make.confirm"]')).toHaveCount(1, { timeout: 5000 });
  await page.locator('[data-agent-action="make.confirm"]').click();
  await expect(page.locator('.chapter-next')).toHaveCount(1, { timeout: 5000 });
  await page.locator('.chapter-next').click(); // -> Chapter 5
}

test('chapter 5 — the child sees what the loop made, then the door opens', async ({ page }) => {
  await reachWorkshop(page, 'amber');

  // The artifact is here, in the color the child picked.
  const artifact = page.locator('[data-agent-action="artifact.tap"]');
  await expect(artifact).toHaveCount(1, { timeout: 5000 });
  await expect(page.getByText('Look what we made.', { exact: false }).first()).toHaveCount(1);
  await expect(page.locator('.made-artifact-label')).toContainText('amber');
  await expect(page.locator('.loom-bar')).toBeHidden();

  // The artifact is a real, tappable button — not a preview image.
  const box = await artifact.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(64);
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(200);

  // Tapping it commits a focus on 'artifact' — proof it's alive.
  await artifact.click();
  const events = await (await page.request.get('/api/loom/events')).json();
  expect(
    events.some(
      (e: { writer: string; kind: string; node?: string }) =>
        e.writer === 'human' && e.kind === 'focus' && e.node === 'artifact',
    ),
  ).toBe(true);

  // The door to the Workshop is visible, and nothing moves without a tap.
  const open = page.locator('[data-agent-action="chapter.workshop.open"]');
  await expect(open).toHaveCount(1);
  await open.click();
  // The instrument is now showing (chrome visible, mode switched).
  await expect(page.locator('.loom-bar')).toBeVisible({ timeout: 5000 });
});

test('chapter 5 — the artifact follows the log, not component state', async ({ page }) => {
  await reachWorkshop(page, 'amber');

  // The artifact is amber.
  await expect(page.locator('.made-artifact-label')).toContainText('amber', { timeout: 5000 });

  // The derivation is stable: the most recent agent propose with a color body
  // is the artifact — same source the component reads.
  const events = await (await page.request.get('/api/loom/events')).json();
  const lastColor = [...events]
    .reverse()
    .find(
      (e: { writer: string; kind: string; body?: unknown }) =>
        e.writer === 'agent' &&
        e.kind === 'propose' &&
        typeof (e.body as { color?: unknown } | undefined)?.color === 'string',
    );
  expect((lastColor as { body: { color: string } }).body.color).toBe('Amber');
});