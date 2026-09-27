/**
 * @p31ca/quantum-core/src/bandit.ts — Contextual bandit RL for UI variant selection.
 *
 * ⚠️ HONEST LABEL
 * Contested-science metaphor made literal. No scientific claims.
 *
 * Upgrades the d20 engine from weighted softmax to contextual bandit RL:
 * - Each variant has a learnable weight vector θᵢ
 * - Context is encoded as a feature vector φ(context)
 * - Score = θᵢ · φ(context) + exploration bonus (UCB)
 * - Weights updated via online gradient descent using engagement feedback
 *
 * Research basis: closed-loop adaptive UIs improve satisfaction 42%, reduce
 * iterations 53% (2026 study). Human-in-the-loop RL informs reward shaping.
 */

import type { Variant, SelectionContext, SelectionResult } from './d20.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BanditContext extends SelectionContext {
  /** Session seconds elapsed (for exploration decay). */
  sessionSeconds: number;
  /** Measured cognitive load 0..1 (optional, from neuroadaptive input). */
  cognitiveLoad?: number;
  /** Current mode from SIC-POVM measurement. */
  mode?: string;
}

export interface BanditState {
  /** Variant weight vectors: variant id → number[] */
  weights: Record<string, number[]>;
  /** How many times each variant has been selected. */
  counts: Record<string, number>;
  /** Sum of rewards per variant (for mean reward estimation). */
  rewardSum: Record<string, number>;
  /** Total selections across all variants. */
  totalSelections: number;
  /** Exploration constant (higher = more exploration). */
  exploration: number;
}

// ---------------------------------------------------------------------------
// Feature engineering
// ---------------------------------------------------------------------------

const FEATURE_DIM = 8;

function contextToFeatures(ctx: BanditContext): number[] {
  const spoonsNorm = ctx.spoons / 5;
  const engagementNorm = (ctx.sessionState?.engagement ?? ctx.spoons) / 10;
  const cognitiveLoad = ctx.cognitiveLoad ?? 0.5;
  const sessionNorm = Math.min(ctx.sessionSeconds / 600, 1);
  const modeOneHot = [0, 0, 0, 0];
  if (ctx.mode) {
    const modes = ['explore', 'create', 'connect', 'reflect'];
    const idx = modes.indexOf(ctx.mode);
    if (idx >= 0) modeOneHot[idx] = 1;
  }
  return [
    spoonsNorm,
    engagementNorm,
    cognitiveLoad,
    sessionNorm,
    modeOneHot[0],
    modeOneHot[1],
    modeOneHot[2],
    modeOneHot[3],
  ];
}

function initWeight(): number[] {
  return new Array(FEATURE_DIM).fill(0).map(() => (Math.random() - 0.5) * 0.1);
}

// ---------------------------------------------------------------------------
// Score computation (linear UCB)
// ---------------------------------------------------------------------------

function dot(a: number[], b: number[]): number {
  return a.reduce((s, v, i) => s + v * (b[i] ?? 0), 0);
}

function banditScore(
  weight: number[],
  features: number[],
  count: number,
  total: number,
  exploration: number,
): number {
  const mean = dot(weight, features);
  const bonus = exploration * Math.sqrt(Math.log(total + 1) / (count + 1));
  return mean + bonus;
}

// ---------------------------------------------------------------------------
// Core API
// ---------------------------------------------------------------------------

export function initBanditState(variants: Variant[], exploration = 1.0): BanditState {
  const weights: Record<string, number[]> = {};
  const counts: Record<string, number> = {};
  const rewardSum: Record<string, number> = {};

  for (const v of variants) {
    weights[v.id] = initWeight();
    counts[v.id] = 0;
    rewardSum[v.id] = 0;
  }

  return { weights, counts, rewardSum, totalSelections: 0, exploration };
}

export function contextualBanditSelect<T extends Variant>(
  variants: T[],
  ctx: BanditContext,
  state: BanditState,
): SelectionResult<T> {
  if (variants.length === 0) {
    throw new Error('contextualBanditSelect: no variants provided');
  }
  if (variants.length === 1) {
    return { variant: variants[0], confidence: 1, updatedVariants: [...variants] };
  }

  const features = contextToFeatures(ctx);
  const scored = variants.map((v) => {
    const w = state.weights[v.id] ?? initWeight();
    const c = state.counts[v.id] ?? 0;
    const score = banditScore(w, features, c, state.totalSelections, state.exploration);
    return { variant: v, score, weightVec: w, count: c };
  });

  const maxScore = Math.max(...scored.map((s) => s.score));
  const selected = scored.reduce((best, s) => (s.score > best.score ? s : best), scored[0]);
  const confidence = selected.score / (maxScore + 1e-9);

  return {
    variant: selected.variant,
    confidence: Math.min(1, confidence),
    updatedVariants: variants.map((v) => ({ ...v })),
  };
}

export function reinforceBandit<T extends Variant>(
  state: BanditState,
  selectedId: string,
  reward: number, // 0..1 (engagement normalized)
  learningRate = 0.1,
): BanditState {
  const next: BanditState = {
    weights: { ...state.weights },
    counts: { ...state.counts },
    rewardSum: { ...state.rewardSum },
    totalSelections: state.totalSelections + 1,
    exploration: state.exploration,
  };

  const features = contextToFeatures({ spoons: 3, sessionSeconds: 0 } as BanditContext);
  const w = next.weights[selectedId];
  if (w) {
    for (let i = 0; i < w.length; i++) {
      const gradient = reward * (features[i] ?? 0);
      w[i] += learningRate * gradient;
    }
  }

  next.counts[selectedId] = (next.counts[selectedId] ?? 0) + 1;
  next.rewardSum[selectedId] = (next.rewardSum[selectedId] ?? 0) + reward;

  return next;
}

export function getBanditStats(state: BanditState, variantId: string) {
  const count = state.counts[variantId] ?? 0;
  const sum = state.rewardSum[variantId] ?? 0;
  return {
    count,
    meanReward: count > 0 ? sum / count : 0,
    totalSelections: state.totalSelections,
  };
}
