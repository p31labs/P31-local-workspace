// convergence/cost.mjs
// Cost model for quality-per-dollar (WP-JITTERBUG-PURPOSE).
//
// Denominator: total cost per prompt = sum over every inference call of
//   (prompt_tokens + completion_tokens) × price-per-token.
// Prices come from models-catalog.json (priceInUsdPerM input / priceOutUsdPerM
// output). Token counts come from the live telemetry (router.decision events
// record prompt_tokens / completion_tokens per call).
//
// The 3x-frontier quality-per-dollar figure in the purpose statement is a
// HYPOTHESIS until this measurement exists. This module makes it measurable.

import { readFileSync, existsSync } from 'node:fs';

const CATALOG_PATH = '/home/p31/P31-local-workspace/tools/phos-forge/models-catalog.json';

let _priceByModel = null;
function priceByModel() {
  if (_priceByModel) return _priceByModel;
  _priceByModel = {};
  try {
    const cat = JSON.parse(readFileSync(CATALOG_PATH, 'utf8')).models ?? [];
    for (const m of cat) {
      _priceByModel[m.name] = {
        in: m.priceInUsdPerM ?? 0,
        out: m.priceOutUsdPerM ?? m.priceInUsdPerM ?? 0,
      };
    }
  } catch { /* fall back to empty */ }
  return _priceByModel;
}

// Cost of a single call given token counts and model name. USD.
export function callCostUsd({ model, promptTokens = 0, completionTokens = 0 }) {
  const p = priceByModel()[model] ?? { in: 0, out: 0 };
  return (promptTokens * p.in + completionTokens * p.out) / 1_000_000;
}

// Aggregate cost across a telemetry log (router.decision events). USD.
// Optional sessionId filter scopes the cost to ONE session's calls —
// required for quality-per-dollar, which must measure a single run's cost,
// not the whole shared log (the log also holds probes, tests, live probes).
export function telemetryCostUsd(eventsPath = '/tmp/phos-forge/events.jsonl', sessionId = null) {
  if (!existsSync(eventsPath)) return 0;
  let total = 0;
  const lines = readFileSync(eventsPath, 'utf-8').split('\n').filter(Boolean);
  for (const line of lines) {
    try {
      const ev = JSON.parse(line);
      const p = ev.payload ?? ev;
      if (sessionId && p.session_id !== sessionId) continue;
      if (p.model && (p.prompt_tokens || p.completion_tokens)) {
        total += callCostUsd({ model: p.model, promptTokens: p.prompt_tokens ?? 0, completionTokens: p.completion_tokens ?? 0 });
      }
    } catch { /* skip malformed */ }
  }
  return total;
}

// quality-per-dollar: compliance score / USD cost for a run's calls.
export function qualityPerDollar({ compliance, costUsd }) {
  if (!costUsd || costUsd <= 0) return 0;
  return compliance / costUsd;
}

// Test hook — deterministic, no LLM.
export function __testCost() {
  const a = callCostUsd({ model: '@cf/zai-org/glm-5.3', promptTokens: 1000, completionTokens: 500 });
  const b = callCostUsd({ model: '@cf/google/gemma-4-26b-a4b-it', promptTokens: 1000, completionTokens: 500 });
  return {
    glmCost: a,
    gemmaCost: b,
    glmGreaterThanGemma: a > b, // glm-5.3 ($1.40/M) should cost more than gemma ($0.10/M)
    qpd: qualityPerDollar({ compliance: 0.7, costUsd: 0.001 }),
  };
}