// convergence/model-chain.mjs
// Model chain — walks a fallback chain with per-model circuit breaking,
// stall recovery, and PARALLEL EARLY ROUTING (ParaCascade).
// Ties together:
//   Layer 3 (stall-recovery) — bounded strong-nudge retry per attempt
//   Layer 4 (model-health)   — circuit breaker + chain ordering
//   ParaCascade (IEEE 2026)  — run heavyweight tiers in parallel, first
//                              acceptable wins; bypass lightweight tiers for
//                              difficult instances. 1.16-1.51x inference
//                              speedup at preserved quality.
//   router.mjs               — dispatchLLM with returnModel + reasoning_effort
//
// Strategy:
//   1. estimate complexity from the prompt (cheap, deterministic, no model).
//   2. LOW complexity -> route directly to the cheapest healthy tier
//      (glm-5.3-flash) — skip the frontier call entirely.
//   3. HIGH complexity -> fire GLM + DeepSeek in PARALLEL (Promise.allSettled),
//      accept the first valid non-empty response. This removes the
//      sequential-fallback latency: the common case (GLM works) is no longer
//      blocked behind a linear walk.
//   4. Circuit breaker + stall recovery apply per branch, unchanged. OPEN
//      models are skipped; HALF_OPEN models are probed once.

import { callWithStallRecovery } from './stall-recovery.mjs';
import { fallbackChain, recordSuccess, recordFailure } from './model-health.mjs';
import { dispatchLLM } from '../router.mjs';

// Preferred order for convergence. GLM first (frontier synthesis per catalog),
// DeepSeek-V4-Flash second (1M ctx, different reasoning architecture), Kimi
// last (262K, structured). The circuit breaker sinks any that stall.
const CONVERGENCE_CHAIN = [
  '@cf/zai-org/glm-5.3',
  '@cf/deepseek-ai/deepseek-v4-flash-0731',
  '@cf/moonshotai/kimi-k2.7-code',
];

// Cheap-tire (direct route for LOW complexity) — the cheapest healthy model.
const CHEAP_TIER = '@cf/zai-org/glm-5.3-flash';

// Complexity heuristic — deterministic, no model call. Signals:
//   - total input length (longer = more facets to merge = harder)
//   - explicit divergence/disagreement markers (hard synthesis)
//   - technical-spec demand words (schema/algorithm/protocol/bound)
export function estimateComplexity(user, opts = {}) {
  const text = String(user ?? '');
  const inputLen = text.length;
  const lengthScore = Math.min(1, inputLen / 4000);
  const div = /divergen|disagree|conflict|contradict|trade[- ]off/i.test(text) ? 1 : 0;
  const spec = /schema|algorithm|protocol|bound|invariant|proof|citation|framework/i.test(text) ? 1 : 0;
  // 0.0 .. ~3.0; LOW < 1.2, HIGH >= 1.2
  return {
    score: lengthScore + div + spec,
    low: lengthScore + div + spec < (opts.complexityThreshold ?? 1.2),
    signals: { lengthScore, div, spec },
  };
}

function buildCallOnce(model, system, opts) {
  return async (s, u, callOpts) => {
    const r = await dispatchLLM(s, u, {
      task: 'synthesis',
      privacy: 'workers-ai',
    }, {
      ...(callOpts ?? {}),
      model,
      returnModel: true,
      reasoningEffort: opts.reasoningEffort ?? 'low',
      maxTokens: callOpts?.maxTokens ?? 2000,
      temperature: callOpts?.temperature ?? 0.3,
      timeoutMs: opts.timeoutMs ?? 180000,
    });
    return r;
  };
}

// Run ONE model with stall recovery; resolves to a result or null.
async function tryModel(model, system, user, opts) {
  const callOnce = buildCallOnce(model, system, opts);
  try {
    const { text, content, attempts, recovered } = await callWithStallRecovery(system, user, callOnce, {
      originalQuestion: opts.originalQuestion,
      maxEmptyRetries: opts.maxEmptyRetries ?? 2,
    });
    const servedModel = (typeof text === 'object' && text !== null && text.modelUsed) ? text.modelUsed : model;
    if (content && content.trim().length > 0) {
      recordSuccess(servedModel);
      const lat = typeof text === 'object' && text !== null ? text : {};
      return {
        content, modelUsed: servedModel, recovered, attempts, lat,
      };
    }
    recordFailure(model);
    return null;
  } catch (e) {
    recordFailure(model);
    return null;
  }
}

// Flatten a tryModel result's lat telemetry into the return shape.
function withLat(v) {
  return {
    ...v,
    ttftMs: v.lat?.ttftMs ?? null, tps: v.lat?.tps ?? null, totalMs: v.lat?.totalMs ?? null,
    promptTokens: v.lat?.promptTokens ?? null, completionTokens: v.lat?.completionTokens ?? null,
    cachedPromptTokens: v.lat?.cachedPromptTokens ?? null,
  };
}

export async function convergeWithChain(system, user, opts = {}) {
  const chain = fallbackChain(opts.chain ?? CONVERGENCE_CHAIN);
  const attemptLog = [];
  const complexity = estimateComplexity(user, opts);

  // Direct-to-cheap for LOW complexity: one call, cheapest healthy tier.
  if (complexity.low) {
    const cheap = fallbackChain([CHEAP_TIER])[0];
    attemptLog.push({ mode: 'early-route', complexity: complexity.score, target: cheap });
    const result = await tryModel(cheap, system, user, opts);
    if (result) {
      return { ...withLat(result), mode: 'early-route', complexity: complexity.score, chain: [cheap], attemptLog };
    }
    attemptLog.push({ mode: 'early-route', model: cheap, state: 'failed' });
  }

  // HIGH complexity (or cheap tier failed): parallel early routing.
  // Fire the first two healthy models in parallel; first valid wins.
  const parallelTargets = fallbackChain(chain).slice(0, 2);
  attemptLog.push({ mode: 'parallel', complexity: complexity.score, targets: parallelTargets });
  const settled = await Promise.allSettled(
    parallelTargets.map((model) => tryModel(model, system, user, opts)),
  );
  for (let i = 0; i < settled.length; i++) {
    const r = settled[i];
    if (r.status === 'fulfilled' && r.value) {
      const v = r.value;
      return { ...withLat(v), mode: 'parallel', complexity: complexity.score, chain: parallelTargets, attemptLog };
    }
    attemptLog.push({ model: parallelTargets[i], state: 'failed' });
  }

  // Final sequential fallback through the remaining chain (incl. Kimi).
  for (let i = 2; i < chain.length; i++) {
    const model = chain[i];
    attemptLog.push({ model, state: 'fallback' });
    const result = await tryModel(model, system, user, opts);
    if (result) {
      return { ...withLat(result), mode: 'fallback', complexity: complexity.score, chain: chain.slice(0, i + 1), attemptLog };
    }
  }

  throw new Error(`convergeWithChain: all models failed. ${attemptLog.map((a) => `${a.model ?? a.mode ?? '?'}=${a.state ?? '?'}`).join(', ')}`);
}

// Test hooks — deterministic, no LLM.
export function __testComplexity() {
  const easy = estimateComplexity('merge two briefs about spoon theory');
  const hard = estimateComplexity('merge three research briefs; the divergence concerns schema selection, and the synthesis must propose a protocol bound with a proof and citation to the framework', { complexityThreshold: 1.2 });
  return { easyLow: easy.low, hardLow: hard.low, easyScore: easy.score, hardScore: hard.score };
}