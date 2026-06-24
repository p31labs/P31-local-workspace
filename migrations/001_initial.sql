-- Migration: 001_initial
-- Description: Create brain_dumps and status_entries tables for Jitterbug API

CREATE TABLE IF NOT EXISTS brain_dumps (
    id TEXT PRIMARY KEY,
    project_name TEXT NOT NULL,
    core_problem TEXT NOT NULL,
    constraints_json TEXT NOT NULL,      -- JSON array of Constraint
    assets_json TEXT NOT NULL,           -- JSON array of KnownAsset
    questions_json TEXT NOT NULL,        -- JSON array of OpenQuestion
    desired_end_state_json TEXT NOT NULL,-- DesiredEndState object
    status TEXT NOT NULL DEFAULT 'pending', -- pending | processing | completed | failed
    axes_json TEXT,                      -- JSON array of Axis (populated after decomposition)
    convergence_result_json TEXT,        -- ConvergenceResult object
    error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS status_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id TEXT NOT NULL,
    axis_id TEXT NOT NULL,
    status TEXT NOT NULL,                -- pending | running | completed | failed
    updated_at TEXT NOT NULL,
    message TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_brain_dumps_status ON brain_dumps (status);
CREATE INDEX IF NOT EXISTS idx_brain_dumps_created_at ON brain_dumps (created_at);
CREATE INDEX IF NOT EXISTS idx_status_entries_batch_id ON status_entries (batch_id);
CREATE INDEX IF NOT EXISTS idx_status_entries_axis_id ON status_entries (axis_id);
