import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
  resolve: {
    alias: {
      '@p31ca/design-core': path.resolve(__dirname, '../design-core/src/index.ts'),
      '@p31ca/quantum-core': path.resolve(__dirname, '../quantum-core/src/feedback.ts'),
    },
  },
});
