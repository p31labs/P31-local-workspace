import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

// Local config for the additive UIG tool test. Maps the @p31/interface-generator
// bare specifier to the package entry point (dist/index.js) so the test can
// import the generator/renderer exactly as a consumer (e.g. the MCP tool / PWA)
// would, without touching the root vitest config.
export default defineConfig({
  resolve: {
    alias: {
      '@p31/interface-generator': resolve(__dirname, '../dist/index.js'),
    },
  },
  root: resolve(__dirname, '..'),
  test: {
    include: ['tests/*.test.ts'],
    environment: 'node',
  },
});
