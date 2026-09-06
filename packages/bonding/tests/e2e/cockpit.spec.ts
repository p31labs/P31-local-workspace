/**
 * WCD-16: Cockpit GUI E2E Test
 *
 * Proves the HUD is visible and interactive using a real headless browser.
 * Catches invisible pointer-event shields and off-screen overflow.
 *
 * Requires: dev server running on localhost:5173
 */

import { test, expect } from '@playwright/test';

test.describe('Cockpit HUD', () => {
  test.beforeEach(async ({ page }) => {
    // R3F/WebGL canvases never fire 'load' in headless — use domcontentloaded
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // ModeSelect Phase 1: pick Seed mode (simplest, fastest to load)
    // Mode cards are <button> elements, not headings.
    const seedMode = page.getByRole('button', { name: /Seed/ }).first();
    await seedMode.waitFor({ timeout: 15_000 });
    await seedMode.click();

    // ModeSelect Phase 2: pick Free Build (skips quest setup)
    const freeBuild = page.getByRole('button', { name: /Free Build/ });
    await freeBuild.waitFor({ timeout: 5_000 });
    await freeBuild.click();

    // Wait for cockpit — the "Drag an element up to begin" hint is unique
    // to the cockpit and doesn't appear in ModeSelect.
    await page.getByText('Drag an element up to begin').waitFor({ timeout: 15_000 });

    // Dismiss tutorial overlay if it auto-started (its full-screen tap
    // target at z-40 blocks all other interactions).
    const tutorialMinimize = page.locator('button:has-text("✕")');
    if (await tutorialMinimize.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await tutorialMinimize.click();
    }
  });

  test('TopBar is visible with BONDING title', async ({ page }) => {
    const title = page.getByText('BONDING');
    await expect(title).toBeVisible({ timeout: 5_000 });
  });

  test('Element palette H button is visible and clickable', async ({ page }) => {
    // Element palette buttons contain just the symbol ("H", "O")
    const hButton = page.getByRole('button', { name: /^H$/ }).first();
    await expect(hButton).toBeVisible();
    // If an invisible z-index shield blocks this, Playwright throws
    // "Element is not clickable because <div> intercepts pointer events"
    await hButton.click({ force: false });
  });

  test('CommandBar stability gauge is within viewport', async ({ page }) => {
    // The stability text reads "0% STABLE"
    const stable = page.getByText(/STABLE/);
    await expect(stable).toBeVisible({ timeout: 5_000 });
    // Verify it's actually within the visible viewport, not pushed off-screen
    const box = await stable.boundingBox();
    expect(box).not.toBeNull();
    const viewport = page.viewportSize()!;
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
  });

  test('Difficulty selector buttons are clickable', async ({ page }) => {
    // The seed emoji button in the CommandBar
    const seedButton = page.locator('button[aria-label="seed difficulty"]');
    await expect(seedButton).toBeVisible({ timeout: 5_000 });
    await seedButton.click({ force: false });
  });
});
