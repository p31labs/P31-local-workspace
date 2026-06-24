import { defineConfig } from 'vitest/config';

export default defineConfig({
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    reportsDirectory: 'coverage',
    thresholds: {
      lines: 60,
      branches: 50,
      functions: 60,
      statements: 60,
    },
    exclude: [
      'node_modules/**',
      'dist/**',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.config.ts',
      '**/types/**',
      'src/components/games/**',
      'src/engine/**',
      'src/data/**',
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: [
      'src/lib/arcade-core/__tests__/**/*.test.{ts,tsx}',
      'src/phos-v2/**/*.test.{ts,tsx}',
      'src/passport/**/*.test.{ts,tsx}',
      'src/lib/**/__tests__/**/*.test.{ts,tsx}',
      'src/components/**/__tests__/**/*.test.{ts,tsx}',
    ],
    setupFiles: ['./vitest.setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/.pnpm/**',
      '**/pnpm/store/**',
      'src/lib/arcade-core/__tests__/useGameEngine.test.ts',
      'src/components/games/__tests__/GameOverlay.test.tsx',
      'src/phos-v2/convergence/__tests__/convergence.test.ts',
    ],
    // NOTE: tests/triper/*.test.ts excluded from root package — orphaned Vite module-resolution
    // crashes at import time (TransformPluginContext.resolve failure on @p31/passport subpath).
    // Rewrite as src/ vitest tests with correct alias resolution before re-enabling.
  },
  resolve: {
    alias: {
      'react': new URL('node_modules/react', import.meta.url).pathname,
      'react-dom': new URL('node_modules/react-dom', import.meta.url).pathname,
    },
    dedupe: ['react', 'react-dom'],
  },
});
