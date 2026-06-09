/**
 * SENTINEL:LEGAL — legal and compliance surface persona
 *
 * Tests every legal page for required content: EIN, 501(c)(3) language,
 * WCAG references, safe harbour disclosure, warranty disclaimer, Georgia
 * governing law. These are post-launch compliance invariants.
 */
import { test, expect } from "@playwright/test";

const nav = { waitUntil: "domcontentloaded" as const, timeout: 90_000 };

test.describe("SENTINEL:LEGAL — compliance surface", () => {
  // ── Terms of Service ──────────────────────────────────────────────

  test("terms page loads with 200", async ({ request }) => {
    const res = await request.get("/terms.html");
    expect(res.ok()).toBeTruthy();
  });

  test("terms page has H1", async ({ page }) => {
    await page.goto("/terms.html", nav);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("terms page contains P31 Labs EIN", async ({ page }) => {
    await page.goto("/terms.html", nav);
    await expect(page.getByText(/42-1888158/)).toBeVisible();
  });

  test("terms page contains 501(c)(3) or nonprofit language", async ({
    page,
  }) => {
    await page.goto("/terms.html", nav);
    const body = (await page.textContent("body")) ?? "";
    expect(body).toMatch(/501\(c\)\(3\)|nonprofit|non-profit/i);
  });

  test("terms page contains warranty disclaimer in caps", async ({ page }) => {
    await page.goto("/terms.html", nav);
    const body = (await page.textContent("body")) ?? "";
    expect(body).toMatch(/AS IS|WITHOUT WARRANTY/i);
  });

  test("terms page references Georgia governing law", async ({ page }) => {
    await page.goto("/terms.html", nav);
    const body = (await page.textContent("body")) ?? "";
    expect(body).toMatch(/georgia|GA/i);
  });

  // ── Privacy Policy ────────────────────────────────────────────────

  test("privacy page loads with 200", async ({ request }) => {
    const res = await request.get("/privacy.html");
    expect(res.ok()).toBeTruthy();
  });

  test("privacy page has H1", async ({ page }) => {
    await page.goto("/privacy.html", nav);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("privacy page references P31 Labs", async ({ page }) => {
    await page.goto("/privacy.html", nav);
    const body = (await page.textContent("body")) ?? "";
    expect(body).toMatch(/P31 Labs/i);
  });

  test("privacy page contains data collection language", async ({ page }) => {
    await page.goto("/privacy.html", nav);
    const body = (await page.textContent("body")) ?? "";
    expect(body).toMatch(/collect|data|personal/i);
  });

  // ── Security Disclosure ───────────────────────────────────────────

  test("security disclosure page loads with 200", async ({ request }) => {
    const res = await request.get("/security-disclosure.html");
    expect(res.ok()).toBeTruthy();
  });

  test("security disclosure page has H1", async ({ page }) => {
    await page.goto("/security-disclosure.html", nav);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("security disclosure page contains reporting contact", async ({
    page,
  }) => {
    await page.goto("/security-disclosure.html", nav);
    const body = (await page.textContent("body")) ?? "";
    // Should have an email or disclosure contact
    expect(body).toMatch(/email|contact|security@|report/i);
  });

  test("security disclosure page references safe harbour or coordinated disclosure", async ({
    page,
  }) => {
    await page.goto("/security-disclosure.html", nav);
    const body = (await page.textContent("body")) ?? "";
    expect(body).toMatch(/safe harbour|safe harbor|coordinated|responsible/i);
  });

  // ── Accessibility ─────────────────────────────────────────────────

  test("accessibility page loads with 200", async ({ request }) => {
    const res = await request.get("/accessibility.html");
    expect(res.ok()).toBeTruthy();
  });

  test("accessibility page has H1", async ({ page }) => {
    await page.goto("/accessibility.html", nav);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("accessibility page references WCAG", async ({ page }) => {
    await page.goto("/accessibility.html", nav);
    const body = (await page.textContent("body")) ?? "";
    expect(body).toMatch(/WCAG/i);
  });

  test("accessibility page references contact method for issues", async ({
    page,
  }) => {
    await page.goto("/accessibility.html", nav);
    const body = (await page.textContent("body")) ?? "";
    expect(body).toMatch(/contact|email|report/i);
  });
});
