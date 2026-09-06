# MCP 2026-07-28 migration checklist

**Target:** `/home/p31/P31-local-workspace/workers`  
**Result:** 7 error(s) · 0 warning(s) · 7 file(s)

- **error** — removed in 2026-07-28; breaking against a final-spec server.
- **warning** — deprecated; still works. Earliest removal varies by feature — at least 12 months for most, shorter for some (e.g. HTTP+SSE); see the linked SEP.

## Findings

| | Location | Feature | Rule | SEP |
|---|---|---|---|---|
| 🔴 | `bros/src/index.ts:374` | initialize / notifications/initialized handshake | `mcp-2575-initialize` | SEP-2575 |
| 🔴 | `component-registry/src/index.ts:106` | initialize / notifications/initialized handshake | `mcp-2575-initialize` | SEP-2575 |
| 🔴 | `dads/src/index.ts:426` | initialize / notifications/initialized handshake | `mcp-2575-initialize` | SEP-2575 |
| 🔴 | `marketplace-mcp/src/index.ts:386` | initialize / notifications/initialized handshake | `mcp-2575-initialize` | SEP-2575 |
| 🔴 | `p31-crypto-mcp/src/index.ts:100` | initialize / notifications/initialized handshake | `mcp-2575-initialize` | SEP-2575 |
| 🔴 | `p31-justice-hub/src/index.ts:414` | initialize / notifications/initialized handshake | `mcp-2575-initialize` | SEP-2575 |
| 🔴 | `swarm-router/src/index.ts:8` | Mcp-Session-Id header / protocol-level sessions | `mcp-2567-session-id` | SEP-2567 |

## How to fix

### 🔴 initialize / notifications/initialized handshake `mcp-2575-initialize`

MCP is now stateless: the initialize / notifications/initialized handshake is removed. ([SEP-2575](https://modelcontextprotocol.io/specification/draft/changelog))

**Migrate:** Carry protocol version, client identity, and capabilities in _meta on every request (io.modelcontextprotocol/protocolVersion, /clientInfo, /clientCapabilities). Servers MUST implement server/discover for capability negotiation (clients MAY call it); version mismatches return UnsupportedProtocolVersionError.

### 🔴 Mcp-Session-Id header / protocol-level sessions `mcp-2567-session-id`

Protocol-level sessions and the Mcp-Session-Id header are removed from the Streamable HTTP transport. ([SEP-2567](https://modelcontextprotocol.io/specification/draft/changelog))

**Migrate:** Use explicit, server-minted handles (e.g. a task handle or session token returned by a tool) passed back as ordinary tool arguments on later calls. Do not rely on per-connection server state.

## Manual review (no reliable static signature)

- [ ] **All results must carry a resultType field** (SEP-2322) — Servers MUST include resultType ("complete" or "input_required") on every result. Clients MUST treat results from earlier-protocol servers that omit it as "complete".
- [ ] **Servers MUST implement server/discover** (SEP-2575) — server/discover advertises supported protocol versions, capabilities, and identity. Clients may call it for up-front version selection or as a STDIO backward-compat probe.
- [ ] **List/read results must carry ttlMs and cacheScope (CacheableResult)** (SEP-2549) — tools/list, prompts/list, resources/list, resources/read, and resources/templates/list must return ttlMs (freshness hint) and cacheScope ("public"|"private").
- [ ] **Streamable HTTP POST requires Mcp-Method and Mcp-Name headers** (SEP-2243) — Add the standard Mcp-Method and Mcp-Name headers on Streamable HTTP POST requests; custom headers from tool parameters use x-mcp-header.
- [ ] **Error code renumbering** (2026-07-28 RC) — HeaderMismatch -32001 -> -32020, MissingRequiredClientCapability -32003 -> -32021, UnsupportedProtocolVersion -32004 -> -32022. Range -32020..-32099 is now reserved for the MCP spec. (The -32002 resource-not-found code is separately changed to -32602 — see the mcp-2164-error-32002 rule.)
- [ ] **OAuth 2.0 Dynamic Client Registration (RFC 7591) is deprecated** (PR #2858) — Prefer Client ID Metadata Documents for client registration. DCR remains for backward compatibility with authorization servers that do not support CIMD.
