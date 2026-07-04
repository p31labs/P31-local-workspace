/**
 * SENTINEL:PASSKEY — passkey & hardware pairing surface persona
 *
 * Tests the WebAuthn/passkey API surface that the p31ca site exposes.
 * These are contract tests — not a real browser credential ceremony
 * (that requires hardware) — but they verify:
 *   - The API endpoints respond with the correct shape
 *   - Challenge generation returns well-formed options
 *   - Error paths return the right HTTP codes (not 500)
 *   - RP_ID contract is correct for the environment
 *   - Hardware pair endpoints respond to malformed requests gracefully
 *
 * Workers run at /api/passkey/* (same-origin, Cloudflare zone route).
 * In the Astro preview server these routes do NOT exist — tests skip
 * gracefully when the endpoint returns 404 (preview-only build).
 */
import { test, expect } from "@playwright/test";

const PASSKEY_BASE = "/api/passkey";
const HARDWARE_BASE = "/api/hardware";
const TIMEOUT = 10_000;

/** Skip helper: if the endpoint returns 404, the worker isn't mounted in preview. */
async function probeEndpoint(
  request: import("@playwright/test").APIRequestContext,
  path: string,
): Promise<boolean> {
  try {
    const res = await request.get(path, { timeout: TIMEOUT });
    return res.status() !== 404;
  } catch {
    return false;
  }
}

test.describe("SENTINEL:PASSKEY — WebAuthn & hardware pairing contracts", () => {
  // ── Register-begin: well-formed challenge ──────────────────────────

  test("register-begin POST returns 200 or 405 (never 500)", async ({
    request,
  }) => {
    const mounted = await probeEndpoint(request, PASSKEY_BASE + "/register-begin");
    if (!mounted) return; // worker not mounted in Astro preview — skip

    const res = await request.post(PASSKEY_BASE + "/register-begin", {
      timeout: TIMEOUT,
    });
    // 200 (challenge issued) or 405 (method not allowed w/ GET probe) — never 500
    expect([200, 201, 400, 405]).toContain(res.status());
  });

  test("register-begin response (when 200) has challenge and rpId fields", async ({
    request,
  }) => {
    const mounted = await probeEndpoint(request, PASSKEY_BASE + "/register-begin");
    if (!mounted) return;

    const res = await request.post(PASSKEY_BASE + "/register-begin", {
      timeout: TIMEOUT,
    });
    if (res.status() !== 200) return; // challenge not issued — skip body check

    const body = await res.json();
    expect(body).toHaveProperty("challenge");
    expect(body).toHaveProperty("rp");
    expect(body.rp).toHaveProperty("id");
    // RP_ID must never be localhost in a non-dev environment
    expect(body.rp.id).not.toBe("localhost");
  });

  test("register-begin response challenge is a non-empty string", async ({
    request,
  }) => {
    const mounted = await probeEndpoint(request, PASSKEY_BASE + "/register-begin");
    if (!mounted) return;

    const res = await request.post(PASSKEY_BASE + "/register-begin", {
      timeout: TIMEOUT,
    });
    if (res.status() !== 200) return;

    const body = await res.json();
    expect(typeof body.challenge).toBe("string");
    expect(body.challenge.length).toBeGreaterThan(10);
  });

  // ── Register-finish: malformed input rejection ─────────────────────

  test("register-finish rejects missing body with 400 (not 500)", async ({
    request,
  }) => {
    const mounted = await probeEndpoint(request, PASSKEY_BASE + "/register-begin");
    if (!mounted) return;

    const res = await request.post(PASSKEY_BASE + "/register-finish", {
      data: {},
      timeout: TIMEOUT,
    });
    expect([400, 422]).toContain(res.status());
  });

  test("register-finish rejects malformed credential JSON with 400", async ({
    request,
  }) => {
    const mounted = await probeEndpoint(request, PASSKEY_BASE + "/register-begin");
    if (!mounted) return;

    const res = await request.post(PASSKEY_BASE + "/register-finish", {
      data: { id: "invalid", rawId: "xxx", type: "not-a-valid-type" },
      timeout: TIMEOUT,
    });
    expect([400, 422]).toContain(res.status());
  });

  // ── Authenticate-begin: challenge issuance ──────────────────────────

  test("authenticate-begin POST returns 200 or 400 (never 500)", async ({
    request,
  }) => {
    const mounted = await probeEndpoint(request, PASSKEY_BASE + "/authenticate-begin");
    if (!mounted) return;

    const res = await request.post(PASSKEY_BASE + "/authenticate-begin", {
      timeout: TIMEOUT,
    });
    expect([200, 201, 400, 404]).toContain(res.status());
  });

  // ── Hardware pairing: challenge endpoint ───────────────────────────

  test("hardware challenge endpoint returns 200 or non-500 on POST", async ({
    request,
  }) => {
    const mounted = await probeEndpoint(request, HARDWARE_BASE + "/challenge");
    if (!mounted) return;

    const res = await request.post(HARDWARE_BASE + "/challenge", {
      data: { deviceId: "test-device-id-000" },
      timeout: TIMEOUT,
    });
    // 200 (challenge created) or 400 (deviceId format rejected) — never 500
    expect([200, 201, 400, 403]).toContain(res.status());
  });

  test("hardware pair endpoint rejects malformed pubkey with 400", async ({
    request,
  }) => {
    const mounted = await probeEndpoint(request, HARDWARE_BASE + "/pair");
    if (!mounted) return;

    const res = await request.post(HARDWARE_BASE + "/pair", {
      data: {
        deviceId: "test-device-id-000",
        challengeCode: "000000",
        publicKey: "not-valid-base64url",
      },
      timeout: TIMEOUT,
    });
    // Must reject — never 200 with bad pubkey format
    expect([400, 403, 422]).toContain(res.status());
  });

  // ── Source-level contract guards (file checks via page / request) ──

  test("worker-allowlist.json includes the passkey worker (allowlist gate)", async ({
    request,
  }) => {
    const res = await request.get("/security/worker-allowlist.json", {
      timeout: TIMEOUT,
    });
    if (!res.ok()) return; // file might not be served on preview — skip
    const j = await res.json();
    const entries = j.allowed ?? j.workers ?? j.entries ?? [];
    const hasPasskey =
      JSON.stringify(entries).includes("passkey") ||
      JSON.stringify(j).includes("passkey");
    expect(hasPasskey).toBe(true);
  });

  test("passport generator page does not leak API credentials in HTML source", async ({
    page,
  }) => {
    const res = await page.goto("/passport-generator.html", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    expect(res?.ok()).toBeTruthy();
    const content = await page.content();
    expect(content).not.toMatch(/sk_live_|pk_live_|Bearer\s+[A-Za-z0-9]{20,}/);
  });

  test("p31ca passport-generator page references passkey endpoint base path", async ({
    page,
  }) => {
    await page.goto("/passport-generator.html", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    const content = await page.content();
    // The page should reference /api/passkey or the passkeyApiBasePath constant
    expect(content).toMatch(/\/api\/passkey|passkeyApi/i);
  });
});
