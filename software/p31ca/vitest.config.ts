import { defineConfig } from 'vitest/config';

export default defineConfig({
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
    exclude: ['**/node_modules/**', '**/.pnpm/**', '**/pnpm/store/**'],
  },
  resolve: {
    alias: {
      'react': new URL('node_modules/react', import.meta.url).pathname,
      'react-dom': new URL('node_modules/react-dom', import.meta.url).pathname,
    },
    dedupe: ['react', 'react-dom'],
  },
});
