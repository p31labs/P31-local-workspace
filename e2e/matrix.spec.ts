import { test, expect, type Page } from '@playwright/test';
import { visualTest } from './visualTest';
import {
  assertHeaderRendered,
  assertCrownVisible,
  assertStarfieldExists,
  assertBrandAttribute,
  assertSpoonAttribute,
  assertCssTokenResolves,
} from './visual-assertions';

const spoonStates = ['0', '3', '5'] as const;
const brands = ['p31ca', 'phosphorus31', 'phos', 'willow'] as const;

const appUrls: Record<string, string> = {
  p31ca: 'http://localhost:4321/',
  phosphorus31: 'http://localhost:4322/',
  phos: 'http://localhost:5173/',
  willow: 'http://localhost:5174/',
};

const consoleErrors: string[] = [];

async function injectBrandAndSpoons(page: Page, brand: string, spoons: string) {
  await page.evaluate(([b, s]) => {
    document.documentElement.setAttribute('data-brand', b);
    document.documentElement.setAttribute('data-spoons', s);
  }, [brand, spoons]);
}

async function stabilizePage(page: Page) {
  await page.addStyleTag({
    content: '*, *::before, *::after { transition: none !important; animation: none !important; }',
  });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
}

function getAIVerifyPrompt(brand: string): string {
  const prompts: Record<string, string> = {
    p31ca:
      'Dark theme, Crown tetrahedron SVG in header, animated starfield canvas background, ' +
      '"Tools for how your brain works" hero heading, glass-pill header',
    phosphorus31:
      'Light institutional theme, Crown SVG in header, mission-oriented messaging, ' +
      'clean layout, institutional trust design',
    phos:
      'Minimal chat interface with "What do you need right now?" heading, ' +
      '5 pre-cognitive action chips above input bar, glass pill header',
    willow:
      'Child-friendly chat interface with Willow avatar, emotion chips, ' +
      '64px touch targets, glass pill header, warm color palette',
  };
  return prompts[brand] || 'Branded P31 application with Crown SVG in header';
}

test.describe('P31-Q Visual Matrix', () => {
  for (const brand of brands) {
    for (const spoons of spoonStates) {
      test(`brand=${brand} spoons=${spoons}`, async ({ page }) => {
        const url = appUrls[brand];
        await page.goto(url);
        await injectBrandAndSpoons(page, brand, spoons);
        await stabilizePage(page);

        // ——— Structural assertions ———
        await assertBrandAttribute(page, brand);
        await assertSpoonAttribute(page, spoons);
        await assertHeaderRendered(page);
        await assertCrownVisible(page);
        if (brand === 'p31ca') {
          await assertStarfieldExists(page);
        }

        // ——— CSS token resolution ———
        await assertCssTokenResolves(page, '--p31-brand-primary', /oklch|#|rgb/);

        // ——— Element-specific screenshots ———
        // Skip element snapshots when spoons=0 (crisis overlay covers everything — intentional behavior)
        if (spoons !== '0') {
          await visualTest(page, `${brand}-header`, {
            element: brand === 'phos' ? '.phos-header'
              : brand === 'willow' ? '.willow-header'
              : 'header',
            threshold: 0.01,
          });
          await visualTest(page, `${brand}-crown`, {
            element: 'header svg[viewBox*="200 168"]',
            threshold: 0.01,
          });
          if (brand === 'p31ca' || brand === 'phosphorus31') {
            await visualTest(page, `${brand}-hero`, {
              element: '.section-hero',
              threshold: 0.01,
            });
          }
        }

        // ——— Full-page with AI proactive verification ———
        const aiPrompt = getAIVerifyPrompt(brand);
        const result = await visualTest(page, `${brand}-spoons-${spoons}`, {
          fullPage: true,
          ai: { verify: aiPrompt },
        });

        if (!result.passed) {
          const diff = result.diffPercentage
            ? `${(result.diffPercentage * 100).toFixed(2)}%`
            : 'N/A';
          const ai = result.ai ? ` [${result.ai.classification}] ${result.ai.explanation}` : '';
          throw new Error(
            `Visual regression failed: ${brand}-spoons-${spoons} (diff: ${diff})${ai}`,
          );
        }
      });
    }
  }
});
