# MCP Server Publishing Guide — P31 Servers

## Registry Status

| Registry | Status | URL |
|----------|--------|-----|
| **Smithery** | ✅ Published | https://smithery.ai/server/trimtab-signal/design-mcp |
| **Smithery** | ✅ Published | https://smithery.ai/server/trimtab-signal/crypto-mcp |
| **Glama** | ⏳ Pending manual submission | https://glama.ai/mcp/servers/submit |
| **Official AAIF Registry** | ⏳ Pending PR | https://registry.modelcontextprotocol.io |

## Servers

| Server | Endpoint | Tools | Auth |
|--------|----------|-------|------|
| `p31-design-mcp` | https://p31-design-mcp.trimtab-signal.workers.dev/mcp | 36 | None |
| `p31-crypto-mcp` | https://p31-crypto-mcp.trimtab-signal.workers.dev/mcp | 12 | None |

## Commands & Scripts

### Smithery (already published)

```bash
smithery publish \
  --url "https://p31-design-mcp.trimtab-signal.workers.dev/mcp" \
  --name "trimtab-signal/design-mcp"

smithery publish \
  --url "https://p31-crypto-mcp.trimtab-signal.workers.dev/mcp" \
  --name "trimtab-signal/crypto-mcp"
```

Smithery API key: `60086181-6030-4492-8a38-01375b336783`

### Glama

Generate submission payload and manual steps:

```bash
node scripts/submit-glama.mjs
```

This reads `server.json` and extracts tools from `src/index.ts`, then prints:
- The JSON payload for Glama's API (if available)
- Manual web-form submission steps
- `curl` command for API submission

**Manual steps:**
1. Open https://glama.ai/mcp/servers/submit
2. Fill in name, description, endpoint URL, transport type
3. Add tools list (script outputs the full list)
4. Submit the form

### Official AAIF Registry

Generate PR-ready JSON entries and workflow:

```bash
node scripts/submit-official-registry.mjs
```

This prints:
- The JSON entry for each server
- Step-by-step fork-and-PR workflow
- Ready-to-paste PR description

**Workflow:**
1. Fork https://github.com/modelcontextprotocol/registry
2. Clone and create a branch: `git checkout -b add-p31-design-mcp`
3. Add the generated JSON entry to the registry index
4. Commit, push, and open a PR

## Verification Steps

```bash
# Verify endpoints are reachable
curl -sS -o /dev/null -w "%{http_code}" \
  https://p31-design-mcp.trimtab-signal.workers.dev/mcp
# Expected: 200 (with MCP headers) or 405 (GET without headers)

curl -sS -o /dev/null -w "%{http_code}" \
  https://p31-crypto-mcp.trimtab-signal.workers.dev/mcp
# Expected: 200

# Verify tool listing (crypto-mcp returns 200 for GET)
curl -sS https://p31-crypto-mcp.trimtab-signal.workers.dev/mcp | jq .

# Verify metadata files
cat workers/design-mcp/server.json | jq .
cat workers/p31-crypto-mcp/server.json | jq .

# Post-publish: check listings
# https://smithery.ai/server/trimtab-signal/design-mcp
# https://smithery.ai/server/trimtab-signal/crypto-mcp
# https://glama.ai/mcp/servers/p31-design-mcp
# https://registry.modelcontextprotocol.io
```

## Known Issues

| Issue | Workaround |
|-------|------------|
| `design-mcp` returns 405 on GET without MCP headers | Normal behavior — requires POST with JSON-RPC body. Test with a proper MCP client. |
| `crypto-mcp` returns 200 on GET (SSE stream) | Expected — this server supports SSE notification stream per 2025-06-18 spec. |
| Glama uses web form, no public API | Use `submit-glama.mjs` to generate payload, then paste manually. |
| Official registry requires PR review | Can take 1-7 days. Smithery is faster for initial listing. |
| No auth on MCP endpoints | Both servers are public. If auth is added later, update `server.json` and re-publish. |
| GitHub repo must be public | Verify at https://github.com/p31labs/andromeda/settings |

## Files

- `workers/design-mcp/server.json` — Design MCP metadata
- `workers/p31-crypto-mcp/server.json` — Crypto MCP metadata
- `scripts/submit-glama.mjs` — Glama submission generator
- `scripts/submit-official-registry.mjs` — Official registry PR generator
- `scripts/MCP-PUBLISHING.md` — This file
