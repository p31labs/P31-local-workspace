# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: crisis-recovery.e2e.ts >> Autonomic Circuit Breaker Validation >> Crisis mode triggers instantaneous functional isolation (gray rock)
- Location: tests/e2e/crisis-recovery.e2e.ts:12:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 2
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - paragraph [ref=e4]: System suspended.
    - paragraph [ref=e5]: GRAY_ROCK active. All surfaces isolated.
    - paragraph [ref=e6]: Return when calmer.
  - generic [ref=e9]:
    - button "Menu" [ref=e10]:
      - img [ref=e12]
      - generic: Menu
    - button "Inspect" [ref=e16]:
      - img [ref=e18]
      - generic: Inspect
    - button "Audit" [ref=e20]:
      - img [ref=e22]
      - generic: Audit
    - button "Settings" [ref=e25]:
      - img [ref=e27]
      - generic: Settings
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Autonomic Circuit Breaker Validation', () => {
  4  |   const targetUrl = 'http://localhost:4321';
  5  | 
  6  |   test.beforeEach(async ({ page }) => {
  7  |     await page.addInitScript(() => {
  8  |       try { localStorage.removeItem('p31:spoons'); } catch {}
  9  |     });
  10 |   });
  11 | 
  12 |   test('Crisis mode triggers instantaneous functional isolation (gray rock)', async ({ page }) => {
  13 |     await page.goto(targetUrl);
  14 |     await page.waitForLoadState('networkidle');
  15 | 
  16 |     // Enter crisis mode via keyboard
  17 |     await page.keyboard.press('0');
  18 |     await page.waitForTimeout(800);
  19 | 
  20 |     // In crisis mode: no input field, no chat bubbles
  21 |     const inputCount = await page.locator('input').count();
> 22 |     expect(inputCount).toBe(0);
     |                        ^ Error: expect(received).toBe(expected) // Object.is equality
  23 | 
  24 |     // Background wrapper should still be present
  25 |     const wrapper = page.locator('div.h-dvh, div.bg-black');
  26 |     await expect(wrapper.first()).toBeVisible();
  27 |   });
  28 | 
  29 |   test('Gray rock recovery via hud spoon increase', async ({ page }) => {
  30 |     await page.goto(targetUrl);
  31 |     await page.waitForLoadState('networkidle');
  32 | 
  33 |     // Enter crisis
  34 |     await page.keyboard.press('0');
  35 |     await page.waitForTimeout(600);
  36 | 
  37 |     // Open HUD
  38 |     await page.keyboard.press('h');
  39 |     await page.waitForTimeout(300);
  40 | 
  41 |     // Set spoon to 3
  42 |     await page.keyboard.press('Escape');
  43 | 
  44 |     // Re-open HUD and click a spoon level
  45 |     await page.keyboard.press('h');
  46 |     await page.waitForTimeout(300);
  47 |     const spoonBtn = page.locator('button:has-text("3")').first();
  48 |     if (await spoonBtn.count() > 0) {
  49 |       await spoonBtn.click();
  50 |       await page.waitForTimeout(400);
  51 |     }
  52 | 
  53 |     // Input should reappear
  54 |     const input = page.locator('input[aria-label="Chat input"]');
  55 |     await expect(input).toBeVisible({ timeout: 3000 });
  56 |   });
  57 | });
  58 | 
```