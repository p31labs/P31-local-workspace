/**
 * Cognitive Passport → EigenTrust Bridge
 *
 * Bridges user-defined relationship data (CogPass `fields.fam`) into the
 * EigenTrust decentralized trust computation. The trust-seeding model maps
 * CogPass relationship types to initial edge weights:
 *
 *   family        → 0.9   (high trust — caregivers, dependents)
 *   clinical      → 0.7   (provider relationships)
 *   professional  → 0.6   (work/collaborator relationships)
 *   peer          → 0.4   (friendship/community)
 *   organizational → 0.3  (institutional affiliations)
 *   other         → 0.1   (unknown/default)
 *
 * Users can override any default with an explicit `trust` value on the
 * relationship entry. The self-node (operator) seeds outgoing edges to
 * each named relation, and EigenTrust propagates trust iteratively:
 *
 *   t^(k+1) = (1-α) C^T t^(k) + α p
 *
 * where C is built from the relationship graph, p is the genesis nodes
 * vector (typically anchored to the operator), and α = 0.2 biases the
 * computation away from Sybil concentration.
 *
 * When mutual trust edges exist (e.g., a family member also trusted the
 * operator), the resulting trust scores converge above the relationship-
 * type minimums. With only outgoing self-edges, relations receive higher
 * scores than their type-default due to transitive propagation.
 */

import { computeEigenTrust, normalizeTrustVector } from './eigentrust';
import type { LocalTrustMatrix, TrustVector, EigenTrustOptions } from './eigentrust';

/**
 * A trust relationship entry as stored in the CogPass `fam` field group.
 * Users define these through the passport generator wizard.
 */
export interface CogPassRelationship {
  id: string;
  name?: string;
  type: 'family' | 'professional' | 'organizational' | 'clinical' | 'peer' | 'other';
  trust?: number;
}

/**
 * Configuration for seeding the EigenTrust matrix from CogPass relationship data.
 *
 * @param selfId - Passport holder's node ID (the "self" node in the trust graph)
 * @param genesisNodes - Pre-trusted nodes that anchor trust (typically [selfId])
 * @param alpha - Bias parameter (0.1-0.3). Higher = more weight on pre-trusted nodes.
 */
export interface CogPassTrustConfig {
  selfId: string;
  genesisNodes: string[];
  alpha?: number;
  epsilon?: number;
  maxIterations?: number;
}

/**
 * Default trust weights keyed by CogPass relationship type.
 *
 * Rationale:
 * - family (0.9): primary caregivers and dependents carry the highest baseline trust.
 * - clinical (0.7): provider/advisor relationships with professional duty of care.
 * - professional (0.6): work colleagues with ongoing collaborative trust.
 * - peer (0.4): community/neighbor relationships.
 * - organizational (0.3): institutional affiliations are indirect trust signals.
 * - other (0.1): unknown relationship type — minimal baseline.
 */
export const DEFAULT_RELATIONSHIP_WEIGHTS: Record<string, number> = {
  family: 0.9,
  clinical: 0.7,
  professional: 0.6,
  peer: 0.4,
  organizational: 0.3,
  other: 0.1,
};

/**
 * Parse raw passport data into validated CogPassRelationship entries.
 *
 * Safely handles opaque `fields.fam` from the PassportDocument — filters
 * out entries missing required fields or with out-of-range trust values.
 *
 * @param raw - Any value (typically `passport.fields.fam`)
 * @returns Array of validated relationship entries
 */
export function parseRelationships(raw: unknown): CogPassRelationship[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is CogPassRelationship => {
    if (!item || typeof item !== 'object') return false;
    const r = item as Record<string, unknown>;
    if (typeof r.id !== 'string' || r.id.length === 0) return false;
    if (typeof r.type !== 'string') return false;
    if (r.trust !== undefined && (typeof r.trust !== 'number' || r.trust < 0 || r.trust > 1)) return false;
    return true;
  });
}

/**
 * Build a LocalTrustMatrix from CogPass relationship entries.
 *
 * Creates directed edges: self → relation using relationship-type trust weights.
 * If the relationship itself carries an explicit `trust` value (user-assigned),
 * that overrides the type default. Optional `weightOverrides` can override any
 * type's default — useful for per-session tuning.
 */
export function relationshipsToTrustMatrix(
  relations: CogPassRelationship[],
  selfId: string,
  weightOverrides?: Record<string, number>
): LocalTrustMatrix {
  const weights = { ...DEFAULT_RELATIONSHIP_WEIGHTS, ...weightOverrides };
  const C: LocalTrustMatrix = {};
  C[selfId] = {};
  for (const rel of relations) {
    const weight = rel.trust ?? weights[rel.type] ?? weights.other;
    C[selfId][rel.id] = weight;
  }
  return C;
}

export function genesisTrustVector(
  genesisNodes: string[],
  relations: CogPassRelationship[],
  selfId: string
): TrustVector {
  const p: TrustVector = {};
  if (genesisNodes.includes(selfId)) {
    p[selfId] = 1.0;
  }
  for (const rel of relations) {
    if (genesisNodes.includes(rel.id)) {
      p[rel.id] = 1.0;
    }
  }
  if (Object.keys(p).length === 0) {
    p[selfId] = 1.0;
  }
  return p;
}

/**
 * One-shot: CogPass relationships → EigenTrust trust vector.
 *
 * Builds the trust matrix from relationship data, anchors to genesis nodes,
 * and runs the EigenTrust iterative convergence. Returns a normalized trust
 * vector where each node's score reflects its estimated trustworthiness.
 *
 * Typically called once after all passport actors/relations are collected.
 */
export function computePassportTrust(
  relations: CogPassRelationship[],
  config: CogPassTrustConfig
): TrustVector {
  const C = relationshipsToTrustMatrix(relations, config.selfId);
  const p = genesisTrustVector(config.genesisNodes, relations, config.selfId);
  return computeEigenTrust(C, p, {
    genesisNodes: config.genesisNodes,
    alpha: config.alpha ?? 0.2,
    epsilon: config.epsilon ?? 0.0001,
    maxIterations: config.maxIterations ?? 100,
  });
}

/**
 * Trust computation with additional passthrough edges.
 *
 * Like `computePassportTrust` but appends user-provided edges (e.g., from
 * interaction history or external trust signals) to the LocalTrustMatrix
 * before running EigenTrust convergence. Useful for hybrid scenarios where
 * the passport graph is supplemented by runtime observations.
 */
export function computeTrustWithPassthrough(
  relations: CogPassRelationship[],
  passthroughEdges: { trustorId: string; trusteeId: string; weight: number }[],
  config: CogPassTrustConfig
): TrustVector {
  const C = relationshipsToTrustMatrix(relations, config.selfId);
  for (const edge of passthroughEdges) {
    if (!C[edge.trustorId]) C[edge.trustorId] = {};
    C[edge.trustorId][edge.trusteeId] = edge.weight;
  }
  const p = genesisTrustVector(config.genesisNodes, relations, config.selfId);
  return computeEigenTrust(C, p, {
    genesisNodes: config.genesisNodes,
    alpha: config.alpha ?? 0.2,
    epsilon: config.epsilon ?? 0.0001,
    maxIterations: config.maxIterations ?? 100,
  });
}

/**
 * Map an EigenTrust trust vector to DADS actor trust scores.
 *
 * Creates a Map of nodeId → trustScore suitable for direct assignment to
 * `Actor.trustScore`. Falls back to relationship-type default for nodes
 * that didn't converge (shouldn't happen in normal operation).
 */
export function trustScoresForDads(
  trustVector: TrustVector,
  relations: CogPassRelationship[]
): Map<string, number> {
  const scores = new Map<string, number>();
  scores.set('self', trustVector.self ?? 0.5);
  for (const rel of relations) {
    const score = trustVector[rel.id];
    if (score !== undefined) {
      scores.set(rel.id, score);
    } else {
      scores.set(rel.id, DEFAULT_RELATIONSHIP_WEIGHTS[rel.type] ?? 0.1);
    }
  }
  return scores;
}
