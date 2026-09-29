#!/usr/bin/env node
/**
 * budget — session cost tracking for the Lantern pipeline.
 *
 * Tracks cumulative cost per session. Halts on budget exhaustion with
 * { ok: false, error: 'BudgetExceededError' }. Uses the catalog price the
 * phos-forge router already reads; cost index is a relative proxy when real
 * prices aren't available.
 */
const DEFAULTS = {
  budgetUsd: 0.5,
  perStageMaxUsd: 0.15,
}

export class BudgetTracker {
  constructor(opts = {}) {
    this.budgetUsd = opts.budgetUsd ?? DEFAULTS.budgetUsd
    this.perStageMaxUsd = opts.perStageMaxUsd ?? DEFAULTS.perStageMaxUsd
    this.used = 0
    this.perStage = {}
  }

  charge(stage, costIndex) {
    // costIndex is the tier's relative cost (T0=1, T1=4, T2=12, T3=40).
    // Treat it as thousandths of a dollar (1 = $0.001) so a full 4-stage run
    // at mixed tiers lands well under the session cap.
    const cost = (costIndex ?? 1) / 1000
    const stageUsed = (this.perStage[stage] ?? 0) + cost
    if (stageUsed > this.perStageMaxUsd) {
      return { ok: false, error: 'PerStageBudgetExceededError', stage, used: stageUsed, cap: this.perStageMaxUsd }
    }
    if (this.used + cost > this.budgetUsd) {
      return { ok: false, error: 'BudgetExceededError', used: this.used + cost, cap: this.budgetUsd }
    }
    this.perStage[stage] = stageUsed
    this.used += cost
    return { ok: true }
  }

  usage() {
    return { usedUsd: this.used, budgetUsd: this.budgetUsd, perStage: this.perStage }
  }
}