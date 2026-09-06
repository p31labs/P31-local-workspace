import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      enabled: true,
      thresholds: { statements: 40, branches: 30, functions: 40, lines: 40 },
      include: ['src/**'],
    },
  },
});
