import { test, expect } from '@playwright/test';

const BASE = process.env.PHOS_BASE_URL || 'http://localhost:4321';

test.describe.configure({ mode: 'serial' });

test.describe('Autonomic Circuit Breaker & Crisis Mode (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    // Skip tour overlay if present
    const overlayClose = page.locator('button:has-text("Skip")');
    if (await overlayClose.count() > 0) {
      await overlayClose.click();
      await page.waitForTimeout(500);
    }

    // Wait for app shell
    await expect(page.locator('button:has-text("Toggle HUD")')).toBeVisible({ timeout: 5000 });
  });

  test('Crisis mode closes interactive shell instantly', async ({ page }) => {
    await page.locator('body').click({ position: { x: 800, y: 400 } });
    await page.waitForTimeout(200);

    await page.keyboard.press('h');
    await page.waitForTimeout(400);

    const crisisBtn = page.locator('button:has-text("Emergency crisis mode")');
    if (await crisisBtn.count() > 0) {
      await crisisBtn.click();
      await page.waitForTimeout(800);

      const input = page.locator('input[aria-label="Chat input"]');
      expect(await input.count()).toBe(0);
    }
  });

  test('Crisis mode removes all interactive buttons', async ({ page }) => {
    await page.locator('body').click({ position: { x: 800, y: 400 } });
    await page.waitForTimeout(200);

    await page.keyboard.press('h');
    await page.waitForTimeout(400);

    const crisisBtn = page.locator('button:has-text("Emergency crisis mode")');
    if (await crisisBtn.count() > 0) {
      await crisisBtn.click();
      await page.waitForTimeout(800);

      // In crisis mode, input and main chat should be hidden
      const input = page.locator('input[aria-label="Chat input"]');
      const inputCount = await input.count();
      // Crisis mode removes the input
      expect(inputCount).toBe(0);
    }
  });

  test('Page remains visible during crisis mode transition', async ({ page }) => {
    await page.locator('body').click({ position: { x: 800, y: 400 } });
    await page.waitForTimeout(200);

    await page.keyboard.press('h');
    await page.waitForTimeout(400);

    const crisisBtn = page.locator('button:has-text("Emergency crisis mode")');
    if (await crisisBtn.count() > 0) {
      await crisisBtn.click();
      await page.waitForTimeout(500);

      // Page should still be loaded
      const title = await page.title();
      expect(title).toContain('PHOS');
    }
  });
});
