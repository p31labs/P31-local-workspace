import { test, expect } from '@playwright/test';

test.describe('Autonomic Circuit Breaker Validation', () => {
  const targetUrl = 'http://localhost:4321';

  test('Crisis triggers instantaneous functional isolation mechanisms', async ({ page }) => {
    await page.goto(targetUrl);

    await page.click('button:has-text("STATE")');
    await page.click('button:has-text("0")');

    await page.waitForSelector('style');

    const mainWrapper = page.locator('div.bg-black');
    await expect(mainWrapper).toBeVisible();
  });
});
