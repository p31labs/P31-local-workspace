import { test, expect } from "@playwright/test";

/** `load` can hang on Three/WebGL; `domcontentloaded` is enough for smoke. */
const nav = { waitUntil: "domcontentloaded" as const, timeout: 90_000 };

test.describe("p31ca hub (built dist)", () => {
  test("home responds", async ({ page }) => {
    const res = await page.goto("/", nav);
    expect(res?.ok()).toBeTruthy();
  });

  test("canon demo loads and toggles org appearance", async ({ page }) => {
    await page.goto("/p31-canon-demo", nav);
    await expect(page.getByRole("heading", { name: /One canon/i })).toBeVisible();
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-p31-appearance", /hub|org|auto/);
    await page.getByRole("button", { name: "Org" }).click();
    await expect(html).toHaveAttribute("data-p31-appearance", "org");
    await page.getByRole("button", { name: "Hub" }).click();
    await expect(html).toHaveAttribute("data-p31-appearance", "hub");
  });

  test("canon demo live tokens visible", async ({ page }) => {
    await page.goto("/p31-canon-demo", nav);
    await expect(page.getByText(/live tokens/i)).toBeVisible();
  });

  test("generated style sheet exposes core variables", async ({ request }) => {
    const res = await request.get("/p31-style.css");
    expect(res.ok()).toBeTruthy();
    const text = await res.text();
    expect(text).toContain("--p31-void:");
    expect(text).toContain("data-p31-appearance=\"org\"");
  });

  test("super-centaur starter renders", async ({ page }) => {
    await page.goto("/p31-super-centaur-starter.html", nav);
    await expect(page.getByRole("heading", { level: 1, name: /^Super-Centaur$/ })).toBeVisible();
  });

  test("machine pack JSON is valid", async ({ request }) => {
    const res = await request.get("/p31-super-centaur-pack.json");
    expect(res.ok()).toBeTruthy();
    const j = await res.json();
    expect(j.schema).toBe("p31.superCentaurStarterPack/1.0.0");
    expect(j.meshFleet?.MESH?.cage).toContain("k4-cage");
  });

  test("initial build page loads (CWP + bake entry)", async ({ page }) => {
    await page.goto("/initial-build.html", nav);
    await expect(page.getByRole("heading", { name: /Initial Build/i })).toBeVisible();
    await expect(page.getByText("CWP-P31-IB-2026-01", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Wye → Delta onboard/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Create guest id here/i })).toBeVisible();
  });

  test("initial build bake script is servable", async ({ request }) => {
    const res = await request.get("/lib/p31-initial-build-bake.js");
    expect(res.ok()).toBeTruthy();
    const t = await res.text();
    expect(t).toContain("p31.buildRecord/0.1.0");
  });

   test("messaging hub page and schema anchor", async ({ page }) => {
     await page.goto("/messaging-hub", nav);
     await expect(page.getByRole("heading", { level: 1, name: /Messaging hub/i })).toBeVisible();
     await expect(page.getByText(/p31\.messagingHub\/0\.1\.0/)).toBeVisible();
   });
});
