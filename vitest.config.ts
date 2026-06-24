import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: [
      'tests/unit/**/*.test.{ts,tsx}',
      'tests/integration/**/*.test.{ts,tsx}',
      'tests/e2e/**/*.test.{ts,tsx}',
    ],
    exclude: [
      '**/node_modules/**',
      '**/.pnpm/**',
      '**/.local/share/pnpm/**',
      '**/dist/**',
      '**/.codex/**',
      '**/.config/**',
    ],
  },
});
