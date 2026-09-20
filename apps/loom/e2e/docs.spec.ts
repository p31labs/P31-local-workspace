import { test, expect } from '@playwright/test';

/**
 * ?mode=docs — the live-contract surface. Hidden from any switcher, chrome
 * hidden, reads the running contract (tokens + manifest), so it cannot drift.
 */
test('docs mode renders the live token and manifest contract', async ({ page }) => {
  // The seed is a build-time asset, not served by the dev server — route it
  // to a deterministic fixture so the log pane's fold can be verified.
  await page.route('/events.seed.json', (route) => {
    void route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([
        { seq: 0, ts: '2026-01-01T00:00:00.000Z', writer: 'human', kind: 'focus', node: '--p31-accent' },
        { seq: 1, ts: '2026-01-01T00:00:00.000Z', writer: 'agent', kind: 'traverse', from: '--p31-accent', to: '.a2-data-card', reason: 'test' },
      ]),
    });
  });

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

  // Log: the step-through folds the demo seed and shows state.
  await expect(page.locator('.docs-log-controls')).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator('.docs-log-line').first()).toHaveCount(1, { timeout: 5000 });
  // Stepping forward lands the first folded event.
  await page.locator('.docs-log-btn').nth(1).click();
  await expect(page.getByText('focused:', { exact: false }).first()).toHaveCount(1, { timeout: 5000 });
});