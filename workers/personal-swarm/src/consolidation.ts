import type { FractalDB, FractalNode, CausalChain, SwarmDispatcher, SwarmEvent } from "./types";
import { getDNA, evolve, saveDNA } from "./behaviouralDna";
import { orchestrateChain } from "./swarm";

export interface ConsolidationResult {
  nodeId: string;
  chainId: string;
  agentsFired: string[];
  genomeUpdated: boolean;
  events: SwarmEvent[];
}

// CWP-040D: event-driven consolidation. Called immediately after a causal chain
// is recorded — NO new cron trigger (cron cap already 5/5). It (1) evolves the
// node's behavioural DNA from the outcome and (2) fires the relevant swarm agents.
export async function consolidate(
  db: FractalDB,
  dispatcher: SwarmDispatcher,
  node: FractalNode,
  chain: CausalChain,
): Promise<ConsolidationResult> {
  const dnaRecord = await getDNA(db, node.id);
  const evolved = evolve(dnaRecord.genome, chain);
  const changed = JSON.stringify(evolved) !== JSON.stringify(dnaRecord.genome);
  if (changed) {
    await saveDNA(db, { ...dnaRecord, genome: evolved });
  }
  const agentsFired = await orchestrateChain(db, dispatcher, node, chain);

  // CWP-2026-040H — record each dispatch as a swarm event so the spatial
  // dashboard can replay the fractal's recent pulse.
  const events: SwarmEvent[] = agentsFired.map((agent, i) => ({
    id: `${chain.id}-e${i}`,
    nodeId: node.id,
    agent: agent as SwarmEvent["agent"],
    status: "fired",
    detail: `consolidating chain ${chain.id}`,
    createdAt: chain.createdAt,
  }));
  for (const e of events) {
    await db.logSwarmEvent(e);
  }

  return {
    nodeId: node.id,
    chainId: chain.id,
    agentsFired,
    genomeUpdated: changed,
    events,
  };
}
