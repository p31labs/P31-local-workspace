import { defineConfig } from '@playwright/test';

export default defineConfig({
  globalSetup: './e2e/global-setup.ts',
  testDir: './e2e',
  use: { baseURL: 'http://localhost:5191' },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5191',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    env: { LOOM_LOG: process.env.LOOM_LOG ?? '.loom/ci-events.jsonl' },
  },
});
