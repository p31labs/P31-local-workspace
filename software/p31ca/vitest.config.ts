import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/lib/arcade-core/__tests__/**/*.test.{ts,tsx}'],
    setupFiles: [],
  },
});
