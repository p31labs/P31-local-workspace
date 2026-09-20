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
 * The front door. A fresh visitor sees the Launchpad (level 1): one character,
 * one button, no instrument chrome. Start leads to the child's first view
 * (Chapter 1): Lumi, a "Say hello" button, no graph, no log.
 */
test('a fresh visitor sees the launchpad, then meets Lumi', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.launchpad-start')).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator('.loom-bar')).toBeHidden();

  await page.locator('.launchpad-start').click();

  // Chapter 1: Lumi is visible, no instrument chrome.
  await expect(page.locator('.chapter-lumi')).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator('.chapter-action')).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator('.loom-bar')).toBeHidden();
});

/**
 * The elder's door. The launchpad carries a quiet secondary control —
 * "See what you and Lumi made" — that opens the companion view without
 * entering the child's arc. It is 48px (the family floor) and opens the
 * elder's window even when the log is empty (the empty state points back).
 */
test('the elder can find the companion view from the launchpad', async ({ page }) => {
  await page.goto('/');

  const door = page.locator('[data-agent-action="companion.open"]');
  await expect(door).toHaveCount(1, { timeout: 5000 });
  // The elder's door is a real target, not a tiny link.
  const box = await door.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(48);

  // It opens the companion view; the launchpad chrome is gone.
  await door.click();
  await expect(page.locator('[data-agent-action="companion.view"]')).toHaveCount(1, {
    timeout: 5000,
  });
  await expect(page.locator('.launchpad-start')).toHaveCount(0);
});
