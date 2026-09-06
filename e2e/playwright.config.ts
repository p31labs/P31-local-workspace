import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  snapshotDir: './e2e/__snapshots__',
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'json' : 'list',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // p31ca
    {
      name: 'p31ca-desktop',
      use: { ...devices['Desktop Chrome'] },
      snapshotDir: './e2e/__snapshots__/p31ca',
    },
    {
      name: 'p31ca-mobile',
      use: { ...devices['iPhone 13'] },
      snapshotDir: './e2e/__snapshots__/p31ca',
    },
    // phosphorus31
    {
      name: 'phosphorus-desktop',
      use: { ...devices['Desktop Chrome'] },
      snapshotDir: './e2e/__snapshots__/phosphorus31',
    },
    {
      name: 'phosphorus-mobile',
      use: { ...devices['iPhone 13'] },
      snapshotDir: './e2e/__snapshots__/phosphorus31',
    },
    // phos
    {
      name: 'phos-desktop',
      use: { ...devices['Desktop Chrome'] },
      snapshotDir: './e2e/__snapshots__/phos',
    },
    {
      name: 'phos-mobile',
      use: { ...devices['iPhone 13'] },
      snapshotDir: './e2e/__snapshots__/phos',
    },
    // willow
    {
      name: 'willow-desktop',
      use: { ...devices['Desktop Chrome'] },
      snapshotDir: './e2e/__snapshots__/willow',
    },
    {
      name: 'willow-mobile',
      use: { ...devices['iPhone 13'] },
      snapshotDir: './e2e/__snapshots__/willow',
    },
  ],
  webServer: [
    {
      command: 'cd apps/p31ca && pnpm run build && npx astro preview --port 4321',
      port: 4321,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd apps/phosphorus31 && pnpm run build && npx astro preview --port 4322',
      port: 4322,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd apps/phos && pnpm run build && npx vite preview --port 5173',
      port: 5173,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd apps/willow && pnpm run build && npx vite preview --port 5174',
      port: 5174,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
