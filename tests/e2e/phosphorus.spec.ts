import { test, expect } from '@playwright/test';

test.describe('phosphorus31.org', () => {
  test('loads the homepage', async ({ page }) => {
    const response = await page.goto('https://phosphorus31.org');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('donate page loads', async ({ page }) => {
    await page.goto('https://phosphorus31.org/donate');
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('navigation works', async ({ page }) => {
    await page.goto('https://phosphorus31.org');
    await page.click('a[href="/about"]');
    await expect(page).toHaveURL(/\/about/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('has structured data', async ({ page }) => {
    await page.goto('https://phosphorus31.org');
    const jsonld = page.locator('script[type="application/ld+json"]');
    await expect(jsonld).toBeVisible();
    const content = await jsonld.textContent();
    expect(content).toContain('NGO');
    expect(content).toContain('P31 Labs');
  });
});
