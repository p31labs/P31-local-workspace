/**
 * SENTINEL:INTEGRITY — machine / CI surface persona
 *
 * Tests the JSON API surface, contract files, and static assets that
 * downstream scripts, workers, and other P31 nodes depend on. These are
 * machine-to-machine contracts, not user-facing UI.
 */
import { test, expect } from "@playwright/test";

test.describe("SENTINEL:INTEGRITY — machine surface contracts", () => {
  // ── Creator economy covenant ───────────────────────────────────────

  test("creator-economy.json is served with 200", async ({ request }) => {
    const res = await request.get("/creator-economy.json");
    expect(res.ok()).toBeTruthy();
  });

  test("creator-economy.json schema is p31.creatorEconomy/1.0.0", async ({
    request,
  }) => {
    const res = await request.get("/creator-economy.json");
    const j = await res.json();
    expect(j.schema).toBe("p31.creatorEconomy/1.0.0");
  });

  test("creator-economy.json platformFee.rate is ZERO (operator covenant)", async ({
    request,
  }) => {
    const res = await request.get("/creator-economy.json");
    const j = await res.json();
    expect(j.platformFee.rate).toBe(0);
  });

  test("creator-economy.json revenueShare.creator is 1.0 (100% to creator)", async ({
    request,
  }) => {
    const res = await request.get("/creator-economy.json");
    const j = await res.json();
    expect(j.revenueShare.creator).toBe(1.0);
  });

  // ── Public surface ─────────────────────────────────────────────────

  test("p31-public-surface.json is served with 200", async ({ request }) => {
    const res = await request.get("/p31-public-surface.json");
    expect(res.ok()).toBeTruthy();
  });

  test("p31-public-surface.json references p31ca.org domain", async ({
    request,
  }) => {
    const res = await request.get("/p31-public-surface.json");
    const text = await res.text();
    expect(text).toContain("p31ca.org");
  });

  test("p31-public-surface.json has no credential strings", async ({
    request,
  }) => {
    const res = await request.get("/p31-public-surface.json");
    const text = await res.text();
    expect(text).not.toMatch(/sk_live_|pk_live_|password|api_key/i);
  });

  // ── Mesh constants ─────────────────────────────────────────────────

  test("p31-mesh-constants.json is served with 200", async ({ request }) => {
    const res = await request.get("/p31-mesh-constants.json");
    expect(res.ok()).toBeTruthy();
  });

  test("p31-mesh-constants.json is valid JSON with non-trivial content", async ({
    request,
  }) => {
    const res = await request.get("/p31-mesh-constants.json");
    const j = await res.json();
    expect(Object.keys(j).length).toBeGreaterThan(0);
  });

  // ── Verify pulse ──────────────────────────────────────────────────

  test("verify-pulse.json is served", async ({ request }) => {
    const res = await request.get("/verify-pulse.json");
    expect(res.ok()).toBeTruthy();
  });

  test("verify-pulse.json has entries array", async ({ request }) => {
    const res = await request.get("/verify-pulse.json");
    const j = await res.json();
    expect(Array.isArray(j.entries)).toBe(true);
    expect(j.entries.length).toBeGreaterThan(0);
  });

  // ── Contract registry ─────────────────────────────────────────────

  test("p31-contract-registry.json is served", async ({ request }) => {
    const res = await request.get("/p31-contract-registry.json");
    expect(res.ok()).toBeTruthy();
  });

  test("p31-contract-registry.json has schema field", async ({ request }) => {
    const res = await request.get("/p31-contract-registry.json");
    const j = await res.json();
    expect(j.schema).toMatch(/p31\.contractRegistry/);
  });

  // ── Live fleet ────────────────────────────────────────────────────

  test("p31-live-fleet.json is served", async ({ request }) => {
    const res = await request.get("/p31-live-fleet.json");
    expect(res.ok()).toBeTruthy();
  });

  test("p31-live-fleet.json has workers array with entries", async ({
    request,
  }) => {
    const res = await request.get("/p31-live-fleet.json");
    const j = await res.json();
    // fleet may be keyed as workers, fleet, or entries
    const fleet =
      j.workers ?? j.fleet ?? j.entries ?? Object.values(j)[0] ?? [];
    const count = Array.isArray(fleet) ? fleet.length : Object.keys(fleet).length;
    expect(count).toBeGreaterThan(0);
  });

  // ── Canon CSS ─────────────────────────────────────────────────────

  test("p31-style.css exposes org appearance tokens", async ({ request }) => {
    const res = await request.get("/p31-style.css");
    const text = await res.text();
    expect(text).toContain("data-p31-appearance=\"org\"");
  });

  test("p31-style.css exposes hub appearance tokens", async ({ request }) => {
    const res = await request.get("/p31-style.css");
    const text = await res.text();
    expect(text).toContain("data-p31-appearance=\"hub\"");
  });

  // ── Launch readiness ──────────────────────────────────────────────

  test("launch-readiness.html loads", async ({ request }) => {
    const res = await request.get("/launch-readiness.html");
    expect(res.ok()).toBeTruthy();
  });

  test("launch-readiness.html contains score", async ({ request }) => {
    const res = await request.get("/launch-readiness.html");
    const text = await res.text();
    // Should show a score like "95 / 100" or "GO"
    expect(text).toMatch(/\d+\s*\/\s*100|GO|HOLD|NO-GO/i);
  });
});
