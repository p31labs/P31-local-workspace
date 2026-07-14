import type { FractalDB, BehaviouralDNA, Genome, Trait, CausalChain } from "./types";
import { TRAITS } from "./types";

const DEFAULT_TRAIT = 0.5;

export function initGenome(): Genome {
  const g = {} as Genome;
  for (const t of TRAITS) g[t] = DEFAULT_TRAIT;
  return g;
}

function clamp(v: number): number {
  return Math.max(0, Math.min(1, v));
}

// CWP-040B: behavioural DNA — a 13-trait genome that evolves from lived causal
// chains. Each concluded action nudges the genome so the node "learns" its nature.
export function evolve(dna: Genome, chain: Pick<CausalChain, "outcome" | "confidence">): Genome {
  const next: Genome = { ...dna };
  const success = chain.confidence >= 0.7;
  const failure = chain.confidence <= 0.3;

  const bump = (t: Trait, d: number) => {
    next[t] = clamp(next[t] + d);
  };

  if (success) {
    bump("conscientiousness", 0.03);
    bump("resilience", 0.03);
    bump("focus", 0.02);
    bump("care", 0.02);
    bump("reciprocity", 0.02);
    bump("trust", 0.01);
    bump("autonomy", 0.01);
  } else if (failure) {
    bump("adaptability", 0.04);
    bump("curiosity", 0.03);
    bump("neuroticism", 0.02);
    bump("trust", -0.02);
  } else {
    bump("adaptability", 0.01);
    bump("curiosity", 0.01);
  }
  return next;
}

export async function getDNA(
  db: FractalDB,
  nodeId: string,
): Promise<BehaviouralDNA> {
  const row = await db.getDna(nodeId);
  if (row) {
    return {
      nodeId,
      genome: JSON.parse(row.genome_json) as Genome,
      updatedAt: row.updated_at,
    };
  }
  const fresh: BehaviouralDNA = {
    nodeId,
    genome: initGenome(),
    updatedAt: new Date().toISOString(),
  };
  await saveDNA(db, fresh);
  return fresh;
}

export async function saveDNA(db: FractalDB, dna: BehaviouralDNA): Promise<void> {
  await db.upsertDna(dna.nodeId, JSON.stringify(dna.genome), dna.updatedAt);
}
