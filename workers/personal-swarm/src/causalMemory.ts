import type { FractalDB, CausalChain } from "./types";

export interface RecordCausalInput {
  nodeId: string;
  trigger: string;
  goal: string;
  approach: string;
  outcome: string;
  lesson: string;
  confidence?: number;
}

// CWP-040A: causal memory — every action is captured as a full chain so the
// swarm can reason about what worked and why.
export async function recordCausalChain(
  db: FractalDB,
  input: RecordCausalInput,
): Promise<CausalChain> {
  const chain: CausalChain = {
    id: crypto.randomUUID(),
    nodeId: input.nodeId,
    trigger: input.trigger,
    goal: input.goal,
    approach: input.approach,
    outcome: input.outcome,
    lesson: input.lesson,
    confidence: input.confidence ?? 0.5,
    createdAt: new Date().toISOString(),
  };
  await db.insertCausal(chain);
  return chain;
}

export async function listCausalChains(
  db: FractalDB,
  nodeId: string,
  limit = 50,
): Promise<CausalChain[]> {
  return db.listCausal(nodeId, limit);
}

export async function lessonsForNode(
  db: FractalDB,
  nodeId: string,
  minConfidence = 0.6,
): Promise<string[]> {
  const rows = await db.lessonsByConfidence(nodeId, minConfidence);
  return rows.map((r) => r.lesson);
}
