import type {
  FractalDB,
  FractalNode,
  FractalLink,
  CausalChain,
  Scale,
  SwarmEvent,
} from "./types";

const NODE_COLS = "id, scale, label, did_key AS didKey, parent_id AS parentId, created_at AS createdAt";

// --- SQL-backed base (PGLite + D1 share the same query shapes) -------------
abstract class SqlFractalDB implements FractalDB {
  protected abstract query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  protected abstract exec(stmt: string): Promise<void>;
  protected abstract schema(): string;

  async init(): Promise<void> {
    for (const stmt of this.schema().split(";")) {
      const s = stmt.trim();
      if (s) await this.exec(s);
    }
  }

  async createNode(n: FractalNode): Promise<void> {
    await this.query(
      `INSERT INTO fractal_nodes (id, scale, label, did_key, parent_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [n.id, n.scale, n.label, n.didKey ?? null, n.parentId ?? null, n.createdAt],
    );
  }

  async getNode(id: string): Promise<FractalNode | null> {
    const rows = await this.query<FractalNode>(
      `SELECT ${NODE_COLS} FROM fractal_nodes WHERE id = ?`,
      [id],
    );
    return rows[0] ?? null;
  }

  async listNodes(scale?: Scale): Promise<FractalNode[]> {
    if (scale) {
      return this.query<FractalNode>(
        `SELECT ${NODE_COLS} FROM fractal_nodes WHERE scale = ? ORDER BY created_at DESC`,
        [scale],
      );
    }
    return this.query<FractalNode>(
      `SELECT ${NODE_COLS} FROM fractal_nodes ORDER BY created_at DESC`,
    );
  }

  async createLink(l: FractalLink): Promise<void> {
    await this.query(
      `INSERT INTO fractal_links (id, from_node, to_node, rel_type, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [l.id, l.fromNode, l.toNode, l.relType, l.createdAt],
    );
  }

  async listLinks(nodeId: string): Promise<FractalLink[]> {
    return this.query<FractalLink>(
      `SELECT id, from_node AS fromNode, to_node AS toNode, rel_type AS relType, created_at AS createdAt
       FROM fractal_links WHERE from_node = ? OR to_node = ? ORDER BY created_at DESC`,
      [nodeId, nodeId],
    );
  }

  async insertCausal(c: CausalChain): Promise<void> {
    await this.query(
      `INSERT INTO causal_memories
        (id, node_id, trigger, goal, approach, outcome, lesson, confidence, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.id, c.nodeId, c.trigger, c.goal, c.approach, c.outcome, c.lesson, c.confidence, c.createdAt],
    );
  }

  async listCausal(nodeId: string, limit: number): Promise<CausalChain[]> {
    return this.query<CausalChain>(
      `SELECT * FROM causal_memories WHERE node_id = ? ORDER BY created_at DESC LIMIT ?`,
      [nodeId, limit],
    );
  }

  async lessonsByConfidence(nodeId: string, min: number): Promise<{ lesson: string }[]> {
    return this.query<{ lesson: string }>(
      `SELECT lesson FROM causal_memories WHERE node_id = ? AND confidence >= ? ORDER BY confidence DESC`,
      [nodeId, min],
    );
  }

  async getDna(nodeId: string): Promise<{ genome_json: string; updated_at: string } | null> {
    const rows = await this.query<{ genome_json: string; updated_at: string }>(
      `SELECT genome_json, updated_at FROM behavioural_dna WHERE node_id = ?`,
      [nodeId],
    );
    return rows[0] ?? null;
  }

  async upsertDna(nodeId: string, genomeJson: string, updatedAt: string): Promise<void> {
    const existing = await this.query(`SELECT node_id FROM behavioural_dna WHERE node_id = ?`, [nodeId]);
    if (existing.length > 0) {
      await this.query(
        `UPDATE behavioural_dna SET genome_json = ?, updated_at = ? WHERE node_id = ?`,
        [genomeJson, updatedAt, nodeId],
      );
    } else {
      await this.query(
        `INSERT INTO behavioural_dna (node_id, genome_json, updated_at) VALUES (?, ?, ?)`,
        [nodeId, genomeJson, updatedAt],
      );
    }
  }

  async logSwarmEvent(e: SwarmEvent): Promise<void> {
    await this.query(
      `INSERT INTO swarm_events (id, node_id, agent, status, detail, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [e.id, e.nodeId, e.agent, e.status, e.detail ?? null, e.createdAt],
    );
  }

  async listSwarmEvents(nodeId?: string, limit = 50): Promise<SwarmEvent[]> {
    if (nodeId) {
      return this.query<SwarmEvent>(
        `SELECT id, node_id AS nodeId, agent, status, detail, created_at AS createdAt
         FROM swarm_events WHERE node_id = ? ORDER BY created_at DESC LIMIT ?`,
        [nodeId, limit],
      );
    }
    return this.query<SwarmEvent>(
      `SELECT id, node_id AS nodeId, agent, status, detail, created_at AS createdAt
       FROM swarm_events ORDER BY created_at DESC LIMIT ?`,
      [limit],
    );
  }

  async close(): Promise<void> {}
}

// --- PGLite (sovereign Self core, browser/worker) -------------------------
const PGLITE_SCHEMA = `
CREATE TABLE IF NOT EXISTS fractal_nodes (
  id TEXT PRIMARY KEY, scale TEXT NOT NULL, label TEXT NOT NULL,
  did_key TEXT, parent_id TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS causal_memories (
  id TEXT PRIMARY KEY, node_id TEXT NOT NULL, trigger TEXT NOT NULL, goal TEXT NOT NULL,
  approach TEXT NOT NULL, outcome TEXT NOT NULL, lesson TEXT NOT NULL,
  confidence REAL NOT NULL DEFAULT 0.5, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS behavioural_dna (
  node_id TEXT PRIMARY KEY, genome_json TEXT NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS fractal_links (
  id TEXT PRIMARY KEY, from_node TEXT NOT NULL, to_node TEXT NOT NULL,
  rel_type TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS swarm_events (
  id TEXT PRIMARY KEY, node_id TEXT NOT NULL, agent TEXT NOT NULL,
  status TEXT NOT NULL, detail TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

function toPg(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

export class PgliteFractalDB extends SqlFractalDB {
  private db: any = null;
  constructor(private path = "memory://") {
    super();
  }
  protected schema() {
    return PGLITE_SCHEMA;
  }
  protected async exec(stmt: string): Promise<void> {
    await this.db.exec(stmt);
  }
  protected async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const res = await this.db.query(toPg(sql), params);
    return (res.rows || []) as T[];
  }
  async init(): Promise<void> {
    if (!this.db) {
      const { PGlite } = await import("@electric-sql/pglite");
      this.db = new PGlite(this.path as any);
    }
    await super.init();
  }
}

// --- D1 (shared Family/Career sync on p31-cortex D1) ---------------------
const D1_SCHEMA = `
CREATE TABLE IF NOT EXISTS fractal_nodes (
  id TEXT PRIMARY KEY, scale TEXT NOT NULL, label TEXT NOT NULL,
  did_key TEXT, parent_id TEXT, created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS causal_memories (
  id TEXT PRIMARY KEY, node_id TEXT NOT NULL, trigger TEXT NOT NULL, goal TEXT NOT NULL,
  approach TEXT NOT NULL, outcome TEXT NOT NULL, lesson TEXT NOT NULL,
  confidence REAL NOT NULL DEFAULT 0.5, created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS behavioural_dna (
  node_id TEXT PRIMARY KEY, genome_json TEXT NOT NULL, updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS fractal_links (
  id TEXT PRIMARY KEY, from_node TEXT NOT NULL, to_node TEXT NOT NULL,
  rel_type TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS swarm_events (
  id TEXT PRIMARY KEY, node_id TEXT NOT NULL, agent TEXT NOT NULL,
  status TEXT NOT NULL, detail TEXT, created_at TEXT DEFAULT (datetime('now'))
);
`;

export class D1FractalDB extends SqlFractalDB {
  constructor(private d1: any) {
    super();
  }
  protected schema() {
    return D1_SCHEMA;
  }
  protected async exec(stmt: string): Promise<void> {
    await this.d1.exec(stmt);
  }
  protected async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const res = await this.d1.prepare(sql).bind(...(params as any[])).all();
    return (res.results || []) as T[];
  }
}

// --- In-memory (tests + zero-wasm fallback) -------------------------------
export class MemoryFractalDB implements FractalDB {
  private nodes: FractalNode[] = [];
  private links: FractalLink[] = [];
  private causal: CausalChain[] = [];
  private dna = new Map<string, { genome_json: string; updated_at: string }>();
  private events: SwarmEvent[] = [];

  async init(): Promise<void> {}
  async createNode(n: FractalNode): Promise<void> {
    this.nodes.unshift(n);
  }
  async getNode(id: string): Promise<FractalNode | null> {
    return this.nodes.find((n) => n.id === id) ?? null;
  }
  async listNodes(scale?: Scale): Promise<FractalNode[]> {
    return scale ? this.nodes.filter((n) => n.scale === scale) : [...this.nodes];
  }
  async createLink(l: FractalLink): Promise<void> {
    this.links.unshift(l);
  }
  async listLinks(nodeId: string): Promise<FractalLink[]> {
    return this.links.filter((l) => l.fromNode === nodeId || l.toNode === nodeId);
  }
  async insertCausal(c: CausalChain): Promise<void> {
    this.causal.unshift(c);
  }
  async listCausal(nodeId: string, limit: number): Promise<CausalChain[]> {
    return this.causal.filter((c) => c.nodeId === nodeId).slice(0, limit);
  }
  async lessonsByConfidence(nodeId: string, min: number): Promise<{ lesson: string }[]> {
    return this.causal
      .filter((c) => c.nodeId === nodeId && c.confidence >= min)
      .sort((a, b) => b.confidence - a.confidence)
      .map((c) => ({ lesson: c.lesson }));
  }
  async getDna(nodeId: string) {
    return this.dna.get(nodeId) ?? null;
  }
  async upsertDna(nodeId: string, genomeJson: string, updatedAt: string): Promise<void> {
    this.dna.set(nodeId, { genome_json: genomeJson, updated_at: updatedAt });
  }
  async logSwarmEvent(e: SwarmEvent): Promise<void> {
    this.events.unshift(e);
  }
  async listSwarmEvents(nodeId?: string, limit = 50): Promise<SwarmEvent[]> {
    const filtered = nodeId
      ? this.events.filter((e) => e.nodeId === nodeId)
      : this.events;
    return filtered.slice(0, limit);
  }
  async close(): Promise<void> {}
}
