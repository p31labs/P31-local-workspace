# MCP Server Publishing Checklist — Priority 5

## Summary

| Server | Metadata | Endpoint | Status |
|--------|----------|----------|--------|
| p31-design-mcp | ✅ Valid | `https://p31-design-mcp.trimtab-signal.workers.dev/mcp` → 405 (expected for GET without MCP headers) | ✅ Ready |
| p31-crypto-mcp | ✅ Valid | `https://p31-crypto-mcp.trimtab-signal.workers.dev/mcp` → 200 | ✅ Ready |
| server-card.json | ✅ Valid | `https://p31-shell.trimtab-signal.workers.dev/.well-known/mcp/server-card.json` → 200 | ✅ Ready |

Both `server.json` files contain all required fields: `name`, `description`, `version`, `repository`, `homepage`, `keywords`, `transport`, `endpoint`.

---

## Prerequisites

- [ ] **Smithery account** — Sign up at https://smithery.ai (required for Smithery registry)
- [ ] **GitHub repo visibility** — `p31labs/andromeda` must be public (currently appears public)
- [ ] **npm account** — Optional, if publishing as npm packages
- [ ] **GitHub account** — Required for official MCP registry PR submission
- [ ] **Smithery CLI** — Install: `npm install -g smithery` (currently **NOT installed**)
- [ ] **mcp-submit CLI** — Install: `npm install -g mcp-submit` (currently **NOT installed**)
- [ ] **MCP server credentials** — No auth required (both servers are public/unauthenticated)

---

## Step-by-Step Publishing Commands

### Option A: Smithery Registry (smithery.ai)

Smithery is the primary MCP registry (12,000+ servers). CLI is **not yet installed**.

```bash
# 1. Install Smithery CLI
npm install -g smithery

# 2. Authenticate
smithery login

# 3. Publish p31-design-mcp
smithery publish \
  --url "https://p31-design-mcp.trimtab-signal.workers.dev/mcp" \
  --name "p31labs/design-mcp"

# 4. Publish p31-crypto-mcp
smithery publish \
  --url "https://p31-crypto-mcp.trimtab-signal.workers.dev/mcp" \
  --name "p31labs/crypto-mcp"
```

**Notes:**
- The `--name` flag sets the Smithery slug (format: `org/name`)
- Smithery reads `server.json` from the worker directory; metadata fields are sourced from there
- If the CLI has a different flag for `server.json` path, use: `smithery publish --config /path/to/server.json`

### Option B: Official MCP Registry (modelcontextprotocol.io)

```bash
# 1. Fork the registry repo
git clone https://github.com/modelcontextprotocol/registry.git
cd registry

# 2. Create entries using the server.json files
# Add entries to the registry index (format varies — check repo CONTRIBUTING.md)

# 3. Submit a PR
git checkout -b add-p31-design-mcp
# Add server entry for p31-design-mcp using:
#   /home/p31/P31-local-workspace/workers/design-mcp/server.json
git add .
git commit -m "Add p31-design-mcp to registry"
git push origin add-p31-design-mcp

# Repeat for p31-crypto-mcp
git checkout main
git checkout -b add-p31-crypto-mcp
# Add server entry for p31-crypto-mcp using:
#   /home/p31/P31-local-workspace/workers/p31-crypto-mcp/server.json
git add .
git commit -m "Add p31-crypto-mcp to registry"
git push origin add-p31-crypto-mcp

# 4. Open PRs at:
# https://github.com/modelcontextprotocol/registry/pulls
```

### Option C: mcp-submit Tool

```bash
# 1. Install mcp-submit
npm install -g mcp-submit

# 2. Submit p31-design-mcp
mcp-submit \
  --url "https://p31-design-mcp.trimtab-signal.workers.dev/mcp" \
  --name "p31-design-mcp" \
  --transport "streamable-http"

# 3. Submit p31-crypto-mcp
mcp-submit \
  --url "https://p31-crypto-mcp.trimtab-signal.workers.dev/mcp" \
  --name "p31-crypto-mcp" \
  --transport "streamable-http"
```

### Option D: MCPFind (mcpfind.org)

```bash
# Submit via web form at:
# https://mcpfind.org/submit

# Or create a GitHub issue at:
# https://github.com/edgecast/mcpfind/issues/new
```

### Option E: One-liner via existing script

```bash
bash /home/p31/P31-local-workspace/scripts/publish-mcp.sh all
```

> The existing `publish-mcp.sh` prints commands but does not execute them automatically. It shows the exact commands above.

---

## Verification Steps

```bash
# 1. Verify server metadata locally
cat /home/p31/P31-local-workspace/workers/design-mcp/server.json | jq .
cat /home/p31/P31-local-workspace/workers/p31-crypto-mcp/server.json | jq .

# 2. Verify endpoints are reachable
curl -sS -o /dev/null -w "%{http_code}" \
  https://p31-design-mcp.trimtab-signal.workers.dev/mcp
# Expected: 200 (with proper MCP headers), 405 without

curl -sS -o /dev/null -w "%{http_code}" \
  https://p31-crypto-mcp.trimtab-signal.workers.dev/mcp
# Expected: 200

# 3. Verify server-card.json
curl -sS https://p31-shell.trimtab-signal.workers.dev/.well-known/mcp/server-card.json | jq .

# 4. Verify MCP tool listing (crypto-mcp returns 200 for GET)
curl -sS https://p31-crypto-mcp.trimtab-signal.workers.dev/mcp | jq .

# 5. Post-publish: check Smithery listing
# Visit: https://smithery.ai/server/p31labs/design-mcp
# Visit: https://smithery.ai/server/p31labs/crypto-mcp

# 6. Post-publish: check official registry
# Visit: https://registry.modelcontextprotocol.io
# Search for "p31-design-mcp" and "p31-crypto-mcp"
```

---

## Known Issues and Workarounds

| Issue | Workaround |
|-------|-----------|
| `smithery` CLI not installed | `npm install -g smithery` (may require Node.js 18+) |
| `mcp-submit` CLI not installed | `npm install -g mcp-submit` (may require Node.js 18+) |
| `design-mcp` returns 405 on GET | Normal behavior — this server requires POST with MCP JSON-RPC headers. Test with a proper MCP client or the crypto-mcp endpoint which returns 200 on GET (SSE stream) |
| `npm install -g` may fail on restricted environments | Use `npx smithery` or `npx mcp-submit` instead |
| GitHub repo must be public for registry listing | Verify at https://github.com/p31labs/andromeda/settings |
| Official registry requires PR review | Can take 1-7 days; Smithery is faster for initial listing |
| No auth on MCP endpoints | Both servers are currently public. If auth is added later, update `server.json` and re-publish |
| `server-card.json` description differs from `server.json` | Minor — card has shortened descriptions. Consider syncing |

---

## Files Referenced

- `/home/p31/P31-local-workspace/workers/design-mcp/server.json` — Design MCP metadata
- `/home/p31/P31-local-workspace/workers/p31-crypto-mcp/server.json` — Crypto MCP metadata
- `/home/p31/production/shell/public/.well-known/mcp/server-card.json` — Shell discovery card
- `/home/p31/P31-local-workspace/scripts/publish-mcp.sh` — Publishing script (prints commands)

---

## Status

- **Ready to publish:** ✅ Both servers are live, metadata is valid, endpoints are reachable
- **Blocking:** ❌ No publishing CLI installed (smithery, mcp-submit)
- **Next action:** Install `smithery` CLI, authenticate, run publish commands
- **Do NOT publish without:** Account credentials (Smithery login, GitHub access for official registry)
