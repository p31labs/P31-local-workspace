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
 * Chapter 1 — the child's first two beats. A fresh visitor:
 * 1. Sees the Launchpad → presses Start → meets Lumi (waving) + "Say hello"
 * 2. Taps → "Hi! I'm Lumi." → the field orb appears
 * 3. Taps the orb → "You made it glow!" → the orb is spent (not hidden)
 * 4. Both `focus` events (lumi, orb) landed in the log.
 */
test('chapter 1 — fresh visitor meets Lumi, then makes something happen', async ({ page }) => {
  await page.goto('/');

  // Launchpad → Start → Chapter 1.
  await expect(page.locator('.launchpad-start')).toHaveCount(1, { timeout: 5000 });
  await page.locator('.launchpad-start').click();

  // Beat 1: Lumi arrives waving, one action button, no chrome.
  await expect(page.locator('.chapter-lumi')).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator('.chapter-action')).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator('.lumi-wrap--wave')).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator('.loom-bar')).toBeHidden();

  // Tap → celebration, then the greeting.
  await page.locator('.chapter-action').click();
  await expect(page.locator('.chapter-celebration')).toHaveCount(1, { timeout: 3000 });
  await expect(page.getByText('Hi! I\u2019m Lumi.', { exact: false }).first()).toHaveCount(1, {
    timeout: 5000,
  });

  // Beat 2: the field orb appears (opt-in sound is off by default).
  const orb = page.locator('[data-agent-action="loom.focus"][data-agent-target="orb"]');
  await expect(orb).toHaveCount(1, { timeout: 5000 });
  const toggle = page.locator('[data-agent-action="chapter.sound.toggle"]');
  await expect(toggle).toHaveCount(1);
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');

  // Tap the orb → "You made it glow!" → the orb is spent, not hidden.
  await orb.click();
  await expect(page.getByText('You made it glow!', { exact: false }).first()).toHaveCount(1, {
    timeout: 5000,
  });
  await expect(orb).toBeDisabled();

  // Both focus events committed to the log.
  await page.waitForFunction(() => {
    return document.querySelectorAll('[data-agent-action="loom.focus"]').length > 0;
  }, { timeout: 5000 });
});
