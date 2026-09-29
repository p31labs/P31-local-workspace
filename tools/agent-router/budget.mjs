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
    // costIndex is either a tier relative cost (T0=1..T3=40) OR, when
    // chargeUsd is used, an explicit dollar figure. For accuracy the router
    // should call chargeUsd() with real catalog prices; charge() keeps the
    // tier proxy for dry-runs.
    const cost = (costIndex ?? 1) / 1000
    return this._charge(stage, cost)
  }

  /** Charge a real dollar figure derived from catalog price + token count. */
  chargeUsd(stage, usd) {
    return this._charge(stage, usd)
  }

  _charge(stage, cost) {
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