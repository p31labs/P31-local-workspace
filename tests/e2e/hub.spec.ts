import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('p31ca.org hub', () => {
  test('loads the homepage', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1, h2, .hero-title')).toBeVisible();
  });

  test('navigation links are accessible', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav).toBeVisible();
    const links = nav.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThan(4);
    for (let i = 0; i < count; i++) {
      await expect(links.nth(i)).toBeVisible();
      await expect(links.nth(i)).toHaveAttribute('href');
    }
  });

  test('skip-to-content link exists', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.locator('a:has-text("Skip to content"), a:has-text("Skip to main")');
    await expect(skipLink).toBeVisible();
  });

  test('has no critical accessibility violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toEqual([]);
  });
});
