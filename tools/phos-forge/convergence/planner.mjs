// convergence/planner.mjs
// Layer 1 — Output Generation Capacity (OGC) planning.
//
// Research basis: "When Agents Go Quiet: Output Generation Capacity and
// Format-Cost Separation for LLM Document Synthesis" (arXiv). Output
// Generation Capacity is the agent's EFFECTIVE output ability given its
// current context state — distinct from and empirically smaller than the raw
// context window. It degrades nonlinearly as context fills.
//
// Observed in this codebase: direct convergence over ~25KB of research facets
// returned empty on 4/4 bench runs (output stalling). The ratio of estimated
// output cost to available OGC was ~1.0, i.e. direct generation was infeasible.
//
// Feasibility ordering: deferred >= chunked >= direct.
//  - direct: generate the full formatted output in one turn
//  - chunked: split generation into k sequential turns (map-reduce)
//  - deferred: generate minimal content, render format later
//
// Deferred rendering reduces generation tokens by 48-72% and eliminates
// output stalling entirely. Chunked succeeded 60% in the reference study
// (3/5) with 2 truncations on the final chunk; direct failed 5/5.

// Conservative token estimate: ~4 chars/token for dense research text.
const CHARS_PER_TOKEN = 4;

// Output Generation Capacity — the model's EFFECTIVE ability to produce
// output. The binding constraint for convergence is the COMPLETION BUDGET
// (max_tokens), not the context window: reasoning models (GLM, Kimi,
// DeepSeek-R) preallocate a share of the completion budget to chain-of-thought
// before emitting any visible token. Where reasoning exhausted the completion
// cap the model emits no answer at all.
//
// OGC = completionBudget * (1 - reasoningOverhead)  (minus the cost of the
// input carrying into the completion window, which is small for our facets).
// With maxTokens=2000 and overhead 0.5, OGC ~= 1000 tokens: a 2000-token
// synthesis target has ratio 2.0 -> deferred. That is exactly the observed
// stall on glm-5.3 (4/4 empty).
function estimatedInputTokens(texts) {
  return texts.reduce((sum, t) => sum + (t ? t.length : 0) / CHARS_PER_TOKEN, 0);
}

export function availableOgc(completionBudget, inputTokens, reasoningOverhead = 0.5) {
  return Math.max(0, completionBudget * (1 - reasoningOverhead) - inputTokens * 0.1);
}

// Strategy selection. Returns a plan:
//   { strategy: 'direct'|'chunked'|'deferred', chunks, ... }
export function selectConvergenceStrategy({ texts, completionBudget = 2000, targetOutputTokens = 2000, reasoningOverhead = 0.5 }) {
  const inputTokens = estimatedInputTokens(texts);
  const ogc = availableOgc(completionBudget, inputTokens, reasoningOverhead);
  const ratio = targetOutputTokens / Math.max(1, ogc);

  if (ratio < 0.4) return { strategy: 'direct', chunks: 1, inputTokens, ogc, ratio };
  if (ratio < 0.9) return { strategy: 'chunked', chunks: Math.max(3, Math.ceil(texts.length / 2)), inputTokens, ogc, ratio };
  return { strategy: 'deferred', chunks: Math.max(3, Math.ceil(texts.length / 2)), template: 'synthesis-v1', inputTokens, ogc, ratio };
}

// The output-conformance contract: every generated artifact must match its
// declared shape. One validator, one error-carrying re-prompt, one retry cap,
// one fallback. (P31 reliability pattern, Category V — Band V-B.)
export function isConvergenceShaped(text) {
  if (!text || typeof text !== 'string') return false;
  const cleaned = text.trim();
  if (cleaned.length < 200) return false; // too short to be a real synthesis
  return /^#{1,3}\s+/.test(cleaned); // has at least one markdown heading
}

// Small deterministic test hook so the planner is verifiable without a model.
export function __testPlan() {
  const tiny = ['a'.repeat(200), 'b'.repeat(200)];
  // A 2000-token synthesis target vs a ~400-token completion budget forces
  // ratio > 0.9 -> deferred; a small target vs a large budget -> direct.
  const direct = selectConvergenceStrategy({ texts: tiny, completionBudget: 8000, targetOutputTokens: 100 }).strategy;
  const chunked = selectConvergenceStrategy({ texts: tiny, completionBudget: 1500, targetOutputTokens: 600 }).strategy;
  const deferred = selectConvergenceStrategy({ texts: tiny, completionBudget: 500, targetOutputTokens: 2000 }).strategy;
  return { direct, chunked, deferred };
}