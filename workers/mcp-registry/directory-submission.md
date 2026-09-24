# P31 MCP Marketplace — directory submissions

The marketplace exposes an MCP-native surface (`/mcp`) + a server card at
`/.well-known/mcp/server-card.json`. Submit it to the directories below to get
discovered. These are manual account + submission forms — copy the fields here.

## Canonical card (served at /.well-known/mcp/server-card.json)
```
name:        p31-mcp-marketplace
version:     2.0.0
endpoint:    https://mcp-registry.trimtab-signal.workers.dev/mcp
transport:   streamable-http
homepage:    https://mcp.p31ca.org
repository:  https://github.com/p31labs/P31-local-workspace
license:     Apache-2.0
keywords:    mcp, marketplace, registry, sovereign, post-quantum
capabilities: tools (list_servers, get_server, call_tool)
```

## One-line summary (paste into most directories)
"A governed MCP marketplace: discover, inspect, and call MCP servers — live
health probes, full tool schemas, tool-poisoning scanner verdicts, Ed25519
review signatures, and a sanitized + audited call proxy. Agents discover it via
`list_servers` and invoke any registered tool via `call_tool`."

## Per-directory

### PulseMCP
- Title: `P31 MCP Marketplace`
- URL: `https://mcp.p31ca.org`
- Endpoint: `https://mcp-registry.trimtab-signal.workers.dev/mcp`
- Tags: marketplace, registry, governance, discovery

### mcp.so
- Name: `p31-mcp-marketplace`
- Link: `https://mcp.p31ca.org`
- API: `https://mcp-registry.trimtab-signal.workers.dev/mcp`
- Categories: AI, DevTools, Governance

### Smithery (register as a server)
- Name: `p31-mcp-marketplace`
- Transport: streamable-http
- URL: `https://mcp-registry.trimtab-signal.workers.dev/mcp`
- Description: same one-liner above.

### Glama
- Name: `p31-mcp-marketplace`
- Endpoint: `https://mcp-registry.trimtab-signal.workers.dev/mcp`
- Uses the served server-card for verification.

### Official MCP Registry (registry.modelcontextprotocol.io)
- Submits via the registry's GitHub-based review (modelcontextprotocol/registry).
- Server name: `org.p31ca/p31-mcp-marketplace`
- Endpoint: `https://mcp-registry.trimtab-signal.workers.dev/mcp`
- Include the server-card JSON + repository + license.

## Notes
- The `/mcp` surface requires no auth for `list_servers`/`get_server`; `call_tool`
  proxies read + write tools with sanitization, quotas, and audit (writes can be
  gated with `REQUIRE_AUTH_WRITE=1`).
- Some third-party servers exceed the 10s proxy timeout on cold start (grep.app
  first call) — surfaced as a clear error; retry usually succeeds. Bump the call
  timeout in `handleCall` if you want a longer budget.
## Verified (2026-09-24) — API keys cannot drive registration
Glama's MCP API (`https://glama.ai/api/mcp/v1/*`) is **read-only + telemetry**
(GET servers/connectors/instances, POST telemetry/usage). There is **no
registration endpoint** — the API key reads the directory, it does not publish.
Smithery has **no public registration API** — publishing is GitHub-linked
(smithery.yaml) or the "Add server" website flow.

Registration therefore goes through each site's **UI**, which fetches the
server-card from the URL you submit. The card + /mcp endpoint are verified live:

- Card: `https://mcp-registry.trimtab-signal.workers.dev/.well-known/mcp/server-card.json`
- MCP:  `https://mcp-registry.trimtab-signal.workers.dev/mcp` (SSE + initialize OK, CORS `*`)

## Submission URLs (paste the card URL in the UI)
- **Glama**: sign in → https://glama.ai/mcp → "Add server" → paste the card URL
- **Smithery**: sign in → https://smithery.ai/servers → "Add server by URL" → paste `https://mcp-registry.trimtab-signal.workers.dev/mcp`
- **PulseMCP**: https://www.pulsemcp.com/submit
- **mcp.so**: https://mcp.so/submit

## Verified remote-registration mechanics (2026-09-24)
- **Smithery CLI works** for remote URLs — but the **namespace must already exist**,
  and it's GitHub-account-linked (not created by the API key):
  `smithery mcp publish "https://mcp-registry.trimtab-signal.workers.dev/mcp" -n p31labs/mcp-marketplace`
  → 404 "Namespace not found" until `p31labs` exists (connect GitHub via `smithery auth login`).
- **Glama**: no registration API — "Add server" UI, or `glama.json` in the repo for auto-crawl (~24h).
- **mcp-submit**: detects the local npm package (stdio). Remote-HTTP servers use Smithery CLI
  for the URL publish; mcp-submit covers the package-based directories (official/MCPCentral/mcp.so/awesome lists).

## Discovery artifacts (live, verified)
- Server card at all well-known aliases: `/.well-known/mcp.json`, `/.well-known/mcp/server-card.json`,
  `/.well-known/mcp/server.json`, `/.well-known/mcp` (SEP-1649 + SEP-2127 fields: `$schema`, `protocolVersion`,
  `serverInfo`, `transport`, `capabilities`, `authentication.required`).
- ARD manifest: `/.well-known/ard.json` (mcp-server entry → server card).
- Glama: `glama.json` at repo root (maintainers: p31labs).
- Official registry: `server.json` (`io.github.p31labs/mcp-marketplace`) + `.github/workflows/publish-mcp.yml` (OIDC).
- CI sweep: `.github/workflows/mcp-distribution-sweep.yml` (mcp-submit + smithery CLI + ard-publish on `v*` tags).

## Namespace corrected (2026-09-24)
The Smithery/Glama/GitHub identity is **trimtab-signal**, not p31labs.
- Smithery: `trimtab-signal/mcp-marketplace` — **published successfully** (deployment PENDING).
- server.json namespace: `io.github.trimtab-signal/mcp-marketplace`.
- glama.json maintainers: `["trimtab-signal"]`.

## Verified 2026-09-24 (round 2)
- **Official MCP Registry is stdio-only**: the schema rejects `transport.type != "stdio"`
  in `packages`. Remote HTTP servers are NOT publishable there. Removed
  `server.json` + `publish-mcp.yml` (dead for a remote server).
- **Smithery published**: `trimtab-signal/mcp-marketplace` created, release accepted
  (deployment was PENDING — confirm the tool list renders in the Smithery UI).
- **ARD manifest** rebuilt with `ard-publish init` (canonical spec v1.0 shape):
  `/.well-known/ard.json` + `robots.txt` `Agentmap:` line. `ard-publish validate` = 0 errors.
  **Submitted + indexed** on Neuronto (`ard-publish submit`). Discovery audit:
  grade C 70/100 — Neuronto returns the domain; 5/6 registries not yet (propagation).
- **mcp-submit sweep removed from CI**: it detects the local npm package as stdio
  (wrong for a remote HTTP server). The sweep now does Smithery CLI publish + ARD submit only.
- Remaining: confirm Smithery deployment in the UI; GitHub Actions runners are blocked
  by the account's billing (nothing can run in CI until that's resolved).
