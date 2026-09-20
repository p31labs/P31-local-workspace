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
