# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Full CVE-2026-29779 remediation (proxy pattern for client-side secrets)
- Structured logging across all workers (JSON, traceId, request correlation)
- Prometheus `/metrics` endpoint on k4-core
- CI/CD pipelines for sovereign-justice and p31-cli
- 26 MCP tools with HTTP + stdio servers
- Spoon-aware CLI with 7 commands
- OSS documentation: LICENSE, CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md

### Changed
- Client-side secrets moved to phos-ai-proxy worker
- GitHub Actions pinned to commit SHAs
- All workflows now have explicit `permissions:` blocks
- WebSocket replay buffer added (50 messages per session)
- Circuit breakers with KV-backed budget ledger

### Fixed
- CVE-2026-29779 (client-side credential exposure)
- WebSocket.Server type safety (stream-server.ts)
- Config loading warnings on non-ENOENT errors
- love_balance deterministic (no more Math.random)
- Tools drift between mcp-bridge.ts and tools.json

### Security
- Rate limiting (RateLimiterDO) added to all POST endpoints
- Nonce replay protection (NonceCacheDO)
- Zod input validation (11 schemas)
- Security headers: HSTS, X-Content-Type-Options, X-Frame-Options

## [2.0.0] - 2026-07-03

### Added
- Initial production release
- 26 MCP tools across 7 categories
- WebSocket terminal streaming
- React + xterm.js web viewer
- DID auth middleware
- Evidence vault + escrow engine + RAG pipeline
- K4 family mesh (k4-cage)
- Settlement engine (k4-core)
- PHOS ambient workspace with spoon-aware UI
- Cognitive Passport v4.1
