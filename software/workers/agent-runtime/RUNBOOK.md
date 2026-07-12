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
`addMcpServer("spike-land", url, {transport:{headers}})` is wired in `onStart()`,
feature-flagged behind:
- `ENABLE_SPIKE_LAND` (`[vars]`, default `"false"`)
- `SPIKE_LAND_MCP_URL` (`[vars]`, default `https://spike.land/mcp`)
- `SPIKE_LAND_API_KEY` (`wrangler secret put` when enabling)

The Spike Land endpoint is auth-gated/unverified (`spike.land/mcp` → 401); the
wiring stays disabled until the endpoint + auth scheme are confirmed.

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
