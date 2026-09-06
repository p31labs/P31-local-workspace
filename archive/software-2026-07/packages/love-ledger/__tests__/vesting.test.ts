import { describe, it, expect } from "vitest";
import {
  computeAge,
  dateAtAge,
  vestedPercent,
  computeVestingStatus,
  computeAllVesting,
} from "../src/vesting.js";
import { DEFAULT_VESTING_SCHEDULE, FOUNDING_NODES } from "../src/types.js";

describe("computeAge", () => {
  it("computes age from birth year", () => {
    const asOf = new Date(2026, 1, 21); // Feb 21, 2026
    const age = computeAge(2016, asOf);
    expect(age.years).toBe(10); // Jan 1 birthday already passed
    expect(age.days).toBeGreaterThan(3600);
  });

  it("computes age from ISO date string", () => {
    const asOf = new Date(2026, 1, 21); // Feb 21, 2026
    const age = computeAge("2016-03-10", asOf);
    expect(age.years).toBe(9); // March 10 not yet reached
  });

  it("handles birthday not yet reached in current year", () => {
    // Dec 31, 2025 — Jan 1 birthday hasn't happened in 2026 yet
    const asOf = new Date(2025, 11, 31);
    const age = computeAge(2016, asOf);
    expect(age.years).toBe(9);
  });

  it("handles exact birthday (Jan 1 for birth year)", () => {
    const asOf = new Date(2029, 0, 1); // Jan 1, 2029
    const age = computeAge(2016, asOf);
    expect(age.years).toBe(13);
  });

  it("returns 0 for future birth year", () => {
    const asOf = new Date(2015, 0, 1); // Jan 1, 2015
    const age = computeAge(2016, asOf);
    expect(age.years).toBe(0);
    expect(age.days).toBe(0);
  });
});

describe("dateAtAge", () => {
  it("returns correct date for age 13 from birth year", () => {
    const d = dateAtAge(2016, 13);
    expect(d.getFullYear()).toBe(2029);
    expect(d.getMonth()).toBe(0); // January (Jan 1 reference)
    expect(d.getDate()).toBe(1);
  });

  it("returns correct date for age 25 from birth year", () => {
    const d = dateAtAge(2019, 25);
    expect(d.getFullYear()).toBe(2044);
    expect(d.getMonth()).toBe(0); // January
    expect(d.getDate()).toBe(1);
  });

  it("returns correct date from ISO date string", () => {
    const d = dateAtAge("2016-03-10", 13);
    expect(d.getFullYear()).toBe(2029);
    expect(d.getMonth()).toBe(2); // March
    expect(d.getDate()).toBe(10);
  });
});

describe("vestedPercent", () => {
  it("returns 0 before age 13", () => {
    expect(vestedPercent(12)).toBe(0);
    expect(vestedPercent(0)).toBe(0);
    expect(vestedPercent(9)).toBe(0);
  });

  it("returns 10 at age 13", () => {
    expect(vestedPercent(13)).toBe(10);
  });

  it("returns 10 at age 15 (between milestones)", () => {
    expect(vestedPercent(15)).toBe(10);
  });

  it("returns 25 at age 16", () => {
    expect(vestedPercent(16)).toBe(25);
  });

  it("returns 50 at age 18", () => {
    expect(vestedPercent(18)).toBe(50);
  });

  it("returns 75 at age 21", () => {
    expect(vestedPercent(21)).toBe(75);
  });

  it("returns 100 at age 25", () => {
    expect(vestedPercent(25)).toBe(100);
  });

  it("returns 100 at age 30 (past final milestone)", () => {
    expect(vestedPercent(30)).toBe(100);
  });

  it("uses custom schedule", () => {
    const custom = [
      { ageYears: 10, cumulativePercent: 50, description: "half" },
      { ageYears: 20, cumulativePercent: 100, description: "full" },
    ];
    expect(vestedPercent(10, custom)).toBe(50);
    expect(vestedPercent(15, custom)).toBe(50);
    expect(vestedPercent(20, custom)).toBe(100);
  });
});

describe("computeVestingStatus", () => {
  const node = FOUNDING_NODES[0]!; // Bashium, S.J., birthYear 2016

  it("computes correct status for S.J. as of 2026-02-21", () => {
    const asOf = new Date(2026, 1, 21);
    const status = computeVestingStatus(node, 1000, DEFAULT_VESTING_SCHEDULE, asOf);
    expect(status.ageYears).toBe(10); // Jan 1 birthday already passed
    expect(status.vestedPercent).toBe(0);
    expect(status.vestedAmount).toBe(0);
    expect(status.lockedAmount).toBe(1000);
  });

  it("next milestone is age 13 for a 10-year-old", () => {
    const asOf = new Date(2026, 1, 21);
    const status = computeVestingStatus(node, 1000, DEFAULT_VESTING_SCHEDULE, asOf);
    expect(status.nextMilestone?.ageYears).toBe(13);
    expect(status.daysUntilNext).toBeGreaterThan(0);
  });

  it("vests 10% at age 13", () => {
    const asOf = new Date(2029, 0, 1); // Jan 1, 2029
    const status = computeVestingStatus(node, 1000, DEFAULT_VESTING_SCHEDULE, asOf);
    expect(status.ageYears).toBe(13);
    expect(status.vestedPercent).toBe(10);
    expect(status.vestedAmount).toBe(100);
    expect(status.lockedAmount).toBe(900);
    expect(status.nextMilestone?.ageYears).toBe(16);
  });

  it("fully vested at age 25", () => {
    const asOf = new Date(2041, 0, 1); // Jan 1, 2041
    const status = computeVestingStatus(node, 1000, DEFAULT_VESTING_SCHEDULE, asOf);
    expect(status.ageYears).toBe(25);
    expect(status.vestedPercent).toBe(100);
    expect(status.vestedAmount).toBe(1000);
    expect(status.lockedAmount).toBe(0);
    expect(status.nextMilestone).toBeNull();
    expect(status.daysUntilNext).toBeNull();
  });

  it("milestones array has correct reached flags", () => {
    const asOf = new Date(2034, 7, 8); // S.J. is 18 (born Jan 1 2016)
    const status = computeVestingStatus(node, 1000, DEFAULT_VESTING_SCHEDULE, asOf);
    const reached = status.milestones.filter(m => m.reached);
    expect(reached).toHaveLength(3); // 13, 16, 18
  });
});

describe("computeAllVesting", () => {
  it("returns status for both founding nodes", () => {
    const asOf = new Date(2026, 1, 21);
    const statuses = computeAllVesting(2000, DEFAULT_VESTING_SCHEDULE, FOUNDING_NODES, asOf);
    expect(statuses).toHaveLength(2);
    expect(statuses[0]!.node.initials).toBe("S.J.");
    expect(statuses[1]!.node.initials).toBe("W.J.");
  });

  it("splits sovereignty pool equally between nodes", () => {
    const asOf = new Date(2041, 0, 1); // Jan 1, 2041
    const statuses = computeAllVesting(2000, DEFAULT_VESTING_SCHEDULE, FOUNDING_NODES, asOf);
    // S.J. is 25, fully vested → 1000
    expect(statuses[0]!.vestedAmount).toBe(1000);
  });

  it("W.J. is younger than S.J.", () => {
    const asOf = new Date(2026, 1, 21);
    const statuses = computeAllVesting(2000, DEFAULT_VESTING_SCHEDULE, FOUNDING_NODES, asOf);
    expect(statuses[1]!.ageYears).toBeLessThan(statuses[0]!.ageYears);
  });
});
