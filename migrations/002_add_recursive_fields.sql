-- Migration: 002_add_recursive_fields
-- Description: Add recursive decomposition fields to brain_dumps

ALTER TABLE brain_dumps ADD COLUMN depth INTEGER DEFAULT 0;
ALTER TABLE brain_dumps ADD COLUMN parent_id TEXT;
ALTER TABLE brain_dumps ADD COLUMN lineage TEXT;  -- JSON array of ancestor IDs
ALTER TABLE brain_dumps ADD COLUMN is_atomic BOOLEAN DEFAULT FALSE;
ALTER TABLE brain_dumps ADD COLUMN batch_strategy TEXT DEFAULT 'depth-first';
ALTER TABLE brain_dumps ADD COLUMN max_depth INTEGER DEFAULT 3;

-- Indexes for recursive queries
CREATE INDEX IF NOT EXISTS idx_brain_dumps_parent_id ON brain_dumps (parent_id);
CREATE INDEX IF NOT EXISTS idx_brain_dumps_depth ON brain_dumps (depth);
