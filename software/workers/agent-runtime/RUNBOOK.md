# agent-runtime — RUNBOOK

**Service:** `agent-runtime.trimtab-signal.workers.dev`
**Built on:** Cloudflare Agents SDK `agents@0.17.3`
**Repo:** `software/workers/agent-runtime`

## Purpose
Durable tool runtime for the P31 agent ecosystem. The `Agent` class is retained
for durable per-instance state + D1 `sql` + scheduling (later care-mesh work),
but v1 built-in tools are served directly from the Worker entry `fetch` —
`routeAgentRequest` only dispatches agent-protocol requests, so plain HTTP tool
paths must be handled in `fetch` (fall through to `routeAgentRequest` last).

## Required wrangler config
- `compatibility_flags = ["nodejs_compat"]` (Agents SDK pulls node built-ins)
- `[[durable_objects.bindings]]` → `AgentRuntime` (class `AgentRuntime`)
- `[[migrations]] new_sqlite_classes = ["AgentRuntime"]`
- `[[services]] LOVE_LEDGER → love-ledger` (care-score / balance lookups)

## Endpoints
| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | liveness → `{"status":"ok","service":"agent-runtime"}` |
| POST | `/tool/send_notification` | Telegram notification (raw Bot API) |
| POST | `/tool/generate_care_report` | love-ledger care report |

## v1 built-in tools (orchestrator routes these via `AGENT_RUNTIME` binding)
- `send_notification` — Telegram only. Needs `TELEGRAM_BOT_TOKEN` (`wrangler secret put`).
  Returns graceful 500 if unset. did→chat_id is 1:1 for now.
- `generate_care_report` — queries love-ledger `/care-score` + `/balance`.

## Spike Land MCP (CWP-2026-016 C) — staged, OFF by default
`addMcpServer("spike-land", url, {transport:{headers:{Authorization: Bearer …}}})`
is wired in `onStart()`, feature-flagged behind:
- `ENABLE_SPIKE_LAND` (`[vars]`, default `"false"`)
- `SPIKE_LAND_MCP_URL` (`[vars]`, default `https://mcp.spike.land/mcp`)
- `SPIKE_LAND_API_KEY` (`wrangler secret put` when enabling)

**Endpoint discovered 2026-07-12 (CWP-2026-018 D):** the hosted MCP server is
**`https://mcp.spike.land/mcp`** (Streamable HTTP MCP). It is auth-gated:
`initialize` returns 401 without a `Bearer` token. Accepted tokens:
- Spike Land API key `sk_...` — create at `https://spike.land/settings?tab=api-keys`
- OAuth 2.1 access token `mcp_...` — device flow at `https://mcp.spike.land/oauth/device`
Resource metadata: `https://mcp.spike.land/.well-known/oauth-protected-resource/mcp`.

**To enable:** obtain a Spike Land API key, then:
```
cd software/workers/agent-runtime
wrangler variable put ENABLE_SPIKE_LAND true
wrangler secret put SPIKE_LAND_API_KEY   # paste the sk_... key
```
The `onStart()` wiring passes the key as `Authorization: Bearer <key>`, matching
the discovered auth scheme. (Earlier guesses `spike.land/mcp` / `api.spike.land/mcp`
were wrong — those are not the MCP host.)

## Deploy
```
cd software/workers/agent-runtime
npx wrangler deploy
```

## Verify
```
curl https://agent-runtime.trimtab-signal.workers.dev/health
```

## Rollback
`wrangler rollback` (or pin a known-good version id).
