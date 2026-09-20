import { defineConfig } from '@playwright/test';

export default defineConfig({
  globalSetup: './e2e/global-setup.ts',
  testDir: './e2e',
  use: { baseURL: 'http://localhost:5191' },
  // The specs share one log file (.loom/ci-events.jsonl); several clear it in
  // beforeEach to stay self-contained. Serial workers keep that clearing from
  // racing another spec's commits.
  workers: 1,
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5191',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    env: { LOOM_LOG: process.env.LOOM_LOG ?? '.loom/ci-events.jsonl' },
  },
});
