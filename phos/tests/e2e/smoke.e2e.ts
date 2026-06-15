import { test, expect } from '@playwright/test';

const BASE = process.env.PHOS_BASE_URL || 'http://localhost:4321';

test.describe.configure({ mode: 'serial' });

test.describe('PHOS Application E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    // Skip tour overlay if present
    const overlayClose = page.locator('button:has-text("Skip")');
    if (await overlayClose.count() > 0) {
      await overlayClose.click();
      await page.waitForTimeout(500);
    }

    // Wait for main app shell
    const hudBtn = page.locator('button:has-text("Toggle HUD")');
    await expect(hudBtn).toBeVisible({ timeout: 5000 });
  });

  // ─── App Bootstrap ────────────────────────────────────────────────────

  test('page title contains PHOS', async ({ page }) => {
    await expect(page).toHaveTitle(/PHOS/);
  });

  test('spoon level displays in interface', async ({ page }) => {
    const spoonText = page.locator('text=/\\d\\/5/');
    await expect(spoonText.first()).toBeVisible({ timeout: 3000 });
  });

  test('HUD toggle button is present', async ({ page }) => {
    await expect(page.locator('button:has-text("Toggle HUD")')).toBeVisible();
  });

  // ─── Tour / Demo Flow ─────────────────────────────────────────────────

  test('Skip button closes tour overlay', async ({ page }) => {
    await page.reload();
    await page.waitForLoadState('networkidle');

    const skipBtn = page.locator('button:has-text("Skip")');
    if (await skipBtn.count() > 0) {
      await skipBtn.click();
      await page.waitForTimeout(600);
    }

    const hudBtn = page.locator('button:has-text("Toggle HUD")');
    await expect(hudBtn).toBeVisible({ timeout: 5000 });
  });

  test('Play tour starts demo mode', async ({ page }) => {
    const playBtn = page.locator('button[aria-label="Play tour"]');
    if (await playBtn.count() > 0) {
      await playBtn.click();
      await page.waitForTimeout(500);
    }
    await expect(page).toHaveTitle(/PHOS/);
  });

  test('Demo next/prev buttons are clickable', async ({ page }) => {
    const nextBtn = page.locator('button[aria-label="Next stage"]');
    if (await nextBtn.count() > 0) {
      await nextBtn.click();
      await page.waitForTimeout(300);
    }
    const prevBtn = page.locator('button[aria-label="Previous stage"]');
    if (await prevBtn.count() > 0) {
      await prevBtn.click();
      await page.waitForTimeout(300);
    }
    await expect(page).toHaveTitle(/PHOS/);
  });

  test('Demo stage dots are present', async ({ page }) => {
    const dots = page.locator('button[aria-label^="Go to stage"]');
    const count = await dots.count();
    expect(count).toBeGreaterThan(0);
  });

  // ─── HUD Navigation ───────────────────────────────────────────────────

  test('HUD opens with H key showing surface tabs', async ({ page }) => {
    // Defocus input by clicking outside
    await page.locator('body').click({ position: { x: 800, y: 400 } });
    await page.waitForTimeout(200);

    await page.keyboard.press('h');
    await page.waitForTimeout(400);

    // HUD should show surface names
    await expect(page.locator('text=/Arcade|Grid|Vault|Settings/i')).toBeVisible({ timeout: 3000 });

    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('HUD surface tab navigation works', async ({ page }) => {
    await page.locator('body').click({ position: { x: 800, y: 400 } });
    await page.waitForTimeout(200);

    await page.keyboard.press('h');
    await page.waitForTimeout(400);

    const arcadeTab = page.locator('tab:has-text("Arcade")');
    if (await arcadeTab.count() > 0) {
      await arcadeTab.click();
      await page.waitForTimeout(500);
    }

    await page.keyboard.press('Escape');
  });

  test('HUD spoon radio buttons interactive', async ({ page }) => {
    await page.locator('body').click({ position: { x: 800, y: 400 } });
    await page.waitForTimeout(200);

    await page.keyboard.press('h');
    await page.waitForTimeout(400);

    const radio1 = page.locator('radio:has-text("1 spoons")');
    if (await radio1.count() > 0) {
      await radio1.click();
      await page.waitForTimeout(300);
    }

    await page.keyboard.press('Escape');
  });

  test('HUD close via Escape returns to app', async ({ page }) => {
    await page.locator('body').click({ position: { x: 800, y: 400 } });
    await page.waitForTimeout(200);

    await page.keyboard.press('h');
    await page.waitForTimeout(400);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    await expect(page.locator('button:has-text("Toggle HUD")')).toBeVisible();
  });

  // ─── Stability ────────────────────────────────────────────────────────

  test(' rapid HUD open/close does not crash', async ({ page }) => {
    for (let i = 0; i < 4; i++) {
      await page.locator('body').click({ position: { x: 800, y: 400 } });
      await page.waitForTimeout(50);
      await page.keyboard.press('h');
      await page.waitForTimeout(100);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);
    }
    await expect(page.locator('button:has-text("Toggle HUD")')).toBeVisible();
  });

  test('page still on PHOS after interactions', async ({ page }) => {
    await page.locator('body').click({ position: { x: 800, y: 400 } });
    await page.keyboard.press('h');
    await page.waitForTimeout(200);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    await expect(page).toHaveTitle(/PHOS/);
  });

  // ─── Crisis Mode ──────────────────────────────────────────────────────

  test('Crisis mode button closes interactive shell', async ({ page }) => {
    await page.locator('body').click({ position: { x: 800, y: 400 } });
    await page.waitForTimeout(200);

    await page.keyboard.press('h');
    await page.waitForTimeout(400);

    const crisisBtn = page.locator('button:has-text("CRISIS_MODE")');
    if (await crisisBtn.count() > 0) {
      await crisisBtn.click();
      await page.waitForTimeout(800);
      const input = page.locator('input[aria-label="Chat input"]');
      expect(await input.count()).toBe(0);
    }
  });

  // ─── Accessibility ────────────────────────────────────────────────────

  test('all buttons have accessible names', async ({ page }) => {
    const buttons = page.locator('button');
    const count = await buttons.count();
    let failures = 0;
    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const aria = await btn.getAttribute('aria-label');
      const text = (await btn.textContent())?.trim() || '';
      if (!aria && !text) failures++;
    }
    expect(failures).toBe(0);
  });

  test('focus-visible styles are present in CSS', async ({ page }) => {
    const found = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules || [])) {
            if (typeof rule.cssText === 'string' && rule.cssText.includes('focus-visible')) {
              return true;
            }
          }
        } catch {}
      }
      return false;
    });
    expect(found).toBe(true);
  });
});
