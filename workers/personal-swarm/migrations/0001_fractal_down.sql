-- Down migration for 0001_fractal.sql — ROLLBACK
-- Rollback complexity: SIMPLE
-- Drops personal swarm fractal tables. Personal swarm data, re-buildable.
-- FK order: fractal_links depends on fractal_nodes.
DROP TABLE IF EXISTS swarm_events;
DROP TABLE IF EXISTS fractal_links;
DROP TABLE IF EXISTS behavioural_dna;
DROP TABLE IF EXISTS causal_memories;
DROP TABLE IF EXISTS fractal_nodes;
