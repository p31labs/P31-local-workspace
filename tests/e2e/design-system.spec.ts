import { test, expect } from '@playwright/test';

test.describe('P31 Design System — Visual Regression', () => {
  test.describe('p31ca.org', () => {
    test('homepage matches snapshot', async ({ page }) => {
      await page.goto('https://p31ca.org');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveScreenshot('p31ca-homepage.png', {
        fullPage: true,
        maxDiffPixels: 100,
        timeout: 30000,
      });
    }, 60000);

    test('topbar renders correctly', async ({ page }) => {
      await page.goto('https://p31ca.org');
      const topbar = page.locator('header, nav').first();
      await expect(topbar).toHaveScreenshot('p31ca-topbar.png', {
        timeout: 30000,
      });
    }, 60000);

    test('feature cards render correctly', async ({ page }) => {
      await page.goto('https://p31ca.org');
      const featureCard = page.locator('.feature-card').first();
      if (await featureCard.count() > 0) {
        await expect(featureCard).toHaveScreenshot('p31ca-feature-card.png');
      }
    });

    test('glass panel renders correctly', async ({ page }) => {
      await page.goto('https://p31ca.org');
      const glassPanel = page.locator('.glass-card, .glass-panel').first();
      if (await glassPanel.count() > 0) {
        await expect(glassPanel).toHaveScreenshot('p31ca-glass-panel.png');
      }
    });
  });

  test.describe('phosphorus31.org', () => {
    test('homepage matches snapshot', async ({ page }) => {
      await page.goto('https://phosphorus31.org');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveScreenshot('phosphorus31-homepage.png', {
        fullPage: true,
        maxDiffPixels: 100,
      });
    });

    test('glass box renders correctly', async ({ page }) => {
      await page.goto('https://phosphorus31.org');
      const glassBox = page.locator('.glass-box, .glass-panel').first();
      if (await glassBox.count() > 0) {
        await expect(glassBox).toHaveScreenshot('phosphorus31-glass-box.png');
      }
    });

    test('bottom nav renders correctly', async ({ page }) => {
      await page.goto('https://phosphorus31.org');
      const bottomNav = page.locator('.bottom-nav');
      if (await bottomNav.count() > 0) {
        await expect(bottomNav).toHaveScreenshot('phosphorus31-bottom-nav.png');
      }
    });
  });

  test.describe('design tokens', () => {
    test('CSS custom properties are defined', async ({ page }) => {
      await page.goto('https://p31ca.org');
      const tokens = await page.evaluate(() => {
        const styles = getComputedStyle(document.documentElement);
        return {
          '--p31-bg': styles.getPropertyValue('--p31-bg').trim(),
          '--p31-accent': styles.getPropertyValue('--p31-accent').trim(),
          '--p31-glass-bg': styles.getPropertyValue('--p31-glass-bg').trim(),
          '--p31-glass-border': styles.getPropertyValue('--p31-glass-border').trim(),
        };
      });
      expect(tokens['--p31-bg']).toBeTruthy();
      expect(tokens['--p31-accent']).toBeTruthy();
      expect(tokens['--p31-glass-bg']).toBeTruthy();
    });

    test('data-spoons attribute is present', async ({ page }) => {
      await page.goto('https://p31ca.org');
      const spoons = await page.getAttribute('html', 'data-spoons');
      expect(spoons).toBeTruthy();
    });
  });
});
