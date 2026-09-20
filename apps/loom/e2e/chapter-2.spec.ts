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
 * Chapter 2 — Lumi has an idea. After a focus event exists, the
 * builder view shows Lumi's proposal (auto-committed by the agent),
 * and the child can approve or defer.
 */
test('chapter 2 — Lumi proposes, child responds', async ({ page }) => {
  await page.goto('/');

  // Meet Lumi and tap so a focus event exists (Chapter 1 → Chapter 2).
  await page.locator('.launchpad-start').click();
  await page.locator('.chapter-action').click();
  await expect(page.locator('.chapter-lumi')).toHaveCount(1, { timeout: 5000 });

  // Chapter 2: Lumi has an idea (auto-proposed after 2s).
  await expect(page.locator('.chapter-proposal')).toHaveCount(1, { timeout: 10000 });

  // The child says "Looks good."
  await page.locator('.chapter-action--ok').click();

  // The approve event committed to the log — the log is the source of truth.
  const events = await (await page.request.get('/api/loom/events')).json();
  expect(events.some((e: { kind: string }) => e.kind === 'approve')).toBe(true);
});
