import { test, expect } from "@playwright/test";

const nav = { waitUntil: "domcontentloaded" as const, timeout: 90_000 };

test.describe("P31 Delta hiring (static SPA under /delta-hiring/)", () => {
  test("shell loads with hub canon CSS and primary chrome", async ({ page }) => {
    const res = await page.goto("/delta-hiring/index.html", nav);
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { name: /P31 Delta · Hiring/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Browse open roles" })).toBeVisible();
  });

  test("roles route renders from hash", async ({ page }) => {
    await page.goto("/delta-hiring/index.html#/roles", nav);
    await expect(page.getByRole("search", { name: /Filter open roles/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /React Frontend Developer/i })).toBeVisible();
  });

  test("universal p31-style.css is referenced and loads", async ({ page }) => {
    await page.goto("/delta-hiring/index.html", nav);
    const link = page.locator('link[href="/p31-style.css"]');
    await expect(link).toHaveCount(1);
    const res = await page.request.get("/p31-style.css");
    expect(res.ok()).toBeTruthy();
  });
});
