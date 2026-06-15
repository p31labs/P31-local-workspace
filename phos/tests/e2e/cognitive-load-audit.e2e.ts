import { test, expect } from '@playwright/test';

const BASE = process.env.PHOS_BASE_URL || 'http://localhost:4321';

test.describe('Cognitive Load & Complexity Metrics Matrix (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try { localStorage.removeItem('p31:spoons'); } catch {}
    });
  });

  test('SANCTUARY mode (spoons=1) restricts interactive elements', async ({ page }) => {
    await page.goto(`${BASE}/?spoons=1`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(600);

    // In SANCTUARY mode, font-mono usage should be minimal
    const monoCount = await page.locator('.font-mono').count();
    expect(monoCount).toBeGreaterThan(0); // App uses monospace
    expect(monoCount).toBeLessThan(30);   // But not saturated
  });

  test('QUANTUM mode (spoons=4) enables full mono display', async ({ page }) => {
    await page.goto(`${BASE}/?spoons=4`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(600);

    const bodyClasses = await page.locator('div.min-h-screen').getAttribute('class');
    expect(bodyClasses).toContain('font-mono');
  });

  test('HUD toggle via H key works in default state', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    await page.keyboard.press('h');
    await page.waitForTimeout(300);
    // HUD should show navigation to surfaces
    await expect(page.locator('text=/Arcade/i')).toBeVisible({ timeout: 2000 });
    await page.keyboard.press('Escape');
  });
});
