-- Migration 001: Create embeddings table for semantic search
-- Uses pgvector for cosine similarity search

CREATE TABLE IF NOT EXISTS embeddings (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  embedding TEXT NOT NULL, -- JSON array of 384 floats (all-MiniLM-L6-v2)
  metadata TEXT NOT NULL DEFAULT '{}', -- JSON object
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_embeddings_created_at ON embeddings(created_at);

-- Note: pgvector extension must be enabled on the D1 database
-- After creating the database, run:
-- ALTER TABLE embeddings ADD COLUMN embedding_vector vector(384);
-- CREATE INDEX ON embeddings USING ivfflat (embedding_vector vector_cosine_ops) WITH (lists = 100);
