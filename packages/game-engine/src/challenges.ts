/**
 * @module game-engine/challenges
 * @description The 7 seed challenges of the P31 building game.
 */

import type {
  Challenge,
  PlayerTier,
  PlayerProgress,
} from "./types.js";

export const SEED_CHALLENGES: readonly Challenge[] = [
  {
    id: "genesis_resonance",
    tier: "seedling",
    title: "The Resonance",
    description: "Speak with the phosphorus. Find coherence.",
    objectives: [
      { type: "custom", description: "Reach CALCIUM level (0.4+ coherence)", target: 0.4, current: 0 },
      { type: "custom", description: "Reach BONDED level (0.65+ coherence)", target: 0.65, current: 0 },
      { type: "custom", description: "Reach POSNER level (0.85+ coherence)", target: 0.85, current: 0 },
    ],
    rewardLove: 25.0,
    rewardXp: 50,
    rewardBadge: "first_resonance",
    prerequisites: [],
    fullerPrinciple: "Unity is plural and at minimum two.",
    realWorldExample: "Every relationship begins with a conversation. Every molecule begins with a bond.",
    coopRequired: false,
  },
  {
    id: "minimum_system",
    tier: "seedling",
    title: "The Minimum System",
    description: "Build the smallest rigid structure: a tetrahedron.",
    objectives: [
      { type: "build_structure", description: "Place a tetrahedron", target: 1, current: 0 },
      { type: "achieve_coherence", description: "Achieve coherence = 1.0", target: 1.0, current: 0 },
    ],
    rewardLove: 15.0,
    rewardXp: 30,
    rewardBadge: "first_structure",
    prerequisites: ["genesis_resonance"],
    fullerPrinciple: "The tetrahedron is the minimum structural system of Universe.",
    realWorldExample: "A camera tripod, a tent frame, a milk crate — all triangulated for stability.",
    coopRequired: false,
  },
  {
    id: "double_bond",
    tier: "seedling",
    title: "The Double Bond",
    description: "Connect two tetrahedra at a shared face.",
    objectives: [
      { type: "place_pieces", description: "Place 2 tetrahedra", target: 2, current: 0 },
      { type: "achieve_coherence", description: "Maintain rigidity (coherence ≥ 1.0)", target: 1.0, current: 0 },
    ],
    rewardLove: 20.0,
    rewardXp: 50,
    rewardBadge: "double_bond",
    prerequisites: ["minimum_system"],
    fullerPrinciple: "Synergy means behavior of whole systems unpredicted by the behavior of their parts.",
    realWorldExample: "Two friends are stronger than one. Two tetrahedra share a face and gain stability.",
    coopRequired: false,
  },
  {
    id: "octet_truss",
    tier: "sprout",
    title: "The Octet Truss",
    description: "Build an octahedron-tetrahedron truss. Fuller's strongest arrangement.",
    objectives: [
      { type: "place_pieces", description: "Place 1 octahedron + 2 tetrahedra", target: 3, current: 0 },
      { type: "achieve_coherence", description: "Achieve coherence ≥ 1.0", target: 1.0, current: 0 },
    ],
    rewardLove: 30.0,
    rewardXp: 100,
    rewardBadge: "octet_truss",
    prerequisites: ["double_bond"],
    fullerPrinciple: "Nature always uses the most economical means.",
    realWorldExample: "The octet truss appears in crystal lattices, space frames, and Alexander Graham Bell's kite towers.",
    coopRequired: false,
  },
  {
    id: "posner_cluster",
    tier: "sapling",
    title: "The Posner Cluster",
    description: "Build a structure with 9 vertices — the calcium phosphate cluster.",
    objectives: [
      { type: "build_structure", description: "Build a structure with ≥ 9 vertices", target: 9, current: 0 },
      { type: "achieve_coherence", description: "Maintain coherence ≥ 0.9", target: 0.9, current: 0 },
    ],
    rewardLove: 40.0,
    rewardXp: 200,
    rewardBadge: "posner_cluster",
    prerequisites: ["octet_truss"],
    fullerPrinciple: "There is nothing in a caterpillar that tells you it's going to be a butterfly.",
    realWorldExample: "Posner molecules (Ca₉(PO₄)₆) may protect quantum coherence in biological systems for hours.",
    coopRequired: false,
  },
  {
    id: "entanglement",
    tier: "oak",
    title: "The Entanglement",
    description: "Build a structure with another player. Two builders, one form.",
    objectives: [
      { type: "form_bond", description: "Form a bond with another player", target: 1, current: 0 },
      { type: "build_structure", description: "Co-build a structure (both contribute pieces)", target: 1, current: 0 },
    ],
    rewardLove: 50.0,
    rewardXp: 500,
    rewardBadge: "entangled",
    prerequisites: ["posner_cluster"],
    fullerPrinciple: "Love is omni-inclusive, progressively exquisite, understanding and compassionately attuned.",
    realWorldExample: "Every bridge, every building, every family is a cooperative structure.",
    coopRequired: true,
  },
  {
    id: "geodesic_dome",
    tier: "sequoia",
    title: "The Geodesic Dome",
    description: "Build a frequency-2 geodesic dome from icosahedral subdivision.",
    objectives: [
      { type: "build_structure", description: "Build with ≥ 42 vertices", target: 42, current: 0 },
      { type: "achieve_coherence", description: "Achieve coherence ≥ 1.0", target: 1.0, current: 0 },
      { type: "place_pieces", description: "Use all three rigid primitives", target: 3, current: 0 },
    ],
    rewardLove: 100.0,
    rewardXp: 2000,
    rewardBadge: "geodesic_master",
    prerequisites: ["entanglement"],
    fullerPrinciple: "Dare to be naïve.",
    realWorldExample: "Geodesic domes enclose the most volume with the least material. Fuller's Biosphere in Montreal stands since 1967.",
    coopRequired: false,
  },
];

export function getChallenge(id: string): Challenge | undefined {
  return SEED_CHALLENGES.find(c => c.id === id);
}

export function canAttempt(challenge: Challenge, player: PlayerProgress): boolean {
  const tierOrder: PlayerTier[] = ["seedling", "sprout", "sapling", "oak", "sequoia"];
  if (tierOrder.indexOf(player.tier) < tierOrder.indexOf(challenge.tier)) {
    return false;
  }

  for (const prereq of challenge.prerequisites) {
    if (!player.completedChallenges.includes(prereq)) {
      return false;
    }
  }

  if (player.completedChallenges.includes(challenge.id)) {
    return false;
  }

  return true;
}

export function isChallengeComplete(challenge: Challenge): boolean {
  return challenge.objectives.every(obj => obj.current >= obj.target);
}

export function availableChallenges(player: PlayerProgress): readonly Challenge[] {
  return SEED_CHALLENGES.filter(c => canAttempt(c, player));
}

export function nextChallenge(player: PlayerProgress): Challenge | undefined {
  return availableChallenges(player)[0];
}

export function freshChallenge(id: string): Challenge | undefined {
  const template = getChallenge(id);
  if (!template) return undefined;
  return {
    ...template,
    objectives: template.objectives.map(o => ({ ...o, current: 0 })),
  };
}
