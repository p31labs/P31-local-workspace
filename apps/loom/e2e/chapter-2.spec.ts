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
 * Chapter 2 — Lumi has an idea. After the child has made something happen
 * (tapped the field orb), Lumi proposes; the builder view shows the
 * proposal, and the child can approve or defer.
 */
test('chapter 2 — Lumi proposes, child responds', async ({ page }) => {
  await page.goto('/');

  // Launchpad → meet Lumi → make something happen (tap the orb).
  await page.locator('.launchpad-start').click();
  await page.locator('.chapter-action').click();
  const orb = page.locator('[data-agent-action="loom.focus"][data-agent-target="orb"]');
  await expect(orb).toHaveCount(1, { timeout: 5000 });
  await orb.click();

  // Lumi has an idea — the proposal renders in the builder view.
  await expect(page.locator('.chapter-proposal')).toHaveCount(1, { timeout: 10000 });

  // The child says "Looks good."
  await page.locator('.chapter-action--ok').click();

  // The approve event committed to the log — the log is the source of truth.
  const events = await (await page.request.get('/api/loom/events')).json();
  expect(events.some((e: { kind: string }) => e.kind === 'approve')).toBe(true);
});
