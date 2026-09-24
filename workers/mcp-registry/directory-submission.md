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