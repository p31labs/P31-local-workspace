import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@p31ca/quantum-core': path.resolve(__dirname, '../../packages/quantum-core/src'),
      '@p31ca/design-core': path.resolve(__dirname, '../../packages/design-core/src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
  },
});