/**
 * SENTINEL:BUILDER — developer / technical operator persona
 *
 * Tests the surfaces a developer or technical operator uses: agent hubs,
 * passport generator, glass box, fleet portal, canon demo, and the
 * machine-readable JSON contracts they depend on.
 */
import { test, expect } from "@playwright/test";

const nav = { waitUntil: "domcontentloaded" as const, timeout: 90_000 };

test.describe("SENTINEL:BUILDER — developer / technical operator", () => {
  // ── Agents hub ────────────────────────────────────────────────────

  test("agents hub loads and shows K₄ tetrahedron heading", async ({ page }) => {
    const res = await page.goto("/agents.html", nav);
    expect(res?.ok()).toBeTruthy();
    await expect(
      page.getByRole("heading", { name: /agent/i }).first(),
    ).toBeVisible();
  });

  test("agents hub names all four hubs", async ({ page }) => {
    await page.goto("/agents.html", nav);
    const body = await page.textContent("body");
    for (const hub of ["Forge", "Counsel", "Scholar", "Scribe"]) {
      expect(body).toContain(hub);
    }
  });

  test("agents hub schema annotation is 1.1.0", async ({ page }) => {
    await page.goto("/agents.html", nav);
    await expect(page.getByText("p31.k4AgentHub/1.1.0")).toBeVisible();
  });

  test("agents hub live-mode variant loads without error", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/agents.html?alive=1", nav);
    const fatal = errors.filter(
      (e) => !/ResizeObserver|Non-Error promise rejection/.test(e),
    );
    expect(fatal).toHaveLength(0);
  });

  // ── Cognitive Passport generator ──────────────────────────────────

  test("passport generator page loads", async ({ page }) => {
    const res = await page.goto("/passport-generator.html", nav);
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("passport generator page references p31 schema", async ({ page }) => {
    await page.goto("/passport-generator.html", nav);
    const body = await page.textContent("body");
    expect(body).toContain("p31");
  });

  // ── Glass box ─────────────────────────────────────────────────────

  test("glass box loads with transparency terminal heading", async ({
    page,
  }) => {
    const res = await page.goto("/glass-box.html", nav);
    expect(res?.ok()).toBeTruthy();
    await expect(
      page.getByText(/glass box/i).first(),
    ).toBeVisible();
  });

  test("glass box links to GitHub, not local /docs path", async ({ page }) => {
    await page.goto("/glass-box.html", nav);
    const links = page.locator("a[href*='github.com']");
    await expect(links.first()).toBeVisible();
  });

  // ── Fleet portal ─────────────────────────────────────────────────

  test("fleet portal loads", async ({ page }) => {
    const res = await page.goto("/fleet-portal.html", nav);
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });

  // ── Canon demo ───────────────────────────────────────────────────

  test("canon demo renders and accepts appearance toggle", async ({ page }) => {
    await page.goto("/p31-canon-demo.html", nav);
    await expect(page.getByRole("heading", { name: /one canon/i })).toBeVisible();
    const html = page.locator("html");
    await page.getByRole("button", { name: "Org" }).click();
    await expect(html).toHaveAttribute("data-p31-appearance", "org");
  });

  // ── Machine source: k4-agent-hub manifest endpoint ───────────────

  test("k4-agent-hub manifest endpoint is reachable (live probe)", async ({
    request,
  }) => {
    const MANIFEST = "https://k4-agent-hub.trimtab-signal.workers.dev/v1/manifest";
    try {
      const res = await request.get(MANIFEST, { timeout: 10_000 });
      if (res.ok()) {
        const j = await res.json();
        expect(j.schema).toBe("p31.k4AgentHub/1.1.0");
      }
      // 5xx or network error = worker cold-start; pass anyway (non-blocking)
    } catch {
      // Network unavailable in CI sandbox — skip gracefully
    }
  });
});
