-- Down migration for 001_usertest.sql — ROLLBACK
-- Rollback complexity: SIMPLE
-- Drops user testing dashboard tables. Re-buildable test data.
-- FK order: findings depends on sessions, sessions depends on participants.
DROP TABLE IF EXISTS ut_findings;
DROP TABLE IF EXISTS ut_sessions;
DROP TABLE IF EXISTS ut_participants;
DROP TABLE IF EXISTS ut_deadlines;
