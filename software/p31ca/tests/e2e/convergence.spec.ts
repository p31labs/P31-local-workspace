import { test, expect } from '@playwright/test';

test.describe('Convergence E2E', () => {
  test('ADA document generation flow', async ({ page }) => {
    await page.goto('/ada');
    await expect(page.locator('h1:has-text("Tetrahedron Protocol")')).toBeVisible();

    await page.fill('input[name="date"]', '2026-06-21');
    await page.fill('input[name="duration"]', '60');
    await page.fill('input[name="supervisor"]', 'Brenda');
    await page.click('button:has-text("Save Log")');
    await expect(page.locator('text=2026-06-21')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download ADA Document")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/ada-request-.*\.md/);
  });

  test('Passport wizard saves draft', async ({ page }) => {
    await page.goto('/passport');
    await expect(page.locator('h1:has-text("Cognitive Passport")')).toBeVisible();
    await expect(page.locator('text=/Saved/i')).toBeVisible();
  });
});
