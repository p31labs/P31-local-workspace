import { test, expect } from "@playwright/test";

/**
 * Optional: PLAYWRIGHT_BASE_URL=https://p31ca.org PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:e2e
 * (run after deploy or against production manually)
 */
const prod = process.env.PLAYWRIGHT_BASE_URL?.includes("p31ca.org");

const nav = { waitUntil: "domcontentloaded" as const, timeout: 90_000 };

test.describe("production smoke (optional)", () => {
  test.skip(!prod, "set PLAYWRIGHT_BASE_URL to p31ca.org to enable");

  test("canon demo live", async ({ page }) => {
    await page.goto("/p31-canon-demo.html", nav);
    await expect(page.getByRole("heading", { name: /One canon/i })).toBeVisible({ timeout: 20_000 });
  });

  test("Initial Build short URL /build → shell (CWP-P31-IB-2026-01)", async ({ page }) => {
    await page.goto("/build", nav);
    await expect(page.getByRole("heading", { name: /Initial Build/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("CWP-P31-IB-2026-01", { exact: true }).first()).toBeVisible();
  });

  test("initial-build bake script served from edge", async ({ request }) => {
    const res = await request.get("/lib/p31-initial-build-bake.js");
    expect(res.ok()).toBeTruthy();
    const t = await res.text();
    expect(t).toContain("p31.buildRecord/0.1.0");
  });

  test("Delta hiring short /hiring resolves and SPA shell renders", async ({ page }) => {
    const res = await page.goto("/hiring", nav);
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { name: /P31 Delta · Hiring/i })).toBeVisible({
      timeout: 25_000,
    });
  });

  test("messaging hub short /messages resolves", async ({ page }) => {
    const res = await page.goto("/messages", nav);
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { level: 1, name: /Messaging hub/i })).toBeVisible({
      timeout: 20_000,
    });
  });
});
