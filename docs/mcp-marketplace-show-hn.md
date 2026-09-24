# Show HN: I built a governed MCP marketplace from an island in Georgia

> Draft for the Show HN post. Claims verified 2026-09-24: the three bug findings
> were reproduced against live systems (mcp-publisher validate, the MCP SDK
> client, and the Durable Object ledger). Post to HN as a text post, Tues–Thu,
> ~8–9am ET. Be in the comments within five minutes.

---

I spent 16 years as a Navy engineering technician on submarines. I retired,
moved to an island in southeast Georgia, and last year started reading about
MCP. This is what I built and what I learned.

**The problem.** Every MCP directory I looked at was a list of links. No health
checks. No way to know if a server was alive. No way to see what a tool
actually did before you called it. No audit trail of what got called. In the
submarine world we don't ship a system that trusts the operator to remember to
check. We ship a system where checking is baked in and forgetting is
impossible.

So I built the marketplace as if it needed to survive an inspection.

**What it does.**

- Live health probes on every server, cached and re-verified
- Full tool schemas pulled at probe time, so you see the real API before you call it
- A tool-poisoning scanner that runs on registration — instruction override, exfiltration sinks, credential grabs, invisible unicode, semantic mismatch between tool name and description
- Ed25519 signatures on every review decision
- A sanitized call proxy — size caps, command/URL sink detection, base64 bombs, binary magic
- A hash-chained, Ed25519-signed audit log of every proxied call
- A Durable Object-backed ledger so the chain can't fork
- RBAC — viewer, publisher, reviewer, admin
- An MCP-native surface, so an agent can `tools/list` and discover the marketplace itself via `list_servers` / `get_server` / `call_tool`

Concretely: calling `pqc_verify` with an external URL as an argument gets
rejected by the sanitizer, counted as a rejection, and logged to the audit
chain — you can see it happen in real time.

**Three bugs I found that I think the industry doesn't know yet.**

1. **The official MCP Registry is stdio-only.** `mcp-publisher validate`
   rejects `transport.type != "stdio"` in the packages block. Remote HTTP
   servers cannot be published there. This is not prominent in the docs, and
   it means the "publish once, federate everywhere" story only works for
   locally-installed servers. If you're running a remote MCP server, that
   registry is not for you, and no one tells you that until you try.

2. **Every real MCP client requires the JSON-RPC envelope.** My server
   returned bare result objects. My unit tests passed, because I was asserting
   against my own responses. Then I connected a real MCP SDK client and it
   failed on the first message. Smithery's introspector reported "No
   capabilities found." If you're building an MCP server and testing only
   against your own mocks, you probably have this bug. The fix is one line.
   Finding it requires a real client.

3. **Durable Object append failures leave permanent forked chains.** If a DO
   append throws transiently, the DO has a hole. My backfill only ran when
   `size() === 0`, so the next read skipped over the hole and served a forked
   chain as authoritative. The fix is to compare the DO head to the KV head on
   every read and replay the suffix. If your ledger isn't doing this
   comparison, you have a silent integrity bug — nothing will tell you, and the
   chain will still "verify" against itself.

**Why the background matters.** A submarine doesn't have a "try again later"
failure mode. If a system can fail silently, that's not a design choice — it's
a defect. Software governance in the LLM era is heading exactly toward this
standard: audit trails, tamper-evidence, non-repudiation, revocation. Most of
the industry is still discovering it needs these. I didn't have to discover
it. I came from a place that already knew.

**The honest state.** I don't have a team. I don't have a network. I don't
know anyone in the MCP space. I'm one person on an island with an AI as my
only collaborator, and I've been building this for a while now. What I want is
for people who actually use MCP servers to try it and tell me where it's
broken.

There's a daily digest script that tells me what's actually happening. Right
now it shows zero real traffic — every call in the audit log is one of mine.
That's the honest state.

If you've built an MCP server and want it in a catalog with live governance,
register it. The pipeline runs a real liveness probe and a tool-description
scanner, and it either passes or it doesn't.

- Marketplace: https://mcp.p31ca.org
- Registry API: https://mcp-registry.trimtab-signal.workers.dev
- Code: https://github.com/p31labs/P31-local-workspace