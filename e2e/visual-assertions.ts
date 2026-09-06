import { type Page, expect } from '@playwright/test';

/**
 * Structural assertions — verify the page rendered correctly before screenshot.
 * These catch missing elements that pixel diff alone might miss.
 */

export async function assertHeaderRendered(page: Page) {
  const header = page.locator(
    '.site-header, .phos-header, .willow-header, header:has(a), header:has(nav)',
  ).first();
  await expect(header).toBeAttached({ timeout: 5000 });
  // Check backdrop-filter via computed style (works for both inline and CSS class)
  const bg = await header.evaluate((el) => getComputedStyle(el).backdropFilter);
  expect(bg).toMatch(/blur/);
}

export async function assertCrownVisible(page: Page) {
  const crown = page.locator(
    '.crown-container svg, svg[viewBox*="100 100"], svg[viewBox*="200 168"]',
  ).first();
  await expect(crown).toBeAttached({ timeout: 5000 });
  const viewBox = await crown.getAttribute('viewBox');
  expect(viewBox).toMatch(/100|168/);
}

export async function assertStarfieldExists(page: Page) {
  const starfield = page.locator('#starfield-canvas, canvas[id*="starfield"]');
  const count = await starfield.count();
  if (count > 0) {
    await expect(starfield.first()).toBeVisible({ timeout: 3000 });
    const width = await starfield.first().getAttribute('width');
    const height = await starfield.first().getAttribute('height');
    expect(Number(width)).toBeGreaterThan(0);
    expect(Number(height)).toBeGreaterThan(0);
  }
}

export async function assertBrandAttribute(page: Page, expectedBrand: string) {
  const brand = await page.locator('html').getAttribute('data-brand');
  expect(brand).toBe(expectedBrand);
}

export async function assertSpoonAttribute(page: Page, expectedSpoons: string) {
  const spoons = await page.locator('html').getAttribute('data-spoons');
  expect(spoons).toBe(expectedSpoons);
}

export async function assertCssTokenResolves(page: Page, token: string, expectedPattern: RegExp) {
  const value = await page.evaluate((t) => {
    const root = getComputedStyle(document.documentElement);
    return root.getPropertyValue(t).trim();
  }, token);
  expect(value).toMatch(expectedPattern);
}
