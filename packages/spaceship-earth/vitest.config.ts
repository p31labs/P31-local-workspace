import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@p31/quantum-core': path.resolve(__dirname, '../../packages/quantum-core/src'),
      '@p31/design-core': path.resolve(__dirname, '../../packages/design-core/src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
  },
});