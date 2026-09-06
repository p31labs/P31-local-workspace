import { test, expect } from '@playwright/test';

const BASE_URL = process.env.DESIGN_PORTAL_URL || 'https://design.p31ca.org';

test.describe('Design Portal — Visual Regression', () => {
  test('homepage loads with React app', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2')).toBeVisible();
  });

  test('color swatches render', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Colors")');
    await expect(page.locator('.text-center').nth(0)).toBeVisible();
  });

  test('spoon demo renders', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Spoons")');
    await expect(page.locator('button:has-text("0 — Crisis")')).toBeVisible();
  });

  test('glass demo renders', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Glass")');
    await expect(page.locator('.glass-panel').nth(0)).toBeVisible();
  });

  test('bottom nav renders', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    const bottomNav = page.locator('.bottom-nav');
    await expect(bottomNav).toBeVisible();
  });

  test('data-spoons attribute present', async ({ page }) => {
    await page.goto(BASE_URL);
    const spoons = await page.getAttribute('html', 'data-spoons');
    expect(spoons).toBeTruthy();
  });

  test('design tokens are defined', async ({ page }) => {
    await page.goto(BASE_URL);
    const tokens = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement);
      return {
        '--p31-bg': styles.getPropertyValue('--p31-bg').trim(),
        '--p31-accent': styles.getPropertyValue('--p31-accent').trim(),
        '--p31-glass-bg': styles.getPropertyValue('--p31-glass-bg').trim(),
      };
    });
    expect(tokens['--p31-bg']).toBeTruthy();
    expect(tokens['--p31-accent']).toBeTruthy();
  });

  test('mcp console renders', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("MCP Console")');
    await expect(page.locator('button:has-text("list_tokens")')).toBeVisible();
    await expect(page.locator('button:has-text("resolve_token")')).toBeVisible();
  });

  test('mcp docs renders', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("MCP Docs")');
    await expect(page.locator('h3:has-text("Claude Code")').nth(0)).toBeVisible();
    await expect(page.locator('h3:has-text("Cursor")').nth(0)).toBeVisible();
  });
});
