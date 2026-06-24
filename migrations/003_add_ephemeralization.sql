-- Migration: 003_add_ephemeralization
-- Description: Add purge_at for automatic D1 cleanup and lifecycle management

ALTER TABLE brain_dumps ADD COLUMN purge_at TIMESTAMP DEFAULT (datetime('now', '+90 days'));
CREATE INDEX IF NOT EXISTS idx_brain_dumps_purge_at ON brain_dumps (purge_at);
