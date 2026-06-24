import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      enabled: true,
      thresholds: { statements: 60, branches: 50, functions: 60, lines: 60 },
      include: ['src/**'],
    },
  },
});
