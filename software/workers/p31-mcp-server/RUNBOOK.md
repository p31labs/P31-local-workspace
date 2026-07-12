# p31-mcp-server — RUNBOOK

**Service:** `p31-mcp-server.trimtab-signal.workers.dev`
**Repo:** `software/workers/p31-mcp-server`
**Built on:** `agents/mcp` → `createMcpHandler` + MCP SDK `McpServer` (`agents@0.17.3`, `@modelcontextprotocol/sdk@1.29.0`)

## Purpose (CWP-2026-017 B)
Native MCP front door exposing P31's 9 tools to any MCP client (Claude, Cursor,
…). Also serves as the fallback for the Spike Land MCP integration.

## Exposed tools
`oasis_execute, phos_adopt, jitterbug_run, phos_learn, phos_deploy, phos_watch,
healer_remediate, bus_emit, phos_rollback`.

## Routing
A fresh `McpServer` is built per request (so each tool handler closes over its own
`env`). Each `tools/call` forwards an MCP `tools/call` to `mcp-x402-gateway`'s
`/mcp` (the L3.4 bridge front door) via the `GATEWAY` service binding — the same
backend the orchestrator uses for non-builtin tools. No new execution surface is
introduced.

## Required wrangler config
- `compatibility_flags = ["nodejs_compat"]`
- `[[services]] GATEWAY → mcp-x402-gateway`

## Endpoints
| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | liveness → lists the 9 tools |
| POST | `/mcp` | MCP Streamable HTTP (initialize / tools/list / tools/call) |

## Test with an MCP client
Point any MCP Streamable-HTTP client at:
```
https://p31-mcp-server.trimtab-signal.workers.dev/mcp
```

## Verify (raw HTTP)
```
curl https://p31-mcp-server.trimtab-signal.workers.dev/health

curl -X POST https://p31-mcp-server.trimtab-signal.workers.dev/mcp \
  -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'

curl -X POST https://p31-mcp-server.trimtab-signal.workers.dev/mcp \
  -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
```

## Deploy
```
cd software/workers/p31-mcp-server
npx wrangler deploy
```

## Rollback
`wrangler rollback`.
