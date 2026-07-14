CREATE TABLE IF NOT EXISTS fractal_nodes (
  id TEXT PRIMARY KEY,
  scale TEXT NOT NULL,
  label TEXT NOT NULL,
  did_key TEXT,
  parent_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS causal_memories (
  id TEXT PRIMARY KEY,
  node_id TEXT NOT NULL,
  trigger TEXT NOT NULL,
  goal TEXT NOT NULL,
  approach TEXT NOT NULL,
  outcome TEXT NOT NULL,
  lesson TEXT NOT NULL,
  confidence REAL NOT NULL DEFAULT 0.5,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS behavioural_dna (
  node_id TEXT PRIMARY KEY,
  genome_json TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS fractal_links (
  id TEXT PRIMARY KEY,
  from_node TEXT NOT NULL,
  to_node TEXT NOT NULL,
  rel_type TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_fn_scale ON fractal_nodes(scale);
CREATE INDEX IF NOT EXISTS idx_cm_node ON causal_memories(node_id);
CREATE INDEX IF NOT EXISTS idx_fl_from ON fractal_links(from_node);
CREATE INDEX IF NOT EXISTS idx_fl_to ON fractal_links(to_node);
CREATE TABLE IF NOT EXISTS swarm_events (
  id TEXT PRIMARY KEY,
  node_id TEXT NOT NULL,
  agent TEXT NOT NULL,
  status TEXT NOT NULL,
  detail TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_se_node ON swarm_events(node_id);
CREATE INDEX IF NOT EXISTS idx_se_created ON swarm_events(created_at);
