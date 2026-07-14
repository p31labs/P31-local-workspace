import type {
  FractalDB,
  FractalNode,
  CausalChain,
  SwarmAgent,
  SwarmDispatcher,
  Scale,
} from "./types";
import { getDNA } from "./behaviouralDna";

// CWP-040C: each scale maps to the subset of p31-cortex agents that are
// meaningful for it. The fractal invariant = same swarm shape, different agents.
export const AGENTS_BY_SCALE: Record<Scale, SwarmAgent[]> = {
  self: ["content", "kofi"],
  family: ["benefits", "legal"],
  career: ["grant", "finance", "content"],
};

// Behavioural DNA steers which agents fire: high openness -> curiosity agents,
// high care -> support agents. Keeps the swarm adaptive per node.
function agentsForChain(node: FractalNode, dna: Record<string, number>, chain: CausalChain): SwarmAgent[] {
  const base = AGENTS_BY_SCALE[node.scale];
  const failure = chain.confidence <= 0.3;
  const extra: SwarmAgent[] = [];
  if (failure) {
    if (node.scale === "career") extra.push("benefits");
    if (node.scale === "family") extra.push("legal");
    if (node.scale === "self") extra.push("content");
  }
  if ((dna["openness"] ?? 0.5) > 0.7 && !base.includes("legal")) {
    extra.push("legal");
  }
  return Array.from(new Set([...base, ...extra]));
}

export async function orchestrateChain(
  db: FractalDB,
  dispatcher: SwarmDispatcher,
  node: FractalNode,
  chain: CausalChain,
): Promise<SwarmAgent[]> {
  const dna = (await getDNA(db, node.id)).genome as Record<string, number>;
  const agents = agentsForChain(node, dna, chain);
  for (const agent of agents) {
    await dispatcher.dispatch(agent, node, chain);
  }
  return agents;
}
