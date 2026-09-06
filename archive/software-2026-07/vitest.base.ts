import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      thresholds: { lines: 80, branches: 75, functions: 80, statements: 80 },
    },
    testTimeout: 15000,
    retry: 1,
  },
  resolve: {
    alias: {
      react: 'react',
      'react-dom': 'react-dom',
    },
    dedupe: ['react', 'react-dom'],
  },
});
