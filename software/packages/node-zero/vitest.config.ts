import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["__tests__/**/*.test.ts"],
    globals: false,
    /**
     * Handshake + InMemoryBus/BroadcastChannel tests race when multiple `it()` blocks
     * run concurrently; `afterEach(InMemoryBus.reset)` can clear another test's mesh.
     * CI (slow CPU) exposed 5s timeouts — serialize to match single-thread reality.
     */
    maxConcurrency: 1,
    testTimeout: 15_000,
  },
});
