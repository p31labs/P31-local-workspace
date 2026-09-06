# PR: Add p31-spaceship-earth MCP Server

## Summary

Adds the P31 Spaceship Earth MCP Server to the official registry. This is a sovereign, PQC-ready, EUDI-compatible MCP server with 16 tools covering dome geometry, system health, post-quantum cryptography, EUDI Wallet export, session management, semantic search, and mesh networking.

## Server Details

- **Name:** p31-spaceship-earth
- **Endpoint:** `https://spaceship-relay.trimtab-signal.workers.dev/mcp`
- **Transport:** streamable-http (MCP 2026-07-28)
- **Authentication:** None (public)
- **Tools:** 16

## Tool Categories

### Dome Geometry & System Health (3 tools)
- `duna_status` — DUNA readiness, member count, progress bar
- `system_health` — Coherence, spoons, engagement, mesh status
- `dome_structure` — Geodesic dome geometry facts

### NeoPixel Control (1 tool)
- `neo_pixel_control` — LED controller state management

### Post-Quantum Cryptography (5 tools)
- `pqc_keygen` — Ed25519 / ML-DSA-65 hybrid keypair generation
- `pqc_sign` — Sign data with Ed25519 or ML-DSA-65
- `pqc_verify` — Verify Ed25519 or ML-DSA-65 signatures
- `kem_encapsulate` — ML-KEM-768 (FIPS 203) + X25519 hybrid KEM
- `kem_decapsulate` — Hybrid KEM decapsulation

### EUDI Wallet (2 tools)
- `eudi_export` — W3C VC 2.1 credential export for EUDI Wallet import
- `eudi_verify` — Verify W3C VC 2.1 credentials

### Session Management (2 tools)
- `session_list` — List recent sessions
- `session_export` — Export session as VC or JSON

### Semantic Search (2 tools)
- `embedding_store` — Store text embeddings for semantic search
- `embedding_search` — Cosine similarity search over embeddings

### Mesh Networking (2 tools)
- `mesh_peers` — List known mesh peers
- `mesh_sync_status` — Mesh synchronization status

## Key Features

1. **PQC-Ready:** All three NIST FIPS standards shipping (ML-KEM-768, ML-DSA-65, SLH-DSA-128s)
2. **EUDI-Compatible:** VC 2.1 credentials ready for EUDI Wallet import (December 2026 deadline)
3. **Triple-Signature State:** Ed25519 + ML-DSA-65 + SLH-DSA-128s for state verification
4. **Semantic Search:** Transformers.js (all-MiniLM-L6-v2) + pgvector for local embeddings
5. **Mesh Networking:** WebSocket signaling for peer-to-peer communication

## Standards Compliance

- W3C VC Data Model 2.0/2.1 (forward-compatible)
- NIST FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA)
- RFC 9449 (DPoP), RFC 9126 (PAR)
- MCP 2026-07-28 (Streamable HTTP)

## Deployment

- **Worker:** `spaceship-relay.trimtab-signal.workers.dev` (Cloudflare Workers)
- **CLI:** `cli/spaceship-server.js` (stdio MCP server)
- **Repository:** `https://github.com/p31labs/andromeda`

## Testing

All 16 tools have been verified live against the deployed Worker:
- `POST /mcp` with `tools/list` returns all 16 tools
- `POST /mcp` with `tools/call` for each tool returns valid responses
- `GET /eudi/session` returns VC 2.1 credentials
- `POST /state/:did/triple` returns triple-signature state

## License

AGPL-3.0
