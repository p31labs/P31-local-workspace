# Spaceship Earth — Reference Implementation Guide

**Version:** 2.0.0
**Last Updated:** 2026-08-17
**Status:** Production-ready

---

## Overview

Spaceship Earth is a complete reference implementation for a sovereign, PQC-ready, EUDI-compatible MCP server with local semantic search. It demonstrates all of P31's capabilities in one package:

- **Dome geometry & system health** — Geodesic docking dome with 9600 NeoPixel segments
- **Post-Quantum Cryptography** — All three NIST FIPS standards (ML-KEM-768, ML-DSA-65, SLH-DSA-128s)
- **EUDI Wallet** — W3C VC 2.1 credentials ready for EUDI Wallet import
- **Semantic Search** — Transformers.js + pgvector for local embeddings
- **Mesh Networking** — WebSocket signaling for peer-to-peer communication

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Spaceship Earth                          │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React + Three.js)                                │
│  ├── Geodesic Dome (9600 NeoPixels)                        │
│  ├── Telemetry HUDs (DUNA, System, LED)                    │
│  └── Sovereign State Orchestration                         │
├─────────────────────────────────────────────────────────────┤
│  MCP Server (CLI: spaceship-server.js)                     │
│  ├── 16 Tools (Dome, PQC, EUDI, Sessions, Search, Mesh)   │
│  ├── Local Embeddings (Transformers.js)                    │
│  └── Session Management                                    │
├─────────────────────────────────────────────────────────────┤
│  Worker (spaceship-relay)                                  │
│  ├── POST /mcp (MCP 2026-07-28 endpoint)                  │
│  ├── GET /eudi/:type (VC 2.1 export)                      │
│  ├── POST /state/:did/triple (Triple-signature state)     │
│  ├── WS /ws (WebRTC signaling)                            │
│  └── KV State (SPACESHIP_TELEMETRY)                       │
└─────────────────────────────────────────────────────────────┘
```

### Dome Geometry Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `DOME_RADIUS` | 12 | Dome radius in scene units |
| `PORT_COUNT` | 120 | Number of docking ports |
| `SEGMENTS_PER_EDGE` | 20 | Segments per geodesic edge |
| `LAYERS` | 4 | Dome layers |
| `TETRA_FRAME` | 6 | Tetrahedral frame edges |
| `OUTER_EDGES` | 60 | Outer shell edges |

### Geodesic Edge Count

```
geodesicEdgeCount = SEGMENTS_PER_EDGE * LAYERS + TETRA_FRAME + OUTER_EDGES
                  = 20 * 4 + 6 + 60
                  = 146 edges
```

---

## Deployment

### Worker Deployment

```bash
cd packages/spaceship-earth
npx wrangler deploy
```

**Worker URL:** `https://spaceship-relay.trimtab-signal.workers.dev`
**Version ID:** `9e38893b-71ee-4e3b-b7df-4a2a3d946b77`

### CLI Server

```bash
node cli/spaceship-server.js
```

Stdio JSON-RPC server with 16 tools. Reads from stdin, writes to stdout.

### Pages Deployment

```bash
cd packages/spaceship-earth
npx wrangler pages deploy dist --project-name spaceship-earth
```

**Pages URL:** `https://spaceship-earth.pages.dev`

---

## Tool Reference

### Dome Geometry & System Health

#### `duna_status`
Get DUNA readiness: member count vs target, progress bar, readiness label, and active ships.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "duna_status",
    "arguments": {}
  }
}
```

**Response:**
```json
{
  "memberCount": 12,
  "targetCount": 20,
  "progress": 0.6,
  "readinessLabel": "Building",
  "activeShips": 5
}
```

#### `system_health`
Get system health: coherence, spoons, engagement, docked ports, and mesh status.

```json
{
  "name": "system_health",
  "arguments": {}
}
```

**Response:**
```json
{
  "coherence": 0.85,
  "spoons": 4,
  "engagement": 0.72,
  "dockedPorts": 8,
  "meshStatus": "healthy"
}
```

#### `dome_structure`
Get the docking-dome geometry facts: layers, mode, radius, outer edges, ports, NeoPixel segments, K4 tetra frame, inner dome.

```json
{
  "name": "dome_structure",
  "arguments": {}
}
```

### Post-Quantum Cryptography

#### `pqc_keygen`
Generate an Ed25519 or ML-DSA-65 hybrid keypair for post-quantum signing.

```json
{
  "name": "pqc_keygen",
  "arguments": {
    "algorithm": "ed25519"
  }
}
```

**Algorithms:** `ed25519`, `mldsa65`

#### `pqc_sign`
Sign data with Ed25519 or ML-DSA-65. Returns hex-encoded signature.

```json
{
  "name": "pqc_sign",
  "arguments": {
    "algorithm": "ed25519",
    "data": "hello world",
    "privateKey": "..."
  }
}
```

#### `pqc_verify`
Verify Ed25519 or ML-DSA-65 signature against data.

```json
{
  "name": "pqc_verify",
  "arguments": {
    "algorithm": "ed25519",
    "data": "hello world",
    "signature": "...",
    "publicKey": "..."
  }
}
```

#### `kem_encapsulate`
Hybrid KEM encapsulate: ML-KEM-768 (FIPS 203) + X25519. Returns shared secret and ciphertext.

```json
{
  "name": "kem_encapsulate",
  "arguments": {
    "publicKey": "..."
  }
}
```

#### `kem_decapsulate`
Hybrid KEM decapsulate: ML-KEM-768 + X25519. Returns shared secret.

```json
{
  "name": "kem_decapsulate",
  "arguments": {
    "ciphertext": "...",
    "privateKey": "..."
  }
}
```

### EUDI Wallet

#### `eudi_export`
Export a W3C Verifiable Credential (VC 2.1) for the current spaceship-earth session or dome state. Returns a JSON VC ready for EUDI Wallet import.

```json
{
  "name": "eudi_export",
  "arguments": {
    "type": "session"
  }
}
```

**Types:** `session`, `dome`

**Response:**
```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://www.w3.org/2018/credentials/v2"
  ],
  "type": ["VerifiableCredential", "SpaceshipEarthCredential"],
  "issuer": "did:key:z6Mk...",
  "credentialSubject": {
    "id": "did:key:z6Mk...",
    "session": { ... }
  }
}
```

#### `eudi_verify`
Verify a W3C Verifiable Credential (VC 2.1) against its issuer DID. Returns validity status.

```json
{
  "name": "eudi_verify",
  "arguments": {
    "vc": { ... }
  }
}
```

### Session Management

#### `session_list`
List recent spaceship-earth sessions from the local sessions directory.

```json
{
  "name": "session_list",
  "arguments": {
    "limit": 10
  }
}
```

#### `session_export`
Export a session record as a verifiable credential or JSON.

```json
{
  "name": "session_export",
  "arguments": {
    "sessionId": "...",
    "format": "vc"
  }
}
```

### Semantic Search

#### `embedding_store`
Store a text embedding for semantic search over session history. Uses a local vector store.

```json
{
  "name": "embedding_store",
  "arguments": {
    "text": "Dome calibration complete",
    "metadata": {
      "sessionId": "...",
      "timestamp": "2026-08-17T12:00:00Z"
    }
  }
}
```

#### `embedding_search`
Semantic search over stored embeddings. Returns top-k most similar texts.

```json
{
  "name": "embedding_search",
  "arguments": {
    "query": "dome calibration",
    "topK": 5
  }
}
```

### Mesh Networking

#### `mesh_peers`
List known mesh peers from the local peer registry.

```json
{
  "name": "mesh_peers",
  "arguments": {}
}
```

#### `mesh_sync_status`
Get mesh synchronization status: last sync, peer count, pending ops.

```json
{
  "name": "mesh_sync_status",
  "arguments": {}
}
```

---

## EUDI Integration

### W3C VC 2.1 Credentials

Spaceship Earth exports credentials compliant with W3C VC Data Model 2.0/2.1:

- **@context:** `https://www.w3.org/2018/credentials/v1` + `v2`
- **type:** `VerifiableCredential` + custom type
- **proof:** Ed25519 + ML-DSA-65 + SLH-DSA-128s (triple-signature)

### EUDI Wallet Compatibility

The credential structure follows EUDI Wallet requirements:

- `credentialSubject.id` — DID of the subject
- `issuer` — DID of the issuer
- `validFrom` / `validUntil` — ISO 8601 timestamps
- `credentialStatus` — StatusList2021 revocation

### Triple-Signature State

Each state update is signed with three algorithms:

1. **Ed25519** — Classical signature (fast, widely supported)
2. **ML-DSA-65** — NIST FIPS 204 post-quantum signature
3. **SLH-DSA-128s** — NIST FIPS 205 stateless hash-based signature

This provides defense-in-depth against both classical and quantum attacks.

---

## PQC Integration

### NIST FIPS Standards

| Standard | Algorithm | Use Case |
|----------|-----------|----------|
| FIPS 203 | ML-KEM-768 | Key encapsulation (hybrid X25519) |
| FIPS 204 | ML-DSA-65 | Digital signatures |
| FIPS 205 | SLH-DSA-128s | Stateless hash-based signatures |

### Hybrid Approach

All PQC operations use a hybrid classical+PQC approach:

- **KEM:** ML-KEM-768 + X25519 (shared secret from both)
- **Signatures:** Ed25519 + ML-DSA-65 (both required for verification)

This ensures security against both classical and quantum attacks while maintaining backward compatibility.

---

## Semantic Search Pipeline

### Architecture

```
Text → Transformers.js (all-MiniLM-L6-v2) → 384-dim vector → pgvector store
```

### Components

1. **Embeddings:** `Xenova/all-MiniLM-L6-v2` (384-dimensional)
2. **Storage:** pgvector in PGLite (local) or D1 (Worker)
3. **Search:** Cosine similarity via `<=>` operator

### Usage

```javascript
// Store an embedding
await embeddingStore("Dome calibration complete", {
  sessionId: "...",
  timestamp: "2026-08-17T12:00:00Z"
});

// Search for similar text
const results = await embeddingSearch("dome calibration", { topK: 5 });
// Returns: [{ text: "Dome calibration complete", score: 0.92 }, ...]
```

---

## Standards Compliance

| Standard | Version | Status |
|----------|---------|--------|
| W3C VC Data Model | 2.0/2.1 | ✅ Compliant |
| NIST FIPS 203 | ML-KEM-768 | ✅ Implemented |
| NIST FIPS 204 | ML-DSA-65 | ✅ Implemented |
| NIST FIPS 205 | SLH-DSA-128s | ✅ Implemented |
| MCP Protocol | 2026-07-28 | ✅ Compliant |
| RFC 9449 | DPoP | ✅ Implemented |
| RFC 9126 | PAR | ✅ Implemented |
| eIDAS 2.0 | EUDI Wallet | ✅ Export ready |

---

## Related Documentation

- [MANUFACTURERS_MANUAL.md](./MANUFACTURERS_MANUAL.md) — Detailed technical manual
- [server.json](./server.json) — MCP metadata for registry publishing
- [Glama Submission](../glama-submission-payload.json) — Copy-paste payload for Glama
- [Official Registry Entry](../official-registry-entry.json) — Entry for MCP official registry

---

## License

AGPL-3.0 — See [LICENSE](../../LICENSE) for details.
