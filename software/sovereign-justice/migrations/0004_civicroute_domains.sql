-- Migration 0004: Expand RAG domain values for CivicRoute AI pilot
-- Drops old CHECK constraint ('legal', 'procedural', 'restorative')
-- Adds CivicRoute domains: housing, labor, consumer, family, immigration, benefits, other

-- Recreate rag_documents with expanded domains
CREATE TABLE IF NOT EXISTS rag_documents_v2 (
    id TEXT PRIMARY KEY,
    case_id TEXT,
    domain TEXT NOT NULL CHECK(domain IN ('legal', 'procedural', 'restorative', 'housing', 'labor', 'consumer', 'family', 'immigration', 'benefits', 'other')),
    document_name TEXT NOT NULL,
    chunk_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO rag_documents_v2 (id, case_id, domain, document_name, chunk_count, created_at, updated_at)
SELECT id, case_id, domain, document_name, chunk_count, created_at, updated_at FROM rag_documents;

DROP TABLE rag_documents;
ALTER TABLE rag_documents_v2 RENAME TO rag_documents;

-- Recreate rag_chunks with expanded domains
CREATE TABLE IF NOT EXISTS rag_chunks_v2 (
    id TEXT PRIMARY KEY,
    case_id TEXT,
    domain TEXT NOT NULL CHECK(domain IN ('legal', 'procedural', 'restorative', 'housing', 'labor', 'consumer', 'family', 'immigration', 'benefits', 'other')),
    document_name TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    raw_text TEXT NOT NULL,
    metadata TEXT DEFAULT '{}',
    vector_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO rag_chunks_v2 (id, case_id, domain, document_name, chunk_index, raw_text, metadata, vector_id, created_at)
SELECT id, case_id, domain, document_name, chunk_index, raw_text, metadata, vector_id, created_at FROM rag_chunks;

DROP TABLE rag_chunks;
ALTER TABLE rag_chunks_v2 RENAME TO rag_chunks;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_rag_domain ON rag_chunks(domain);
CREATE INDEX IF NOT EXISTS idx_rag_case_id ON rag_chunks(case_id);
CREATE INDEX IF NOT EXISTS idx_rag_document ON rag_chunks(document_name);
CREATE INDEX IF NOT EXISTS idx_rag_docs_domain ON rag_documents(domain);
CREATE INDEX IF NOT EXISTS idx_rag_docs_case ON rag_documents(case_id);
