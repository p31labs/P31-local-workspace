/**
 * @module love-ledger/vesting
 * @description Age-gated vesting for founding nodes.
 *
 * Founding nodes (S.J. and W.J.) have sovereignty pools that vest
 * over time based on age milestones. This module computes the current
 * vested amount and next milestone for each founding node.
 *
 * The vesting schedule is conservative by design:
 *   13 → 10%   First device, first identity
 *   16 → 25%   Expanded autonomy
 *   18 → 50%   Legal majority
 *   21 → 75%   Full adult
 *   25 → 100%  Prefrontal cortex maturation
 *
 * All calculations are pure functions of the current date and the
 * founding node's birth year.
 */

import type { FoundingNode, VestingMilestone } from "./types.js";
import { DEFAULT_VESTING_SCHEDULE, FOUNDING_NODES } from "./types.js";

export interface VestingStatus {
  readonly node: FoundingNode;
  readonly ageYears: number;
  readonly ageDays: number;
  readonly vestedPercent: number;
  readonly vestedAmount: number;
  readonly lockedAmount: number;
  readonly nextMilestone: VestingMilestone | null;
  readonly daysUntilNext: number | null;
  readonly milestones: readonly MilestoneStatus[];
}

export interface MilestoneStatus {
  readonly milestone: VestingMilestone;
  readonly reached: boolean;
  readonly reachedDate: string | null;
}

/**
 * Compute age from a birth year (number) or ISO date string.
 * When given a number, uses Jan 1 of that year as the reference birthday.
 */
export function computeAge(
  birth: number | string,
  asOf: Date = new Date()
): { years: number; days: number } {
  let dobY: number, dobM: number, dobD: number;
  if (typeof birth === "number") {
    dobY = birth; dobM = 1; dobD = 1;
  } else {
    [dobY, dobM, dobD] = birth.split("-").map(Number) as [number, number, number];
  }
  const dob = new Date(dobY, dobM - 1, dobD);
  const diffMs = asOf.getTime() - dob.getTime();
  const totalDays = Math.floor(diffMs / 86400000);

  let years = asOf.getFullYear() - dobY;
  const monthDiff = asOf.getMonth() - (dobM - 1);
  if (monthDiff < 0 || (monthDiff === 0 && asOf.getDate() < dobD)) {
    years--;
  }

  return { years: Math.max(0, years), days: Math.max(0, totalDays) };
}

/**
 * Compute the date when a person reaches a given age.
 * Accepts birth year (number) or ISO date string.
 */
export function dateAtAge(birth: number | string, ageYears: number): Date {
  let y: number, m: number, d: number;
  if (typeof birth === "number") {
    y = birth; m = 1; d = 1;
  } else {
    [y, m, d] = birth.split("-").map(Number) as [number, number, number];
  }
  return new Date(y + ageYears, m - 1, d);
}

export function vestedPercent(
  ageYears: number,
  schedule: readonly VestingMilestone[] = DEFAULT_VESTING_SCHEDULE
): number {
  let percent = 0;
  for (const milestone of schedule) {
    if (ageYears >= milestone.ageYears) {
      percent = milestone.cumulativePercent;
    }
  }
  return percent;
}

export function computeVestingStatus(
  node: FoundingNode,
  sovereigntyPool: number,
  schedule: readonly VestingMilestone[] = DEFAULT_VESTING_SCHEDULE,
  asOf: Date = new Date()
): VestingStatus {
  const age = computeAge(node.birthYear, asOf);
  const vested = vestedPercent(age.years, schedule);
  const vestedAmt = sovereigntyPool * vested / 100;
  const lockedAmt = sovereigntyPool - vestedAmt;

  let nextMilestone: VestingMilestone | null = null;
  for (const m of schedule) {
    if (age.years < m.ageYears) {
      nextMilestone = m;
      break;
    }
  }

  let daysUntilNext: number | null = null;
  if (nextMilestone) {
    const nextDate = dateAtAge(node.birthYear, nextMilestone.ageYears);
    daysUntilNext = Math.max(0, Math.ceil((nextDate.getTime() - asOf.getTime()) / 86400000));
  }

  const milestones: MilestoneStatus[] = schedule.map(m => {
    const d = dateAtAge(node.birthYear, m.ageYears).toISOString().split("T")[0];
    return {
      milestone: m,
      reached: age.years >= m.ageYears,
      reachedDate: d ?? null,
    };
  });

  return {
    node,
    ageYears: age.years,
    ageDays: age.days,
    vestedPercent: vested,
    vestedAmount: vestedAmt,
    lockedAmount: lockedAmt,
    nextMilestone,
    daysUntilNext,
    milestones,
  };
}

export function computeAllVesting(
  sovereigntyPool: number,
  schedule: readonly VestingMilestone[] = DEFAULT_VESTING_SCHEDULE,
  nodes: readonly FoundingNode[] = FOUNDING_NODES,
  asOf: Date = new Date()
): readonly VestingStatus[] {
  const perNodePool = sovereigntyPool / nodes.length;
  return nodes.map(node => computeVestingStatus(node, perNodePool, schedule, asOf));
}
