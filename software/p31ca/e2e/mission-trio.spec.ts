import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test, expect } from "@playwright/test";

/** connect.html is static-first; hub mission rail is asserted in verify-p31ca-dist (dist/index.html). */
const nav = { waitUntil: "domcontentloaded" as const, timeout: 90_000 };

const trioPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src/data/p31-mission-trio.json",
);
const missionTrio = JSON.parse(readFileSync(trioPath, "utf8")) as {
  pills: { build: { title: string }; create: { title: string }; connect: { title: string } };
  ebc: { build: string; create: string; connectLead: string; connect: string };
};

test("mission trio — connect EBC and canon CSS", async ({ page, request }) => {
  const css = await request.get("/p31-style.css");
  expect(css.ok()).toBeTruthy();
  const sheet = await css.text();
  expect(sheet).toContain(".p31-mission-trio--ebc");
  expect(sheet).toContain(".p31-mission-trio--hub");
  expect(sheet).toContain(".p31-mission-trio__link--build");
  expect(sheet).toContain("prefers-reduced-motion");

  await page.goto("/connect.html", nav);
  const footer = page.locator("#ebc");
  await expect(footer).toBeVisible({ timeout: 30_000 });
  await expect(footer.locator("#ebc-build")).toHaveAttribute("href", "/build");
  await expect(footer.locator("#ebc-build")).toHaveAttribute("title", missionTrio.pills.build.title);
  await expect(footer.locator("#ebc-create")).toHaveAttribute("href", "/geodesic.html");
  await expect(footer.locator("#ebc-create")).toHaveAttribute("title", missionTrio.pills.create.title);
  await expect(footer.locator("#ebc-connect")).toHaveAttribute("aria-current", "page");
  await expect(footer.locator("#ebc-connect")).toHaveAttribute("title", missionTrio.pills.connect.title);
  await expect(footer.getByText(missionTrio.ebc.build, { exact: true })).toBeVisible();
  await expect(footer.getByText(missionTrio.ebc.create, { exact: true })).toBeVisible();
  await expect(footer.locator("#ebc-connect .p31-mission-trio__now")).toHaveText(missionTrio.ebc.connectLead);
  await expect(footer.locator("#ebc-connect")).toContainText(missionTrio.ebc.connect.trim());
});

test("mission trio — delta EBC (all links, no current column)", async ({ page }) => {
  await page.goto("/delta.html", nav);
  const footer = page.locator("#ebc");
  await expect(footer).toBeVisible({ timeout: 30_000 });
  await expect(footer.locator("#ebc-build")).toHaveAttribute("href", "/build");
  await expect(footer.locator("#ebc-create")).toHaveAttribute("href", "/geodesic.html");
  await expect(footer.locator("#ebc-connect")).toHaveAttribute("href", "/mesh");
  await expect(footer.locator("#ebc-connect")).not.toHaveAttribute("aria-current", "page");
  await expect(footer.locator("#ebc-build")).toHaveAttribute("title", missionTrio.pills.build.title);
});

test("mission trio — planetary onboard EBC (all links)", async ({ page }) => {
  await page.goto("/planetary-onboard.html", nav);
  const footer = page.locator("#ebc");
  await expect(footer).toBeVisible({ timeout: 30_000 });
  await expect(footer.locator("#ebc-connect")).toHaveAttribute("href", "/mesh");
  await expect(footer.locator("#ebc-connect")).not.toHaveAttribute("aria-current", "page");
});

test("mission trio — mesh-start EBC (all links)", async ({ page }) => {
  await page.goto("/mesh-start.html", nav);
  const footer = page.locator("#ebc");
  await expect(footer).toBeVisible({ timeout: 30_000 });
  await expect(footer.locator("#ebc-build")).toHaveAttribute("href", "/build");
  await expect(footer.locator("#ebc-connect")).not.toHaveAttribute("aria-current", "page");
});

test("mission trio — initial build EBC (Build current)", async ({ page }) => {
  await page.goto("/initial-build.html", nav);
  const footer = page.locator("#ebc");
  await expect(footer).toBeVisible({ timeout: 30_000 });
  await expect(footer.locator("#ebc-build")).toHaveAttribute("aria-current", "page");
  await expect(footer.locator("#ebc-create")).toHaveAttribute("href", "/geodesic.html");
  await expect(footer.locator("#ebc-connect")).toHaveAttribute("href", "/mesh");
});

test("mission trio — demo labs EBC", async ({ page }) => {
  await page.goto("/demo-labs.html", nav);
  const footer = page.locator("#ebc");
  await expect(footer).toBeVisible({ timeout: 30_000 });
  await expect(footer.locator("#ebc-connect")).toHaveAttribute("href", "/mesh");
});

test("mission trio — Super-Centaur starter EBC", async ({ page }) => {
  await page.goto("/p31-super-centaur-starter.html", nav);
  const footer = page.locator("#ebc");
  await expect(footer).toBeVisible({ timeout: 30_000 });
  await expect(footer.locator("#ebc-build")).toHaveAttribute("href", "/build");
});

test("mission trio — geodesic EBC (Create current) + canon CSS", async ({ page, request }) => {
  const css = await request.get("/p31-style.css");
  expect(css.ok()).toBeTruthy();
  await page.goto("/geodesic.html", nav);
  const footer = page.locator("#ebc");
  await expect(footer).toBeVisible({ timeout: 30_000 });
  await expect(footer.locator("#ebc-create")).toHaveAttribute("aria-current", "page");
  await expect(footer.locator("#ebc-create")).toHaveAttribute("title", missionTrio.pills.create.title);
  await expect(footer.locator("#ebc-build")).toHaveAttribute("href", "/build");
});
