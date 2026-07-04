import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4321";
const skipServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER === "1";

export default defineConfig({
  testDir: "./e2e",
  // Preview cold-start + heavy index can block concurrent first navigations; 2
  // workers often hit 60s timeouts in CI. Serial runs stay fast enough (~30s).
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  // Must be ≥ e2e `nav` timeout (90s) and cold Astro preview; else page.goto
  // is capped by test timeout and parallel-first-load flakes appear.
  timeout: 120_000,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: skipServer
    ? undefined
    : {
        command: "pnpm run preview -- --host 127.0.0.1 --port 4321",
        url: "http://127.0.0.1:4321/",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
