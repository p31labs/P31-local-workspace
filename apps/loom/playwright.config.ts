import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:5191' },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5191',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
