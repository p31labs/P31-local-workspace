# Kenosis Mesh — Serverless 7-Node SIC-POVM Topology

A single Cloudflare Worker hosting 7 Durable Objects implementing the K4 complete graph topology for the P31 Cognitive Prosthetic.

## Architecture

```
R (Root) → A, B, C (Inner Trinity)
A → D, E
B → E, F
C → D, F
D, E, F → R (Leaves)
```

| Node | Role | DO Class | Children |
|------|------|----------|----------|
| R | Root / Aggregator | RNode | A, B, C |
| A | Axis A (Somatic) | ANODE | D, E |
| B | Axis B (Forensic) | BNODE | E, F |
| C | Axis C (Technical) | CNODE | D, F |
| D | Leaf D | DNODE | — |
| E | Leaf E | ENODE | — |
| F | Leaf F | FNODE | — |

## Files

```
kenosis-mesh/
├── wrangler.toml         # Worker + 7 DO bindings
├── src/
│   └── index.js          # Worker router + 7 DO classes
└── scripts/
    └── test-mesh.js      # Post-deployment test
```

## Deployment

### 1. Configure wrangler.toml

Replace placeholders:
- `<CF_ACCOUNT_ID>` — your Cloudflare account ID
- `<AUTH_TOKEN>` — set via [vars] in wrangler.toml

### 2. Deploy

```bash
cd kenosis-mesh
npx wrangler login
npx wrangler deploy
```

### 3. Test

```bash
node scripts/test-mesh.js
```

Expected response:
```json
{ "ack": true, "session": "init-..." }
```

## Endpoints

### GET /health

Returns mesh health and topology info.

```json
{
  "status": "kenosis-mesh-edge-healthy",
  "topology": "K4 Complete Graph",
  "nodes": ["R","A","B","C","D","E","F"]
}
```

### POST /message

Send an envelope to the mesh. Requires Bearer token authentication.

```json
{
  "id": "session-123",
  "from": "OPERATOR",
  "to": "R",
  "type": "init",
  "payload": { "command": "VERIFY_K4_INTEGRITY" },
  "timestamp": 1743586400000
}
```

Response:
```json
{ "ack": true, "session": "session-123" }
```

### GET /session?id={sessionId}

Query session status and leaf results.

```json
{
  "session": "session-123",
  "leaf_results": {
    "D": "D_proc:1775051952520",
    "E": "E_proc:1775051952522",
    "F": "F_proc:1775051952485"
  },
  "final": {
    "D": "D_proc:1775051952520",
    "E": "E_proc:1775051952522",
    "F": "F_proc:1775051952485"
  }
}
```

## Message Flow

1. **Init**: External POST → RNode → forwards to A, B, C (parallel)
2. **Inner Trinity**: 
   - A → D, E
   - B → E, F
   - C → D, F
3. **Leaves**: D, E, F process and return results to R
4. **Aggregation**: R collects all 3 leaf results, stores final state

## Security

- **Public**: `/message` endpoint — protected by Bearer token (`AUTH_TOKEN` env var)
- **Internal**: DO-to-DO calls use `http://internal/` URLs, bypass auth
- **Health**: `/health` and `/session` endpoints are public (read-only)

## Auth Token

Set in `wrangler.toml`:
```toml
[vars]
AUTH_TOKEN = "your-secret-token"
```

All POST requests to `/message` must include:
```
Authorization: Bearer your-secret-token
```

## License

MIT — P31 Labs
