import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
  },
  resolve: {
    alias: {
      '@p31/shared': path.resolve(__dirname, '../packages/shared/src'),
      '@p31/spaceship-earth': path.resolve(__dirname, '../spaceship-earth/src'),
    },
  },
});
