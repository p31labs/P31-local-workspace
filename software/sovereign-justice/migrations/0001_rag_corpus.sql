-- Migration: 0001_rag_corpus
-- Description: Unified RAG corpus for legal, procedural, and restorative embeddings
-- Part of Phase 0: Sovereign Justice System Foundation

CREATE TABLE IF NOT EXISTS rag_chunks (
    id TEXT PRIMARY KEY,
    case_id TEXT,
    domain TEXT NOT NULL CHECK(domain IN ('legal', 'procedural', 'restorative')),
    document_name TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    raw_text TEXT NOT NULL,
    metadata TEXT NOT NULL DEFAULT '{}',
    vector_id TEXT,
    embedding_model TEXT NOT NULL DEFAULT 'text-embedding-3-large',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_rag_domain ON rag_chunks(domain);
CREATE INDEX IF NOT EXISTS idx_rag_case_id ON rag_chunks(case_id);
CREATE INDEX IF NOT EXISTS idx_rag_document ON rag_chunks(document_name);
CREATE INDEX IF NOT EXISTS idx_rag_vector_id ON rag_chunks(vector_id);

CREATE TABLE IF NOT EXISTS rag_documents (
    id TEXT PRIMARY KEY,
    case_id TEXT,
    domain TEXT NOT NULL CHECK(domain IN ('legal', 'procedural', 'restorative')),
    document_name TEXT NOT NULL,
    source_url TEXT,
    file_hash TEXT,
    chunk_count INTEGER NOT NULL DEFAULT 0,
    metadata TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_rag_docs_domain ON rag_documents(domain);
CREATE INDEX IF NOT EXISTS idx_rag_docs_case ON rag_documents(case_id);

CREATE TABLE IF NOT EXISTS rag_queries (
    id TEXT PRIMARY KEY,
    query_text TEXT NOT NULL,
    domain_filter TEXT,
    top_k INTEGER NOT NULL DEFAULT 5,
    result_ids TEXT NOT NULL DEFAULT '[]',
    result_count INTEGER NOT NULL DEFAULT 0,
    latency_ms INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_rag_queries_created ON rag_queries(created_at);
