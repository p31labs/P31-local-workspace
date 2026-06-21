import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: [
      'src/lib/arcade-core/__tests__/**/*.test.{ts,tsx}',
      'src/phos-v2/**/*.test.{ts,tsx}',
      'src/passport/**/*.test.{ts,tsx}',
      'src/lib/**/__tests__/**/*.test.{ts,tsx}',
    ],
    setupFiles: ['./vitest.setup.ts'],
  },
});
