import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: [
      'tests/unit/**/*.test.{ts,tsx}',
      'tests/integration/**/*.test.{ts,tsx}',
      'software/**/tests/**/*.test.{ts,tsx}',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      thresholds: { statements: 80, branches: 75, functions: 80, lines: 80 },
      include: [
        'software/**/src/**/*.{ts,tsx}',
        'software/packages/**/src/**/*.{ts,tsx}',
      ],
      exclude: ['**/*.test.{ts,tsx}', '**/node_modules/**', '**/dist/**'],
    },
    testTimeout: 10000,
    retry: 1,
  },
});
