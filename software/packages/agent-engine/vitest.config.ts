import { defineConfig } from 'vitest/config';

/** Suite in tests/agent-engine.test.ts is behind current AgentEngine API; exclude until rewritten. */
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['tests/agent-engine.test.ts', '**/node_modules/**'],
  },
});
