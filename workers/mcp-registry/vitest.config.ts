import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      'cloudflare:workers': path.resolve(__dirname, 'src/cloudflare-workers-stub.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.{ts,ts}'],
  },
})