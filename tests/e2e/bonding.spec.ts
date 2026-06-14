import { test, expect } from '@playwright/test';

test.describe('BONDING game', () => {
  test('loads the game canvas', async ({ page }) => {
    await page.goto('https://bonding.p31ca.org');
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });
  });

  test('page has proper title', async ({ page }) => {
    await page.goto('https://bonding.p31ca.org');
    const title = await page.title();
    expect(title.toLowerCase()).toContain('bonding');
  });
});
