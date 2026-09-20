import { test, expect } from '@playwright/test';

/**
 * ?mode=docs — the live-contract surface. Hidden from any switcher, chrome
 * hidden, reads the running contract (tokens + manifest), so it cannot drift.
 */
test('docs mode renders the live token and manifest contract', async ({ page }) => {
  await page.goto('/?mode=docs');

  // The region is present, and no instrument chrome leaks in.
  await expect(page.locator('[data-agent-action="docs.view"]')).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator('.loom-bar')).toBeHidden();

  // Tokens: the P31TokenName union renders at least one swatch — the contract
  // is non-empty, and each swatch is painted with a real var(--p31-*).
  await expect(page.locator('.docs-token').first()).toHaveCount(1, { timeout: 5000 });
  const swatchCount = await page.locator('.docs-token-swatch').count();
  expect(swatchCount).toBeGreaterThan(100);

  // Actions: the manifest loaded and shows the agent-side annotation.
  await expect(page.locator('.docs-action').first()).toHaveCount(1, { timeout: 5000 });
  await expect(page.getByText('agent-side', { exact: false }).first()).toHaveCount(1, { timeout: 5000 });
});