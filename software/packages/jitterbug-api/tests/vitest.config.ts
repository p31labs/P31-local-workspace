import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

// Local config for the additive security unit test. Uses a plain Node
// environment (NOT the Cloudflare Workers pool used by the package's root
// vitest.config.ts) so the constant-time compare can be unit tested in
// isolation without spinning up a Worker runtime.
export default defineConfig({
  root: resolve(__dirname, '..'),
  test: {
    include: ['tests/unit/timing-safe-equal.test.ts'],
    environment: 'node',
  },
});
