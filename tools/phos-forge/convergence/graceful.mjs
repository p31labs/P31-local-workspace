// convergence/graceful.mjs
// Layer 5 — Graceful degradation cascade. Never zero.
//
// Research basis:
// - "Graceful Degradation Cascade — Design every feature of your system to
//   have a degraded-but-functional mode. When a component fails, step down to
//   the next level of capability — never to zero." (P31 reliability patterns)
// - "Tiered output design: rather than treating tasks as all-or-nothing,
//   effective agents structure their work to provide value at multiple levels
//   of completion."
//
// Cascade for convergence:
//   1. full-synthesis        (map-reduce, checkpointed, stall-recovery)
//   2. chunked-synthesis     (force map-reduce, no single giant call)
//   3. concatenated-briefs   (no LLM synthesis: structured presentation)
//   4. raw-facets            (the research outputs, unmodified, + notice)
//
// The cascade NEVER throws and NEVER returns empty. It returns the best
// synthesis the available models can produce, or the research itself — and it
// says which level it reached.

import { resilientConvergence } from './resilient.mjs';
import { callWithStallRecovery } from './stall-recovery.mjs';
import { isConvergenceShaped } from './planner.mjs';

// callFn is the raw single-shot LLM call. It is wrapped in stall-recovery
// here so every stage benefits from the strong-nudge retry.
function wrapCallFn(callFn, session) {
  return async (system, user, opts = {}) => {
    const { text, attempts, recovered } = await callWithStallRecovery(system, user, callFn, {
      originalQuestion: opts.originalQuestion,
      maxEmptyRetries: 2,
    });
    return text;
  };
}

export async function gracefulConvergence(session, researchTexts, callFn, opts = {}) {
  const stages = [];
  const errors = [];
  const wrapped = wrapCallFn(callFn, session);

  // Stage 1: full synthesis (map-reduce + checkpointing + stall recovery).
  try {
    const r = await resilientConvergence(session, researchTexts, wrapped, opts);
    if (isConvergenceShaped(r.synthesis)) {
      return { ...r, level: 'full-synthesis', degraded: false, errors, stageTrace: ['full-synthesis'] };
    }
    errors.push(`full-synthesis: output not convergence-shaped (len=${r.synthesis.length})`);
    stages.push('full-synthesis');
  } catch (e) {
    errors.push(`full-synthesis: ${e.message}`);
    stages.push('full-synthesis');
  }

  // Stage 2: chunked synthesis, forced (fresh session id to skip poisoned checkpoint).
  try {
    const r = await resilientConvergence(`${session}-chunked`, researchTexts, wrapped, opts);
    if (r.synthesis && r.synthesis.trim().length > 200) {
      return { ...r, level: 'chunked-synthesis', degraded: true, errors, stageTrace: [...stages, 'chunked-synthesis'] };
    }
    errors.push(`chunked-synthesis: empty`);
  } catch (e) {
    errors.push(`chunked-synthesis: ${e.message}`);
  }
  stages.push('chunked-synthesis');

  // Stage 3: concatenated briefs — structured presentation, no LLM synthesis.
  const briefs = researchTexts
    .map((t, i) => `## Facet ${i + 1}\n\n${t.slice(0, 2000)}`)
    .join('\n\n---\n\n');
  return {
    synthesis: `${briefs}\n\n> ⚠ Synthesis degraded: no model produced a unified convergence. Research facets shown (level: concatenated-briefs).`,
    level: 'concatenated-briefs',
    degraded: true,
    errors,
    stageTrace: [...stages, 'concatenated-briefs'],
    briefs: researchTexts.map((t) => t.slice(0, 2000)),
  };
}

// Test hook — deterministic: force every stage to fail, verify we get facets.
export async function __testGraceful() {
  const failing = async () => {
    throw new Error('model-down');
  };
  const r = await gracefulConvergence('test', ['facet A content', 'facet B content'], failing);
  return {
    level: r.level,
    degraded: r.degraded,
    hasContent: r.synthesis.length > 0,
    errorCount: r.errors.length,
  };
}