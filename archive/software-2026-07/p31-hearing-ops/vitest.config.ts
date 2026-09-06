import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      enabled: true,
      thresholds: { statements: 40, branches: 30, functions: 40, lines: 40 },
      include: ['src/health*'],
    },
  },
});
