import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/__tests__/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      enabled: true,
      thresholds: { statements: 50, branches: 40, functions: 50, lines: 50 },
      include: ['src/**'],
    },
  },
})