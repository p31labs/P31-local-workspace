# canon-mcp — HTTP surface runbook

The Loom's MCP server has two transports sharing one tool registry
(`createServer()` in `src/server.ts`): **stdio** for local agents, and
**streamable HTTP** for edge services (the builders, the shell).

## Start the HTTP surface

```bash
cd packages/canon-mcp
pnpm start:http        # listens on 0.0.0.0:5192 (PORT= to override)
```

It runs in stateless mode (no session) with JSON responses, so a Cloudflare
Worker can poll it with plain POST request/response — no SSE to hold open.

## Expose it publicly

The Tunnel already runs (`p31-mission-control`). Its ingress maps
`loom.p31ca.org → localhost:5192`. If the hostname is not live yet, add the
DNS route once:

```bash
cloudflared tunnel route dns p31-mission-control loom.p31ca.org
```

Then reload the tunnel so the new ingress takes effect:

```bash
sudo systemctl restart cloudflared   # or: kill -HUP <cloudflared pid>
```

## Verify

```bash
curl -s -X POST https://loom.p31ca.org \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

Expect `list_components`, `get_contract`, `validate_props`, `list_tokens`,
and the six `loom_*` tools.

## Honest limitation

`loom.p31ca.org` returns 502 when nothing is listening on `localhost:5192`.
The tunnel daemon is durable; the Loom process is not. This is a **pilot** on
Will's machine — fine for him, not a production promise. Move to Fly.io (or a
VPS) after the builder loop is proven (Move A4). Same Node process, no code
change, real uptime.
