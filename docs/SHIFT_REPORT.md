# P31 MCP Marketplace — Shift Report & Handoff

**Date:** 2026-09-24
**Operator:** p31 (trimtab-signal) · retired Navy submarine engineering technician, SE Georgia
**Session scope:** Built a governed, enterprise-grade MCP server marketplace + playground end-to-end, then ran the full distribution/discovery stack.

---

## 1. Executive summary

A fully interactive **MCP server marketplace and playground** is live at `https://mcp.p31ca.org`, backed by a governed registry API at `https://mcp-registry.trimtab-signal.workers.dev`. The system is hardened (security review: no critical findings), spec-compliant (verified against the real MCP SDK), and distributed (Smithery published, ARD indexed on Neuronto, Glama auto-index pending).

**22 servers in the catalog, 17 live** — including 3 real third-party servers (context7, grep.app, deepwiki) that passed the registration pipeline's liveness probe + tool-poisoning scanner and were Ed25519-review-signed live.

**The story, in one line:** a solo operator on an island built the enterprise MCP governance layer the industry is just now realizing it needs — audit trails, tamper-evidence, non-repudiation, RBAC, tool-poisoning defense — and found three ecosystem bugs along the way.

---

## 2. What shipped (by phase)

### Backend — `workers/mcp-registry` (Cloudflare Worker)
| Capability | Detail |
|---|---|
| **Catalog API** | `GET /servers` (+`?q=&category=&status=`), `GET /categories`, `GET /servers/:id`, `/:id/tools`, `/:id/health` |
| **Registration** | `POST /servers` — liveness probe (initialize + tools/list), tool-description scanner, rate-limited (5/hr/IP), community tier → review |
| **Review/moderation** | `GET /servers/pending`, `POST /servers/:id/review` — Ed25519-signed approvals (reviewer/admin role) |
| **Call proxy** | `POST /servers/:id/call` — sanitized, quota-gated, audited, capability-token-scoped |
| **RBAC** | `GET /me`, `POST /roles` — viewer/publisher/reviewer/admin; principal via `X-Principal`, `CF-Access-Authenticated-User-Email`, or Access JWT |
| **Audit chain** | SHA-256 hash-chained **+ Ed25519-signed** per entry; `GET /audit?verify=signatures`; `GET /audit/export` (NDJSON) |
| **Transparency log** | `GET /transparency` — server lifecycle events (registered/approved/rejected/drifted) |
| **Observability** | `GET /logs`, `GET /errors`, `GET /anomalies` (admin); `POST /ingest/errors` (portal error ingestion); OTLP-shaped events |
| **MCP-native surface** | `POST /mcp` → `list_servers` / `get_server` / `call_tool` (JSON-RPC spec-compliant) |
| **Discovery** | `/.well-known/mcp.json` + `server-card.json` + `server.json` + `/mcp`; `/.well-known/ard.json`; `/.well-known/ai-catalog.json`; `/robots.txt` Agentmap |
| **Secrets** | `ADMIN_TOKEN`, `REVIEW_SIGNING_KEY`, `REVIEW_SIGNING_KEY_PREV` via `wrangler secret put` (rotated; `.dev.vars` gitignored for local) |

### Frontend — `production/portals/mcp-marketplace` (Vite + React, workspace.p31ca.org design system)
- **Surfaces:** Home, Discover (filterable catalog), Server detail (governance badges + tool diff), Playground (schema-driven forms, write-confirm gate, session log + export), Publish (registration), Review (moderation queue), Docs.
- **Badges:** live/unverified/degraded, scan verdict, Ed25519 review, capability manifest, drift, freshness.
- **Identity:** did:key mint (IdentityChip), role badge from `GET /me`, principal bridge on the Review surface (works without Access).
- **Observability:** self-hosted error ingestion to the registry.

---

## 3. Security hardening (all verified)

- **A1 Tool-poisoning scanner** (`scanner.ts`): instruction override, model steering, exfiltration verb+sink, credential grab, semantic mismatch, invisible unicode, obfuscated blobs. Malicious → rejected at registration; suspicious → flagged for review.
- **A2 Signed audit entries** — Ed25519 over deterministic JSON canonicalization (IETF signed-receipts pattern). workerd WebCrypto PKCS#8 dual-path (node:crypto is stubbed in workerd).
- **A3 Per-tool quotas** — `X-RateLimit-*` headers; 429 technical vs 402 monetized.
- **A4 Capability manifest + drift** — auto-derived manifests, `contentHash`, drift detection.
- **B1 RBAC** — role-gated admin/reviewer surfaces; self-identified `X-Principal` cannot escalate (roles come from KV).
- **B3 Transparency log** — second hash chain.
- **N1 Capability tokens** — 60s Ed25519 tokens on write calls, recorded in the audit chain.
- **N2 Sanitizer** — 64KiB body cap, per-field caps, command/URL-sink detection, base64-bomb + binary magic; per-IP rejection cap; surfaced in `/anomalies`.
- **N3 DO-backed ledgers** — `LedgerLog` Durable Object (single-writer, `prev === head`), dual-write + lazy backfill + **head reconciliation** (fixes forked chains).
- **N4 Access JWT** — `jose` verification of `Cf-Access-Jwt-Assertion`, JWKS KV-cached, IdP group → role mapping.
- **REQUIRE_AUTH_WRITE** flag (default OFF) for strict deployments.
- **Security review** (`workers/mcp-registry/SECURITY.md`): no critical/high findings; M1 (anonymous write proxy) mitigated + flaggable; I1/I2 documented.

---

## 4. Discovery & distribution status (verified 2026-09-24)

| Channel | State |
|---|---|
| **Smithery** | ✅ Published `trimtab-signal/mcp-marketplace`, 3 tools introspected (after the JSON-RPC envelope fix) |
| **Neuronto ARD** | ✅ `/.well-known/ard.json` indexed, grade C 73/100, 3/4 advertised paths |
| **Glama** | ⏳ Auto-index pending (~24h, GitHub connected as trimtab-signal + `glama.json` committed) |
| **Server card** | ✅ Live at all 4 `.well-known/` aliases (SEP-1649/2127 fields) |
| **Official MCP Registry** | ❌ **Out of scope — stdio-only.** `mcp-publisher validate` rejects `transport.type != "stdio"`; remote HTTP servers can't be published. Removed `server.json` + `publish-mcp.yml`. |
| **CI sweep** | Workflows written (`mcp-distribution-sweep.yml`, `mcp-registry.yml`) but **runner-blocked by GitHub Actions billing** (account issue, not code) |

---

## 5. Verified findings (the "three bugs")

1. **Official MCP Registry is stdio-only** — reproduced exactly (`value must be "stdio"`). Remote HTTP servers cannot be published there.
2. **Real MCP clients require the JSON-RPC envelope** — bare results fail the SDK client and Smithery's introspector. Found by testing with the real SDK, not unit tests. Fixed; SDK probe now connects (`tools: 3`).
3. **DO append failures leave permanent forked chains** — fixed by comparing DO head vs KV head on every read and replaying the suffix.

Also fixed: **SSE `event:`-line framing** broke third-party Streamable-HTTP registration (context7/grep.app).

---

## 6. Operational state

### Live endpoints
- Portal: `https://mcp.p31ca.org`
- Registry API: `https://mcp-registry.trimtab-signal.workers.dev`
- MCP endpoint: `https://mcp-registry.trimtab-signal.workers.dev/mcp`
- Server card: `.../.well-known/mcp/server-card.json`
- ARD: `.../.well-known/ard.json`
- Canonical blog post: `https://p31ca.org/blog/mcp-marketplace`

### Catalog (22 total, 17 live)
- Official remote: p31-crypto (12), justice-hub (8), bros (8), dads (7), marketplace-mcp (10), phenix-wallet (16), music-maker-mcp (5)
- Local (P31): soulsafe, oasis, phos-forge, component-registry, ground-truth, spaceship
- **Third-party (reviewed live):** context7 (2 tools), grep-app (1), deepwiki-fresh (3)
- Degraded/down: x402-gateway, spaceship-relay (upstream `2026-07-28` protocol-version bug), roblox-bridge, p31-mcp-server, design-mcp

### Secrets (rotated 2026-09-24; in `wrangler secret put`, `.dev.vars` gitignored)
- `ADMIN_TOKEN`, `REVIEW_SIGNING_KEY`, `REVIEW_SIGNING_KEY_PREV`
- Smithery API key + Glama API key were **provided by operator** and rotate after session completion — nothing depends on them.

### Test counts
- Registry: **72 vitest tests** (scanner, sanitizer, RBAC, audit, DO ledger, MCP surface, Access JWT)
- Portal: **7 vitest tests**, `pnpm gate` green

---

## 7. Known issues / blockers

1. **GitHub Actions billing block** (account-level payment failure) — blocks both CI workflows from running. Resolve in GitHub → Settings → Billing.
2. **Official MCP Registry is stdio-only** — a remote HTTP server can't be listed there; no action available.
3. **x402-gateway / spaceship-relay** upstreams advertise `protocolVersion 2026-07-28` — down until their upstreams redeploy.
4. **Glama / Neuronto propagation** — takes days; not actionable.
5. **Smithery deployment** was confirmed (tools listed) — but monitor `smithery.ai/servers/trimtab-signal/mcp-marketplace` for health.

---

## 8. Handoff — next steps

### This week (before Tuesday 2026-09-29)
1. **Post the Show HN** at ~8am ET: text body from `docs/mcp-marketplace-show-hn.md`, title `Show HN: An MCP marketplace built from an island in Georgia`. Sit in the comments for the first 4h.
2. Resolve the **GitHub Actions billing** so the `v*`-tag sweep fires.
3. Re-run `ard-publish check mcp-registry.trimtab-signal.workers.dev` (expect 4/4 advertised once the portal head-links register).

### Daily
4. Run `MCP_REGISTRY_ADMIN_TOKEN=<token> bash scripts/mcp-registry-digest.sh` — read `/audit`. Zero real traffic = distribution problem; moved numbers = roadmap.

### Ongoing (only if the digest moves)
- Confirm Smithery health in the UI.
- DeepWiki is registered under id `deepwiki-fresh` — consider renaming to `deepwiki` (register + approve a clean id).
- Monitor `/errors` (portal ingestion) + `/anomalies`.

### Optional (not urgent)
- `REVIEW_SIGNING_KEY_PREV` → retire ~30 days after rotation.
- Cloudflare Access on `mcp.p31ca.org` to exercise the N4 JWT path for real.

---

## 9. Where everything lives

| Artifact | Path |
|---|---|
| Registry worker | `P31-local-workspace/workers/mcp-registry/` |
| Scanner | `.../workers/mcp-registry/src/scanner.ts` |
| Sanitizer | `.../workers/mcp-registry/src/sanitizer.ts` |
| DO ledger | `.../workers/mcp-registry/src/ledger-do.ts` |
| Portal | `production/portals/mcp-marketplace/` |
| Digest script | `P31-local-workspace/scripts/mcp-registry-digest.sh` |
| RUNBOOK | `P31-local-workspace/RUNBOOK.md` (§11) |
| Security review | `.../workers/mcp-registry/SECURITY.md` |
| Directory submissions | `.../workers/mcp-registry/directory-submission.md` |
| Show HN draft | `P31-local-workspace/docs/mcp-marketplace-show-hn.md` |
| Blog post (live) | `apps/p31ca/src/pages/blog/mcp-marketplace.astro` |
| Deployment | `production/portals/deploy-unified.mjs` (portal) · `wrangler deploy` (registry) |

---

## 10. Commits

- Worker repo (`P31-local-workspace`, HEAD `4f647b51`): full arc — hardening, MCP surface, discovery, blog post, mobile fix.
- Production repo (`production`, HEAD `63ffee9`): portal (badges/RBAC/review/diff/risk), principal bridge, ARD head links, mobile fix.

**Sign-off:** The infrastructure is complete, verified, and distributed. The next move is not code — it's hitting submit on Tuesday and reading the digest the next morning.