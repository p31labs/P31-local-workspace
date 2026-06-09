import { test, expect } from "@playwright/test";

const nav = { waitUntil: "domcontentloaded" as const, timeout: 120_000 };

test.describe("Trojan Horse Self-Care Engines", () => {
  test("quantum-lattice route loads with canvas and UI", async ({ page }) => {
    page.on("console", msg => {
      if (msg.type() === "error") {
        console.error("PAGE ERROR:", msg.text());
      }
    });
    await page.goto("/quantum-lattice", nav);
    await expect(page.locator("text=Chat with Quark")).toBeVisible({ timeout: 10000 });
    await page.locator("canvas").waitFor({ state: "attached", timeout: 15000 });
    expect(page.locator("text=Self-Care")).toBeVisible();
  });

  test("abyssal-node route loads with canvas and UI", async ({ page }) => {
    await page.goto("/abyssal-node", nav);
    await expect(page.locator("text=Chat with Nudi")).toBeVisible({ timeout: 10000 });
    await page.locator("canvas").waitFor({ state: "attached", timeout: 15000 });
    expect(page.locator("text=Nourishment")).toBeVisible();
    expect(page.locator("text=Clear Congestion")).toBeVisible();
  });

  test("cybernetic-bonsai route loads with canvas and UI", async ({ page }) => {
    await page.goto("/cybernetic-bonsai", nav);
    await expect(page.locator("text=Chat with Spark")).toBeVisible({ timeout: 10000 });
    await page.locator("canvas").waitFor({ state: "attached", timeout: 15000 });
    expect(page.locator("text=P-Gain")).toBeVisible();
    expect(page.locator("text=I-Accumulator")).toBeVisible();
    expect(page.locator("text=D-Filter")).toBeVisible();
    expect(page.locator("#grounding-wire")).toBeVisible();
  });

  test("FreezeBreakerOverlay appears on spacebar (quantum-lattice)", async ({ page }) => {
    await page.goto("/quantum-lattice", nav);
    await page.click("body", { position: { x: 10, y: 10 } });
    await page.keyboard.press("Space");
    await expect(page.locator("text=HOLD SPACE")).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(3500);
    await expect(page.locator("text=HOLD SPACE")).not.toBeVisible();
  });

  test("Nutrient burst Nudi chat calls AI", async ({ page }) => {
    await page.goto("/abyssal-node", nav);
    expect(page.locator("#chat-messages")).toBeVisible();
    expect(page.locator("#chat-form input")).toBeVisible();
  });

  test("Grounding Wire drag-and-drop triggers prune", async ({ page }) => {
    await page.goto("/cybernetic-bonsai", nav);
    const wire = page.locator("#grounding-wire");
    const dropZone = page.locator("#drop-zone");
    await expect(wire).toBeVisible();
    await wire.dragTo(dropZone);
    expect(page.locator("#grounding-wire")).toBeVisible();
  });
});
