import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Root is the config's own directory so the same tarball works from any cwd
// (canonical `pnpm test` and portal `test:core -c node_modules/...` alike).
const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    root,
    include: ['tests/**/*.spec.{ts,tsx}'],
  },
})