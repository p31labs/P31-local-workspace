-- Down migration for 0001_rag_corpus.sql — ROLLBACK
-- Rollback complexity: SIMPLE
-- Drops RAG corpus tables. Re-indexable from source documents.
-- FK order: rag_queries references rag_chunks, rag_chunks references rag_documents.
DROP TABLE IF EXISTS rag_queries;
DROP TABLE IF EXISTS rag_chunks;
DROP TABLE IF EXISTS rag_documents;
