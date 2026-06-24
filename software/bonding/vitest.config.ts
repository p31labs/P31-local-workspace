import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: [
      'tests/e2e/**',
      'node_modules/**',
      '**/.pnpm/**',
      '**/.local/share/pnpm/**',
      '**/andromeda/**',
      '**/P31-local-workspace/andromeda/**',
      '**/../andromeda/**',
      '**/.codex/**',
    ],
  },
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    reportsDirectory: 'coverage',
    thresholds: {
      lines: 70,
      branches: 60,
      functions: 70,
      statements: 70,
    },
    exclude: [
      'node_modules/**',
      'dist/**',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.config.ts',
      'src/data/**',
      'src/config/**',
      'src/assets/**',
    ],
  },
  resolve: {
    alias: {
      '@p31/shared': path.resolve(__dirname, '../packages/shared/src'),
      '@p31/spaceship-earth': path.resolve(__dirname, '../spaceship-earth/src'),
    },
    dedupe: ['react', 'react-dom'],
  },
});
