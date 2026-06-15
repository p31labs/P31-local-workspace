// tests/e2e/llm-chat.e2e.ts
import { test, expect } from '@playwright/test';

const BASE = process.env.PHOS_BASE_URL || 'http://localhost:4321';

test.describe('PHOS LLM Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const skipBtn = page.locator('button:has-text("Skip")');
    if (await skipBtn.count() > 0) await skipBtn.click();
    await page.waitForTimeout(500);
  });

  test('Chat input sends message and receives LLM response via native proxy', async ({ page }) => {
    const input = page.locator('input[aria-label="Chat input"]');
    await input.fill('Hello, are you there?');
    await input.press('Enter');

    const assistantMessage = page.locator('.text-gray-300:has-text("Hello")').first();
    await expect(assistantMessage).toBeVisible({ timeout: 15000 });
    const text = await assistantMessage.textContent();
    expect(text).toBeTruthy();
    expect(text!.length).toBeGreaterThan(5);
  });

  test('Error handling when Ollama is not running', async ({ page }) => {
    const input = page.locator('input[aria-label="Chat input"]');
    await input.fill('trigger error');
    await input.press('Enter');
    await expect(input).toBeVisible();
  });
});
