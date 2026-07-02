-- Migration 0005: Phase 3 ODR & Live Research Infrastructure
-- Adds: offers, webhooks, events, jurisdiction_lookup tables

-- Blind settlement offers
CREATE TABLE IF NOT EXISTS offers (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    party_did TEXT NOT NULL,
    amount INTEGER NOT NULL,
    round INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_offers_case ON offers(case_id);
CREATE INDEX IF NOT EXISTS idx_offers_party ON offers(party_did);

-- Outgoing webhooks for case events
CREATE TABLE IF NOT EXISTS webhooks (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    events TEXT NOT NULL,
    secret TEXT,
    active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(active);

-- Event audit trail
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_events_case ON events(case_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);

-- Open311 jurisdiction cache
CREATE TABLE IF NOT EXISTS jurisdiction_lookup (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    service_codes TEXT DEFAULT '[]',
    last_synced TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Open311 service request tracking (extends agency_submissions)
ALTER TABLE agency_submissions ADD COLUMN jurisdiction_id TEXT;
ALTER TABLE agency_submissions ADD COLUMN service_request_id TEXT;

-- Legal precedent cache (CourtListener results)
CREATE TABLE IF NOT EXISTS precedent_cache (
    id TEXT PRIMARY KEY,
    citation TEXT NOT NULL,
    court TEXT,
    date_filed TEXT,
    source TEXT DEFAULT 'courtlistener',
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_precedent_citation ON precedent_cache(citation);
