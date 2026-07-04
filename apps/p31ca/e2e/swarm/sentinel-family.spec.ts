/**
 * SENTINEL:FAMILY — family mesh user persona
 *
 * Tests the surfaces a family member encounters: fleet portal, agents hub
 * family-dock section, the public cognitive passport, and the K₄ family
 * vertex acknowledgements. No private family data should appear here —
 * this sentinel also acts as a privacy guard.
 */
import { test, expect } from "@playwright/test";

const nav = { waitUntil: "domcontentloaded" as const, timeout: 90_000 };

test.describe("SENTINEL:FAMILY — family mesh user", () => {
  // ── Fleet portal ──────────────────────────────────────────────────

  test("fleet portal loads", async ({ page }) => {
    const res = await page.goto("/fleet-portal.html", nav);
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });

  test("fleet portal references p31 or mesh", async ({ page }) => {
    await page.goto("/fleet-portal.html", nav);
    const body = await page.textContent("body");
    expect(body?.toLowerCase()).toMatch(/p31|mesh|fleet/);
  });

  // ── Fleet agents (family variant) ─────────────────────────────────

  test("fleet-agents page loads if present", async ({ page, request }) => {
    const probe = await request.get("/fleet-agents.html");
    if (!probe.ok()) return; // page may not exist in all build variants
    const res = await page.goto("/fleet-agents.html", nav);
    expect(res?.ok()).toBeTruthy();
  });

  // ── Agent hub family-dock ──────────────────────────────────────────

  test("agents hub page surfaces family-cage-wire or family vertex text", async ({
    page,
  }) => {
    await page.goto("/agents.html", nav);
    const body = await page.textContent("body");
    // The family dock section uses family-cage-wire vocabulary
    expect(body).toMatch(/family|cage|will|sj|wj/i);
  });

  // ── Cognitive Passport — public tool ──────────────────────────────

  test("passport generator is reachable from /passport-generator.html", async ({
    page,
  }) => {
    const res = await page.goto("/passport-generator.html", nav);
    expect(res?.ok()).toBeTruthy();
  });

  // ── Privacy guards ─────────────────────────────────────────────────
  // These are correctness sentinels: family data must NOT appear in public UI

  test("home page does not expose full child names", async ({ page }) => {
    await page.goto("/", nav);
    const body = (await page.textContent("body")) ?? "";
    // Children are S.J. and W.J. — full first names must not appear
    expect(body).not.toMatch(/\bstephen\b/i);
    expect(body).not.toMatch(/\bwilliam jr\b/i);
  });

  test("fleet portal does not expose private case information", async ({
    page,
  }) => {
    await page.goto("/fleet-portal.html", nav);
    const body = (await page.textContent("body")) ?? "";
    expect(body).not.toMatch(/2025CV936/);
    expect(body).not.toMatch(/johnson v\. johnson/i);
  });

  test("agents hub does not expose private API keys in DOM", async ({
    page,
  }) => {
    await page.goto("/agents.html", nav);
    const body = (await page.textContent("body")) ?? "";
    expect(body).not.toMatch(/sk_live_|pk_live_|api_key\s*=/i);
  });

  // ── K₄ topology acknowledgement ───────────────────────────────────

  test("agents hub references all 4 family vertices", async ({ page }) => {
    await page.goto("/agents.html", nav);
    const body = (await page.textContent("body")) ?? "";
    for (const vertex of ["will", "sj", "wj", "christyn"]) {
      expect(body.toLowerCase()).toContain(vertex);
    }
  });
});
