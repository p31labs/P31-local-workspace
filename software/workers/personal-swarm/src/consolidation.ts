import type { FractalDB, FractalNode, CausalChain, SwarmDispatcher } from "./types";
import { getDNA, evolve, saveDNA } from "./behaviouralDna";
import { orchestrateChain } from "./swarm";

export interface ConsolidationResult {
  nodeId: string;
  chainId: string;
  agentsFired: string[];
  genomeUpdated: boolean;
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
  return { nodeId: node.id, chainId: chain.id, agentsFired, genomeUpdated: changed };
}
