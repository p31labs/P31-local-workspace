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
 * Chapter 1 — Meet Lumi. A fresh visitor:
 * 1. Sees the Launchpad → presses Start → sees Lumi waving + "Say hello"
 * 2. Taps → celebration pulse → "Hi! I'm Lumi." → "What's next"
 * 3. The `focus` event landed in the log.
 */
test('chapter 1 — fresh visitor meets Lumi and taps', async ({ page }) => {
  await page.goto('/');

  // Launchpad → Start → Chapter 1.
  await expect(page.locator('.launchpad-start')).toHaveCount(1, { timeout: 5000 });
  await page.locator('.launchpad-start').click();

  // Chapter 1: Lumi arrives waving, one action button, no chrome.
  await expect(page.locator('.chapter-lumi')).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator('.chapter-action')).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator('.lumi-wrap--wave')).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator('.loom-bar')).toBeHidden();

  // Tap → celebration. The focus event lands in the log (the Say hello button
  // stays mounted, disabled, during the pulse).
  await page.locator('.chapter-action').click();
  await expect(page.locator('.chapter-celebration')).toHaveCount(1, { timeout: 3000 });
  await page.waitForFunction(() => {
    return document.querySelectorAll('[data-agent-action="loom.focus"]').length > 0;
  }, { timeout: 5000 });

  // Once the pulse settles: the greeting and the hand-off appear.
  await expect(page.getByText('Hi! I\u2019m Lumi.', { exact: false }).first()).toHaveCount(1, {
    timeout: 5000,
  });
  await expect(page.locator('.chapter-next')).toHaveCount(1, { timeout: 5000 });
});
