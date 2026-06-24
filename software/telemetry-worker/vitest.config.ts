import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: __dirname,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'tests/**/*.test.{ts,js}', 'tests/**/*.spec.{ts,js}'],
    tsconfigPath: './tsconfig.json',
    coverage: {
      provider: 'v8',
      enabled: true,
      thresholds: { statements: 50, branches: 40, functions: 50, lines: 50 },
      include: ['src/**'],
    },
  },
});
