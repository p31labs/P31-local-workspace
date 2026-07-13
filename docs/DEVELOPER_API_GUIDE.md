# Developer API Guide

*For external integrators building on the P31 platform.*

All P31 Workers are Cloudflare Workers. This guide lists the public endpoints,
auth schemes, and integration patterns. Base hostnames:

| Worker | Host |
|---|---|
| love-ledger | `love-ledger.p31ca.org` |
| mcp-x402-gateway | `mcp-x402-gateway.trimtab-signal.workers.dev` |
| agent-runtime | `agent-runtime.trimtab-signal.workers.dev` |
| care-mesh | `care-mesh.trimtab-signal.workers.dev` |
| p31-mcp-server | `p31-mcp-server.trimtab-signal.workers.dev` |
| intent-resolver | `intent-resolver.trimtab-signal.workers.dev` |

---

## 1. LOVE ledger (accounts, care score, pilot registry)

### Auth
Write paths require a signed request. Approved write paths:
`/transfer`, `/stake`, `/care-score`, `/withdraw`, `/family/onboard`,
`/family/status`, `/llm/reserve`, `/llm/settle`, `/contract/*`.

### Endpoints
| Method | Path | Purpose |
|---|---|---|
| GET | `/care-score?did=` | Care score for a `did` |
| GET | `/balance?did=` | LOVE balance / staking / reputation |
| GET | `/chain` | Court-admissible SHA-256 hash chain |
| GET | `/export` | Export signed ledger records |
| POST | `/family/onboard` | Register a pilot family |
| PATCH | `/family/<did>/status` | Set status `pending`/`active`/`completed` |

**Onboard a family:**
```
curl -X POST https://love-ledger.p31ca.org/family/onboard \
  -H 'Content-Type: application/json' \
  -d '{"did":"<did>","family_name":"Example Family","nodes":["n1"]}'
# → {"success":true,"did":"<did>","status":"pending"}
```

---

## 2. agent-runtime (built-in tools)

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness |
| POST | `/tool/send_notification` | Notification (`{did, message, channel?, chat_id?}`) — `telegram` or `discord` |
| POST | `/tool/generate_care_report` | Care report (`{did, date_range?, format?}`) |

`send_notification` requires the worker to have `TELEGRAM_BOT_TOKEN` configured;
otherwise it returns a graceful `500`. `generate_care_report` calls love-ledger
internally (no caller auth beyond the request).

---

## 3. care-mesh (privacy-preserving care data)

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness |
| POST | `/submit` | Ed25519-signed care record |
| GET | `/aggregates?family_did=` | Own raw records |
| GET | `/mesh?family_did=` | Peer records with Laplace DP noise |

**Submit a signed record:**
```
canonical="<family_did>|<period_start>|<period_end>|<avg_spoons>|<care_event_count>|<care_score>"
signature=$(printf '%s' "$canonical" | openssl pkeyutl -sign -inkey key.pem -rawin | xxd -p)
pubkey=$(openssl pkey -pubin -in pub.pem -outform DER | tail -c 32 | xxd -p)

curl -X POST https://care-mesh.trimtab-signal.workers.dev/submit \
  -H 'Content-Type: application/json' \
  -d '{"family_did":"<did>","period_start":1,"period_end":2,"avg_spoons":3,
       "care_event_count":10,"care_score":0.7,
       "signature":"'"$signature"'","pubkey":"'"$pubkey"'"}'
# → {"ok":true}
```
The signature is an Ed25519 signature over the canonical string using the raw
32-byte public key (hex). `avg_spoons` in `/mesh` is perturbed with Laplace noise
(ε = 0.5, sensitivity = 5) and clamped to `[0,5]`.

---

## 4. mcp-x402-gateway (orchestrator + LOVE settlement)

| Method | Path | Purpose |
|---|---|---|
| POST | `/agent/run` | Natural-language intent → plan → tool execution |
| POST | `/mcp` | MCP front door to the L3.4 tool bridge |

**`/agent/run` (LOVE-path auth):** requires an HMAC-SHA256 proof over
`love:<timestamp>` using `LOVE_AUTH_SECRET`, with a 60s TTL. Timestamps are in
**milliseconds**.
```
SECRET=<LOVE_AUTH_SECRET>
TS=$(date +%s%3N)
MAC=$(printf 'love:%s' "$TS" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $NF}')
curl -X POST https://mcp-x402-gateway.trimtab-signal.workers.dev/agent/run \
  -H 'Content-Type: application/json' -H "X-DID: <did>" \
  -H "X-Love-Timestamp: $TS" -H "X-Love-Auth-MAC: $MAC" \
  -d '{"query":"generate a care report for <did>"}'
# → {"classifier":"glm","plan":[{"tool":"generate_care_report",...}],"ok":true,"contract_id":"..."}
```

---

## 5. p31-mcp-server (native MCP front door)

Exposes the 9 P31 tools via MCP Streamable HTTP:
`oasis_execute, phos_adopt, jitterbug_run, phos_learn, phos_deploy, phos_watch,
healer_remediate, bus_emit, phos_rollback`.

Point any MCP client at:
```
https://p31-mcp-server.trimtab-signal.workers.dev/mcp
```
Each `tools/call` is forwarded to the `mcp-x402-gateway` bridge, so the same
tools the orchestrator uses are available to external MCP clients.

**Raw MCP probe:**
```
curl -X POST https://p31-mcp-server.trimtab-signal.workers.dev/mcp \
  -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"x","version":"1"}}}'
curl -X POST https://p31-mcp-server.trimtab-signal.workers.dev/mcp \
  -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
```

---

## 6. intent-resolver (edge intent classification)

| Method | Path | Purpose |
|---|---|---|
| POST | `/intent` | Parse intent → Creation Quote |
| POST | `/classify` | Classify a prompt against a tool list (needle-rs) |
| GET | `/health` | Liveness |

---

## 7. Spike Land MCP (external, optional)

P31's `agent-runtime` can optionally federate with Spike Land's hosted MCP
registry (`https://mcp.spike.land/mcp`, Streamable HTTP, `Bearer` auth). This is
feature-flagged and **off by default**; it requires a Spike Land API key
(`sk_...`). See `software/workers/agent-runtime/RUNBOOK.md` for enablement.

---

## Integration patterns

- **Want a care report?** Call `agent-runtime /tool/generate_care_report` (or
  `mcp-x402-gateway /agent/run` with a natural-language query).
- **Want to run a P31 tool from your own agent?** Connect an MCP client to
  `p31-mcp-server.trimtab-signal.workers.dev/mcp`.
- **Want privacy-preserving cross-family care signal?** Submit signed records to
  `care-mesh` and read the noised `/mesh` view.
- **All calls are plain HTTPS** — no SDK required, though MCP clients work
  natively against `p31-mcp-server`.
