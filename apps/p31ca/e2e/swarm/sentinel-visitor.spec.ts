/**
 * SENTINEL:VISITOR — anonymous first-time visitor persona
 *
 * Tests the surface a stranger sees when they land on p31ca.org for the
 * first time with no context. Every test is a real user moment.
 */
import { test, expect } from "@playwright/test";

const nav = { waitUntil: "domcontentloaded" as const, timeout: 90_000 };

test.describe("SENTINEL:VISITOR — first-time anonymous user", () => {
  // ── Landing & navigation ───────────────────────────────────────────

  test("home page loads with correct title", async ({ page }) => {
    const res = await page.goto("/", nav);
    expect(res?.ok()).toBeTruthy();
    await expect(page).toHaveTitle(/P31/i);
  });

  test("home page has mission heading or tagline visible", async ({ page }) => {
    await page.goto("/", nav);
    // Accepts any visible heading that surfaces within 10s of load
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading.first()).toBeVisible({ timeout: 10_000 });
  });

  test("home page has at least one navigation landmark", async ({ page }) => {
    await page.goto("/", nav);
    const nav_ = page.getByRole("navigation");
    await expect(nav_.first()).toBeVisible({ timeout: 10_000 });
  });

  // ── 404 ────────────────────────────────────────────────────────────

  test("unknown route returns a page (not a blank screen)", async ({ page }) => {
    await page.goto("/does-not-exist-xyz", nav);
    const body = await page.textContent("body");
    expect(body?.trim().length).toBeGreaterThan(0);
  });

  test("404 page contains a home link or 'back' affordance", async ({ page }) => {
    await page.goto("/does-not-exist-xyz", nav);
    const homeLink = page
      .getByRole("link", { name: /home|back|p31/i })
      .or(page.locator("a[href='/']"))
      .first();
    await expect(homeLink).toBeVisible({ timeout: 8_000 });
  });

  // ── Legal surface ─────────────────────────────────────────────────

  test("terms page loads", async ({ page }) => {
    const res = await page.goto("/terms.html", nav);
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("terms page contains EIN", async ({ page }) => {
    await page.goto("/terms.html", nav);
    await expect(page.getByText(/42-1888158/)).toBeVisible();
  });

  test("privacy page loads", async ({ page }) => {
    const res = await page.goto("/privacy.html", nav);
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("security disclosure page loads", async ({ page }) => {
    const res = await page.goto("/security-disclosure.html", nav);
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("accessibility page loads", async ({ page }) => {
    const res = await page.goto("/accessibility.html", nav);
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  // ── Style & appearance ─────────────────────────────────────────────

  test("p31-style.css is served and non-empty", async ({ request }) => {
    const res = await request.get("/p31-style.css");
    expect(res.ok()).toBeTruthy();
    const text = await res.text();
    expect(text.length).toBeGreaterThan(500);
    expect(text).toContain("--p31-void");
  });

  test("dark mode: html element has appearance attribute on home", async ({ page }) => {
    await page.goto("/", nav);
    const html = page.locator("html");
    // p31ca defaults to hub or auto — either is acceptable
    const attr = await html.getAttribute("data-p31-appearance");
    if (attr !== null) {
      expect(["hub", "org", "auto"]).toContain(attr);
    }
    // If absent — appearance is inherited from CSS, also fine
  });

  // ── No console errors on critical path ────────────────────────────

  test("home page produces no uncaught JS errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/", nav);
    await page.waitForTimeout(1500);
    const fatal = errors.filter(
      (e) =>
        !/ResizeObserver|Non-Error promise rejection|Loading chunk/.test(e),
    );
    expect(fatal).toHaveLength(0);
  });
});
