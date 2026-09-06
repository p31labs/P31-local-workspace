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
      '@p31/spaceship-earth/services/sovereignRelay': path.resolve(__dirname, 'src/__tests__/mocks/sovereignRelay.ts'),
      '@p31/ui/adaptive/GreyRock': path.resolve(__dirname, 'src/__tests__/mocks/greyRock.tsx'),
      '@p31/ui/adaptive/NeuroAdapter': path.resolve(__dirname, 'src/__tests__/mocks/neuroAdapter.ts'),
    },
    dedupe: ['react', 'react-dom'],
  },
});
