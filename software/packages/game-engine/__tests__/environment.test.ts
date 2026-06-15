import { describe, it, expect } from "vitest";
import { createEnvironment, processTick } from "../src/environment.js";

describe("createEnvironment", () => {
  it("returns defaults when no overrides", () => {
    const env = createEnvironment();
    expect(env.temperature).toBe(20);
    expect(env.windSpeed).toBe(0);
    expect(env.moisture).toBe(0);
    expect(env.deltaTemp).toBe(0);
  });

  it("applies overrides", () => {
    const env = createEnvironment({ temperature: 30 });
    expect(env.temperature).toBe(30);
  });
});

describe("processTick", () => {
  it("changes temperature over time (diurnal cycle)", () => {
    const env = createEnvironment({ temperature: 20 });
    const env2 = processTick(env, 3600);
    expect(env2.temperature).not.toBe(env.temperature);
    expect(env2.deltaTemp).not.toBe(0);
  });

  it("wind speed oscillates", () => {
    const env = createEnvironment();
    const results: number[] = [];
    for (let i = 0; i < 10; i++) {
      const next = processTick(i === 0 ? env : results[i - 1] as unknown as typeof env, 60);
      results.push(next.windSpeed);
    }
    // Not all the same — should vary
    const unique = new Set(results);
    expect(unique.size).toBeGreaterThan(1);
  });

  it("moisture stays in [0, 1]", () => {
    let env = createEnvironment();
    for (let i = 0; i < 1000; i++) {
      env = processTick(env, 60);
      expect(env.moisture).toBeGreaterThanOrEqual(0);
      expect(env.moisture).toBeLessThanOrEqual(1);
    }
  });
});
