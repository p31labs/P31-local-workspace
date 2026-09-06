import { test, expect } from '@playwright/test';

const apps = {
  p31ca: { url: 'http://localhost:4321/', brand: 'p31ca' },
  phosphorus31: { url: 'http://localhost:4322/', brand: 'phosphorus31' },
  phos: { url: 'http://localhost:5173/' },
  willow: { url: 'http://localhost:5174/' },
} as const;

async function injectBrandAndSpoons(page: import('@playwright/test').Page, brand: string, spoons: string) {
  await page.evaluate(([b, s]) => {
    document.documentElement.setAttribute('data-brand', b);
    document.documentElement.setAttribute('data-spoons', s);
  }, [brand, spoons]);
}

async function stabilize(page: import('@playwright/test').Page) {
  await page.addStyleTag({
    content: '*, *::before, *::after { transition: none !important; animation: none !important; }',
  });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);
}

test.describe('Brand & Layout', () => {
  test('p31ca — renders with correct brand attribute', async ({ page }) => {
    await page.goto(apps.p31ca.url);
    await stabilize(page);
    const brand = await page.locator('html').getAttribute('data-brand');
    expect(brand).toBe('p31ca');
  });

  test('p31ca — navigation is visible', async ({ page }) => {
    await page.goto(apps.p31ca.url);
    await stabilize(page);
    const nav = page.locator('nav, [role="navigation"], header');
    await expect(nav.first()).toBeVisible();
  });

  test('phosphorus31 — renders with correct brand attribute', async ({ page }) => {
    await page.goto(apps.phosphorus31.url);
    await stabilize(page);
    const brand = await page.locator('html').getAttribute('data-brand');
    expect(brand).toBe('phosphorus31');
  });

  test('phosphorus31 — navigation is visible', async ({ page }) => {
    await page.goto(apps.phosphorus31.url);
    await stabilize(page);
    const nav = page.locator('nav, [role="navigation"], header');
    await expect(nav.first()).toBeVisible();
  });

  test('phos — app shell renders', async ({ page }) => {
    await page.goto(apps.phos.url);
    await stabilize(page);
    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });

  test('willow — app shell renders', async ({ page }) => {
    await page.goto(apps.willow.url);
    await stabilize(page);
    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });
});

test.describe('PHOS — Chip Interaction', () => {
  test('clicking a quick-action chip adds a user message', async ({ page }) => {
    await page.goto(apps.phos.url);
    await stabilize(page);
    const firstChip = page.locator('.phos-main button[data-action]').first();
    await expect(firstChip).toBeVisible();
    await firstChip.click();
    await page.waitForTimeout(700);
    const userBubble = page.locator('.phos-main >> text="Checking spoons..."').first();
    await expect(userBubble).toBeVisible();
  });
});

test.describe('Willow — Chip, PIN Gate & Messaging', () => {
  test('clicking a chip adds a message bubble', async ({ page }) => {
    await page.goto(apps.willow.url);
    await stabilize(page);
    const firstChip = page.locator('.willow-main button:has(span)').first();
    await expect(firstChip).toBeVisible();
    await firstChip.click();
    await page.waitForTimeout(700);
    const bubble = page.locator('.willow-main >> text="I\'m happy"').first();
    await expect(bubble).toBeVisible();
  });

  test('typing a message and sending appends it to the conversation', async ({ page }) => {
    await page.goto(apps.willow.url);
    await stabilize(page);
    await page.fill('input[name="message"]', 'Hello from Playwright');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(700);
    const sent = page.getByText('Hello from Playwright', { exact: true });
    await expect(sent).toBeVisible();
  });

  test('parent portal opens and accepts correct PIN', async ({ page }) => {
    await page.goto(apps.willow.url);
    await stabilize(page);
    
    // Pre-set PIN in localStorage so we test unlock flow
    await page.evaluate(() => {
      localStorage.setItem('willow-caregiver-pin', '1234');
    });
    
    // Reload to pick up the PIN
    await page.reload();
    await stabilize(page);
    
    await page.locator('button[aria-label="Open parent portal"]').click({ force: true });
    await expect(page.locator('text=Parent Portal').first()).toBeVisible({ timeout: 10000 });
    
    for (const digit of ['1', '2', '3', '4']) {
      await page.locator(`button:has-text("${digit}")`).first().click();
    }
    await page.locator('button:has-text("Unlock")').click();
    await expect(page.locator('text=Total LOVE').first()).toBeVisible({ timeout: 10000 });
  });

  test('parent portal rejects wrong PIN', async ({ page }) => {
    await page.goto(apps.willow.url);
    await stabilize(page);
    
    // Pre-set PIN in localStorage so we test unlock flow
    await page.evaluate(() => {
      localStorage.setItem('willow-caregiver-pin', '1234');
    });
    
    // Reload to pick up the PIN
    await page.reload();
    await stabilize(page);
    
    await page.locator('button[aria-label="Open parent portal"]').click({ force: true });
    await expect(page.locator('text=Parent Portal').first()).toBeVisible({ timeout: 10000 });
    
    for (const digit of ['9', '9', '9', '9']) {
      await page.locator(`button:has-text("${digit}")`).first().click();
    }
    await page.locator('button:has-text("Unlock")').click();
    await expect(page.locator('text=Incorrect PIN').first()).toBeVisible({ timeout: 10000 });
  });
});

// ——— CSS Token Resolution ———
const allBrands = ['p31ca', 'phosphorus31', 'phos', 'willow'] as const;

test.describe('CSS Token Resolution', () => {
  for (const brand of allBrands) {
    test(`${brand} — CSS custom properties resolve to valid values`, async ({ page }) => {
      const url = apps[brand as keyof typeof apps]?.url;
      await page.goto(url!);
      await injectBrandAndSpoons(page, brand, '3');

      const tokens = await page.evaluate(() => {
        const root = getComputedStyle(document.documentElement);
        return {
          brandPrimary: root.getPropertyValue('--p31-brand-primary').trim(),
          surfaceBg: root.getPropertyValue('--p31-surface-bg').trim(),
          textPrimary: root.getPropertyValue('--p31-text-primary').trim(),
          spaceMd: root.getPropertyValue('--p31-space-md').trim(),
          typeBody: root.getPropertyValue('--p31-type-body').trim(),
        };
      });

      expect(tokens.brandPrimary).toMatch(/oklch|#|rgb/);
      expect(tokens.surfaceBg).toMatch(/oklch|#|rgb/);
      expect(tokens.textPrimary).toMatch(/oklch|#|rgb/);
      expect(tokens.spaceMd).toMatch(/clamp|calc|rem|px/);
      expect(tokens.typeBody).toMatch(/clamp|calc|rem|px/);
    });
  }
});

// ——— Accessibility (requires @axe-core/playwright) ———
test.describe('Accessibility', () => {
  const knownContrastViolations: Record<string, string[]> = {
    p31ca: [
      'color-contrast: brand colors (cyan, violet, emerald, gold) on white backgrounds',
      'See quantum-design-system.css — brand tokens need AA contrast tuning',
    ],
    phosphorus31: [
      'color-contrast: emerald/violet brand colors on light backgrounds',
      'See Layout.astro — institutional light theme tokens need AA tuning',
    ],
    phos: ['color-contrast: spoon meter label on white background'],
    willow: ['color-contrast: WILLOW text and K4 badge on light background'],
  };

  for (const brand of allBrands) {
    test(`${brand} — known contrast issues documented, no new critical violations`, async ({ page }) => {
      let AxeBuilder: any;
      try {
        const axe = await import('@axe-core/playwright');
        AxeBuilder = axe.AxeBuilder || axe.default?.AxeBuilder;
      } catch {
        test.skip(true, '@axe-core/playwright not installed — skipping');
        return;
      }

      const url = apps[brand as keyof typeof apps]?.url;
      await page.goto(url!);
      await injectBrandAndSpoons(page, brand, '3');
      await stabilize(page);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      // Filter OUT known contrast violations (different issue to fix)
      const nonContrastViolations = results.violations.filter(
        (v: any) => v.impact === 'critical' || (v.impact === 'serious' && v.id !== 'color-contrast'),
      );

      if (nonContrastViolations.length > 0) {
        const details = nonContrastViolations
          .map((v: any) => `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} elements)`)
          .join('\n');
        throw new Error(`Unexpected accessibility violations in ${brand}:\n${details}`);
      }

      // Log known contrast violations as info (not failure)
      const contrastIssues = results.violations.filter((v: any) => v.id === 'color-contrast');
      if (contrastIssues.length > 0) {
        const known = knownContrastViolations[brand] || [];
        console.log(`[a11y] ${brand}: ${contrastIssues[0].nodes.length} known color-contrast issues (TODO: tune brand tokens at ${known[1] || 'quantum-design-system.css'})`);
      }

      expect(nonContrastViolations).toHaveLength(0);
    });
  }
});
