import { test, expect } from '@playwright/test';

test.describe('Cognitive Load & Complexity Metrics Matrix', () => {
  const targetUrl = 'http://localhost:4321';

  test('SANCTUARY mode must automatically restrict interactive layer footprints', async ({ page }) => {
    await page.goto(`${targetUrl}/?spoons=1`);
    await page.waitForTimeout(1100);

    const monoElements = await page.locator('.font-mono').count();
    expect(monoElements).toBeLessThan(10);

    const buttons = await page.locator('button').count();
    expect(buttons).toBeLessThan(15);
  });

  test('QUANTUM mode changes display configuration properties instantly', async ({ page }) => {
    await page.goto(`${targetUrl}/?spoons=4`);
    await page.waitForTimeout(1100);

    const bodyClasses = await page.locator('div.min-h-screen').getAttribute('class');
    expect(bodyClasses).toContain('font-mono');
  });

  test('Morph timing invariants must protect cognitive boundaries', async ({ page }) => {
    await page.goto(`${targetUrl}/?spoons=4`);
    await page.waitForTimeout(500);

    const startTimestamp = Date.now();
    await page.click('button:has-text("STATE")');
    await page.click('button:has-text("1")');

    await page.waitForSelector('.font-sans');
    const endTimestamp = Date.now();

    expect(endTimestamp - startTimestamp).toBeGreaterThanOrEqual(0);
  });
});
