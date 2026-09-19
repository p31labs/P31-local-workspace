# Brief: subscriptions/listen for the canvas

**Status:** Deferred. Not built this round.
**Trigger:** a non-browser consumer of the event stream.

## Why deferred

`canon-mcp` runs `serveStdio` — no HTTP surface. The canvas is a browser, not
an MCP client; it talks to the Vite dev middleware over HTTP/SSE. Adding
`subscriptions/listen` requires three server-side changes (streamable HTTP
transport, log registered as a resource, `ResourceUpdatedNotification`
emission) plus one middleware-side change, all for one consumer.

## Two escalating fixes

### Small — multiple browser tabs (~30 min)

The middleware opens one `setInterval` per SSE connection; N tabs = N timers
reading the same file. Fix: one shared poll across all connected clients in
`vite.config.ts`. Not `subscriptions/listen`.

### Large — a second application (~1 day)

A second app, external monitor, or another agent's tool surface needs the same
stream. Fix: the middleware opens one `subscriptions/listen` stream to
`canon-mcp` and fans out to N browser SSE clients. Browser unchanged.

Implementation when triggered:

- `canon-mcp/src/server.ts`: add `WebStandardStreamableHTTPServerTransport`
  alongside `serveStdio`; register `file://<logPath>` as a resource; emit
  `ResourceUpdatedNotification` after each `commit()`.
- `apps/loom/vite.config.ts`: replace `fs.watch` + interval with an MCP client
  that opens one subscription and re-reads the log on notification.
- Substrate: no change.

## Spec references

- 2026-07-28 replaced `resources/subscribe` and the HTTP GET endpoint with a
  single long-lived `subscriptions/listen` POST-response stream.
- Server must send `notifications/subscriptions/acknowledged` first.
- Every subsequent notification carries
  `io.modelcontextprotocol/subscriptionId` in `_meta` (the JSON-RPC request id
  of the `subscriptions/listen` that opened the stream).
- The notification carries the URI, not the content. The proxy still calls
  `readEvents()` after each notification.
