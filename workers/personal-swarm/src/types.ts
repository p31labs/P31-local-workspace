export type Scale = "self" | "family" | "career";

export interface FractalNode {
  id: string;
  scale: Scale;
  label: string;
  didKey?: string;
  parentId?: string;
  createdAt: string;
}

export interface CausalChain {
  id: string;
  nodeId: string;
  trigger: string;
  goal: string;
  approach: string;
  outcome: string;
  lesson: string;
  confidence: number;
  createdAt: string;
}

// 13-trait behavioural genome. Each trait is a value in [0,1].
export type Trait =
  | "openness"
  | "conscientiousness"
  | "extraversion"
  | "agreeableness"
  | "neuroticism"
  | "autonomy"
  | "reciprocity"
  | "care"
  | "curiosity"
  | "resilience"
  | "focus"
  | "adaptability"
  | "trust";

export const TRAITS: Trait[] = [
  "openness",
  "conscientiousness",
  "extraversion",
  "agreeableness",
  "neuroticism",
  "autonomy",
  "reciprocity",
  "care",
  "curiosity",
  "resilience",
  "focus",
  "adaptability",
  "trust",
];

export type Genome = Record<Trait, number>;

export interface BehaviouralDNA {
  nodeId: string;
  genome: Genome;
  updatedAt: string;
}

export interface FractalLink {
  id: string;
  fromNode: string;
  toNode: string;
  relType: "supports" | "contains" | "mirrors" | "guards";
  createdAt: string;
}

export type SwarmAgent =
  | "legal"
  | "grant"
  | "content"
  | "finance"
  | "benefits"
  | "kofi";

// Injectable dispatcher so the swarm can be unit-tested without network.
export interface SwarmDispatcher {
  dispatch(agent: SwarmAgent, node: FractalNode, payload: unknown): Promise<void>;
}

// CWP-2026-040H — swarm event log. Every agent dispatch during
// consolidation is recorded here so the spatial dashboard can replay the
// fractal's recent pulse (who fired, on which node, when).
export interface SwarmEvent {
  id: string;
  nodeId: string;
  agent: SwarmAgent;
  status: "fired" | "ok" | "error";
  detail?: string;
  createdAt: string;
}

// CWP-2026-040H — unified view returned to the spatial dashboard.
export interface UnifiedFractalView {
  nodes: Array<{
    id: string;
    label: string;
    scale: Scale;
    importance: number;
    source: "self" | "family" | "career";
  }>;
  links: Array<{ source: string; target: string }>;
  events: SwarmEvent[];
}

// Storage-agnostic data access. Implemented by MemoryFractalDB (tests /
// zero-wasm fallback), PgliteFractalDB (sovereign Self core), and
// D1FractalDB (shared Family/Career sync tables on p31-cortex D1).
export interface FractalDB {
  init(): Promise<void>;
  createNode(n: FractalNode): Promise<void>;
  getNode(id: string): Promise<FractalNode | null>;
  listNodes(scale?: Scale): Promise<FractalNode[]>;
  createLink(l: FractalLink): Promise<void>;
  listLinks(nodeId: string): Promise<FractalLink[]>;
  insertCausal(c: CausalChain): Promise<void>;
  listCausal(nodeId: string, limit: number): Promise<CausalChain[]>;
  lessonsByConfidence(nodeId: string, min: number): Promise<{ lesson: string }[]>;
  getDna(nodeId: string): Promise<{ genome_json: string; updated_at: string } | null>;
  upsertDna(nodeId: string, genomeJson: string, updatedAt: string): Promise<void>;
  // CWP-2026-040H — swarm event persistence.
  logSwarmEvent(e: SwarmEvent): Promise<void>;
  listSwarmEvents(nodeId?: string, limit?: number): Promise<SwarmEvent[]>;
  close(): Promise<void>;
}
