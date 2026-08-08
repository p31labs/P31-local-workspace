# Spaceship Earth — API Reference

**Document ID:** P31-SE-API-001 | **Version:** 1.1.0 | **Last Updated:** 2026-08-08

---

## 1. Overview

Spaceship Earth exposes **three layers of APIs**:

1. **MCP Server (stdio)** — 4 tools for agents and integrations.
2. **Worker HTTP Endpoints** — Session management, state sync, WebRTC signaling.
3. **WebMCP (Browser)** — Native agent tools via Chrome Origin Trial.

---

## 2. MCP Server (cli/spaceship-server.js)

**Protocol:** JSON-RPC 2.0  
**Transport:** stdio (stdin/stdout)  
**Invocation:**
```bash
node /home/p31/P31-local-workspace/cli/spaceship-server.js
```

### 2.1 Tools

#### `duna_status`
Get the current DUNA docking status.

**Input Schema:**
```json
{}
```

**Output:**
```json
{
  "dockedPorts": 3,
  "memberCount": 5,
  "target": 100,
  "coherence": 0.72
}
```

**Errors:**
- `"code": -32600` — Invalid request.
- `"code": -32603` — Internal error (state file not found).

---

#### `system_health`
Get system health metrics.

**Input Schema:**
```json
{}
```

**Output:**
```json
{
  "coherence": 0.72,
  "noise": 0.28,
  "meshHealth": 0.95,
  "relayLatency": 42,
  "timestamp": "2026-08-08T14:30:00Z"
}
```

---

#### `dome_structure`
Get dome geometry metadata.

**Input Schema:**
```json
{}
```

**Output:**
```json
{
  "layers": 4,
  "mode": "docking-dome",
  "radius": 12,
  "innerRadius": 2.5,
  "outerEdges": 480,
  "ports": 120,
  "neoPixelSegments": 9600,
  "tetraFrame": 6,
  "innerDome": true,
  "vertexCount": 642,
  "faceCount": 320
}
```

---

#### `neo_pixel_control`
Set NeoPixel animation mode, speed, color, and brightness.

**Input Schema:**
```json
{
  "mode": "rainbow",
  "speed": 5,
  "color": "#22d3ee",
  "brightness": 80
}
```

**Valid modes:**
- `"rainbow"` — full spectrum sweep
- `"chase"` — chasing animation
- `"solid"` — static color
- `"breath"` — pulse brightness
- `"gradient"` — smooth blend between two colors (uses `ledColors` palette)
- `"dual-chase"` — chase with two colors
- `"off"` — all pixels off

**Parameters:**
- `speed` — [0, 10] (default 5)
- `brightness` — [0, 100] (default 80)
- `color` — hex color string (default `"#22d3ee"`)

**Output:**
```json
{
  "status": "ok",
  "mode": "rainbow",
  "speed": 5,
  "brightness": 80,
  "updatedAt": "2026-08-08T14:30:00Z"
}
```

**Pricing:**
- **$0.01 per call** via x402 gateway (`mcp-x402-gateway.trimtab-signal.workers.dev`).
- Free when called directly via stdio.

---

## 3. Worker HTTP Endpoints

**Base URL:** `https://spaceship-relay.trimtab-signal.workers.dev` or `https://spaceship-earth.pages.dev/api`  
**Authentication:** Ed25519 signature (optional for state mutations)

### 3.1 Session Management

#### `POST /session/start`
Initiate a new session.

**Request:**
```json
{
  "userId": "did:key:...",
  "userAgent": "Mozilla/5.0...",
  "ipAddress": "203.0.113.0"
}
```

**Response:**
```json
{
  "status": "ok",
  "sessionId": "sess_1234567890",
  "expiresAt": "2026-08-08T15:30:00Z"
}
```

---

#### `POST /session/heartbeat`
Keep a session alive.

**Request:**
```json
{
  "sessionId": "sess_1234567890"
}
```

**Response:**
```json
{
  "status": "ok",
  "expiresAt": "2026-08-08T15:35:00Z"
}
```

---

#### `POST /session/end`
End a session.

**Request:**
```json
{
  "sessionId": "sess_1234567890"
}
```

**Response:**
```json
{
  "status": "ok"
}
```

---

### 3.2 State Sync

#### `GET /state/:did`
Fetch the current state for a DID.

**Parameters:**
- `did` — DID key identifier (required)

**Response (200):**
```json
{
  "status": "ok",
  "data": {
    "spoons": 4,
    "coherence": 0.72,
    "engagement": 6,
    "didKey": "did:key:...",
    "viewMode": "cockpit"
  }
}
```

**Response (404):**
```json
{
  "status": "error",
  "message": "State not found for DID"
}
```

---

#### `POST /state/:did`
Push state updates (requires Ed25519 signature).

**Request:**
```json
{
  "state": {
    "spoons": 5,
    "coherence": 0.78,
    "engagement": 7
  },
  "signature": "base64_ed25519_signature",
  "nonce": "unique_request_id"
}
```

**Response:**
```json
{
  "status": "ok",
  "synced": true,
  "timestamp": "2026-08-08T14:30:00Z"
}
```

**Errors:**
- `400` — Invalid signature or state schema.
- `401` — Missing or expired session.
- `409` — State conflict (replay attack detected).

---

### 3.3 WebRTC Signaling

#### `WebSocket /ws/signal?room=<roomId>`
Establish a WebRTC signaling channel.

**Protocol:** y-webrtc signaling (SDP offers/answers, ICE candidates)

**Message format:**
```json
{
  "type": "offer|answer|candidate",
  "data": { "sdp": "...", "candidate": "..." }
}
```

**Room naming:** `spaceship-earth:${sessionId}` (recommended)

---

## 4. WebMCP (Browser API)

**Protocol:** Chrome Origin Trial (expires 2026-11-16)  
**Availability:** Chrome 149–156 (experimental)  
**Tokens:** `p31ca.org`, `phosphorus31.org`

### 4.1 Tools

#### `duna_status`
Identical to MCP server, callable via browser.

```javascript
const result = await navigator.modelContext.callTool('duna_status', {});
```

---

#### `duna_set_target`
Set the DUNA docking target.

**Input:**
```json
{
  "target": 150
}
```

**Output:**
```json
{
  "status": "ok",
  "newTarget": 150
}
```

---

### 4.2 Globals

```javascript
// Registered tools
window.__p31MCPTools      // Array of tool names
window.__p31MCPExec       // (name, args) => Promise<result>

// Dome state
window.__p31_domeStructure  // { layers, radius, ports, ... }
window.__p31_ship           // { spoons, coherence, engagement, ... }
window.__p31_led            // { mode, speed, color, brightness, ... }
```

---

## 5. Error Handling

### Standard Error Response (MCP/HTTP)

```json
{
  "error": {
    "code": -32603,
    "message": "Internal server error",
    "data": {
      "context": "Failed to fetch dome structure",
      "timestamp": "2026-08-08T14:30:00Z"
    }
  }
}
```

### Common Codes

| Code | Meaning |
|------|---------|
| `-32600` | Invalid Request |
| `-32601` | Method not found |
| `-32602` | Invalid params |
| `-32603` | Internal error |
| `-32700` | Parse error |

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `400` | Bad request (invalid params or schema) |
| `401` | Unauthorized (missing/expired session) |
| `404` | Not found (state, session, or resource) |
| `409` | Conflict (replay attack, nonce reuse) |
| `500` | Internal server error |

---

## 6. Rate Limiting

### MCP Server (stdio)
- **No rate limit** (stdio-based, local only).

### HTTP Endpoints
- **Session routes:** 10 req/min per IP.
- **State routes:** 5 req/min per DID.
- **Signaling:** 60 req/min per room.

Exceeding limits returns `429 Too Many Requests`.

---

## 7. Authentication & Security

### Session Tokens
- **Format:** `sess_` + random 16 bytes (base64).
- **TTL:** 1 hour (refreshed on heartbeat).
- **Storage:** Browser localStorage, Worker KV.

### State Mutations
- **Signature required:** Ed25519.
- **Message format:** `state|nonce|timestamp` (canonical JSON).
- **Verification:** `lib/identity.ts` `verifySignature()`.

### CORS
- **Allowed origins:** `p31ca.org`, `phosphorus31.org`, `spaceship-earth.pages.dev`.
- **Methods:** GET, POST, OPTIONS.
- **Headers:** `Content-Type: application/json`, `Authorization: Bearer <token>`.

---

## 8. Examples

### Example 1: Get DUNA Status (MCP)

```bash
cat <<'EOF' | node cli/spaceship-server.js
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "duna_status",
  "params": {}
}
EOF
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "dockedPorts": 3,
    "memberCount": 5,
    "target": 100,
    "coherence": 0.72
  }
}
```

---

### Example 2: Set NeoPixel Mode (MCP)

```bash
cat <<'EOF' | node cli/spaceship-server.js
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "neo_pixel_control",
  "params": {
    "mode": "gradient",
    "speed": 7,
    "brightness": 90
  }
}
EOF
```

---

### Example 3: Get State via HTTP

```bash
curl -s https://spaceship-relay.trimtab-signal.workers.dev/state/did:key:z6Mkf... \
  -H "Authorization: Bearer sess_1234567890"
```

---

### Example 4: Browser WebMCP Call

```javascript
// Check if WebMCP is available
if (navigator.modelContext) {
  const status = await navigator.modelContext.callTool('duna_status', {});
  console.log('DUNA status:', status);
} else {
  console.log('WebMCP not available (requires Chrome 149+)');
}
```

---

## 9. Changelog

### v1.1.0 (2026-08-08)
- ✅ Engine layer implemented; all MCP tools functional.
- ✅ WebRTC signaling endpoint added.
- ✅ State persistence with Ed25519 signatures.

### v1.0.0 (2026-07-16)
- Initial release; dome + HUD infrastructure.

---

**Maintainer:** P31 Labs — trimtab-signal  
**Support:** [GitHub Issues](https://github.com/p31labs/P31-local-workspace/issues)  
**License:** MIT
