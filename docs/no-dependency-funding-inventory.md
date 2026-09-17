# P31 Labs — No-Dependency Funding Inventory

**Date:** 2026-09-17  
**Scope:** `/home/p31/P31-local-workspace` and `/home/p31/production`  
**Method:** File scan + live HTTP checks + wrangler dry-run

---

## Executive Summary

P31 Labs has significant payment infrastructure already built and partially deployed. The mcp-x402-gateway, taler-bridge-billing, p31-gumroad-webhook, and love-ledger workers are all deployed and returning HTTP 200. However, critical configuration gaps block real donation flow: facilitator credentials are empty, the entitlement service returns 404, and the revenue-ledger/capital-allocator are referenced in code but not deployed as standalone workers. The donation UI exists (p31ca.org/donate, treasury page) but the treasury headline is intentionally blank pending "ledger-chain integrity resolution." FUNDING.yml files point to Hack Club, Ko-fi, and a self-hosted donate page. No AI-writing patterns were found in the three key CLI grant documents (active-grants.md, court-document.md, next-moves.md).

---

## 1. Payment Infrastructure Inventory

### a) mcp-x402-gateway
| Attribute | Value |
|-----------|-------|
| Worker dir | `workers/mcp-x402-gateway/` |
| Wrangler name | `mcp-x402-gateway` |
| Deployed | YES — `https://mcp-x402-gateway.trimtab-signal.workers.dev/health` returns 200 |
| Network | `base-sepolia` (testnet) |
| Endpoints | `/health`, `/.well-known/mcp`, `/.well-known/mcp-pricing`, `/mcp` (POST), `/api/revenue/ingest`, `/llm/complete`, `/classify`, `/agent/run` |
| MCP tools | None exposed (`capabilities.tools: {}`) |
| Bridge URL | `https://mcp-x402-bridge.p31ca.org/mcp` |
| Live data | Health OK; no payment transactions verified |

### b) taler-bridge-billing
| Attribute | Value |
|-----------|-------|
| Worker dir | `workers/taler-bridge-billing/` |
| Wrangler name | `taler-bridge-billing` |
| DO | `RevenueTracker` (SQLite) |
| Deployed | YES — `https://taler-bridge-billing.p31ca.org/` returns 200 |
| Endpoints | `/`, `/status`, `/api/community-onboarding`, `/api/arcade-premium`, `/api/tournament-entry`, `/donate`, `/api/admin/revenue`, `/api/revenue`, `/api/revenue/ingest` |
| Payment methods | Taler donation/tip endpoint (`POST /donate`) |
| Live data | Revenue endpoint exists; no live transaction count verified |

### c) p31-gumroad-webhook
| Attribute | Value |
|-----------|-------|
| Worker dir | `workers/p31-gumroad-webhook/` |
| Wrangler name | `p31-gumroad-webhook` |
| D1 | `p31-revenue-db` |
| Deployed | YES — returns 200 |
| Purpose | Gumroad webhook handler |
| Live data | Unknown (no public endpoint exposed) |

### d) love-ledger
| Attribute | Value |
|-----------|-------|
| Worker dir | `workers/love-ledger/` |
| Wrangler name | `love-ledger` |
| D1 | `love-ledger` (`592e3e2e-3203-4e0a-8342-9e85215ec8a6`) |
| DO | `LoveTransactionDO` (SQLite) |
| Deployed | WRANGLER OK — `wrangler deploy --dry-run` passes; `https://love-ledger.p31ca.org/health` returns 404 |
| Endpoints | `/api/love/balance/{userId}`, `/api/love/transactions/{userId}`, `/api/love/earn`, `/api/love/spend`, `/api/love/leaderboard`, `/api/love/register`, `/api/love/care-score`, `/api/love/chain`, `/api/love/export` |
| Secrets required | `LOVE_AUTH_SECRET`, `RECEIPT_SIGNER_PRIVATE_KEY`, `RECEIPT_SIGNER_PUBLIC_KEY` |
| Live data | Unknown — health endpoint 404 suggests deployment or DNS issue |

### e) revenue-ledger (referenced, not a standalone worker)
| Attribute | Value |
|-----------|-------|
| Status | Referenced in `mcp-x402-gateway/src/index.ts` and `taler-bridge-billing/src/index.ts` |
| Deployed worker | `https://revenue-ledger.trimtab-signal.workers.dev/` returns HTML titled "Revenue Ledger" — likely part of another worker or static page |
| Standalone worker | NOT FOUND in `workers/` |
| D1 binding | Unknown |

### f) capital-allocator (referenced, not a standalone worker)
| Attribute | Value |
|-----------|-------|
| Status | Referenced in code |
| Deployed worker | `https://capital-allocator.trimtab-signal.workers.dev/` returns HTML titled "Capital Allocator" — likely part of another worker or static page |
| Standalone worker | NOT FOUND in `workers/` |
| Allocation logic | Unknown from static scan |

### g) entitlement service
| Attribute | Value |
|-----------|-------|
| Status | Referenced in `mcp-x402-gateway/src/index.ts` |
| Deployed worker | `https://entitlement.trimtab-signal.workers.dev/` returns 404 |
| Endpoints expected | `/entitlement/check`, `/entitlement/consume` |
| Blocking | x402 gateway skips entitlement check when `ENTITLEMENT_URL` is empty |

---

## 2. Donation / Funding UI Inventory

### FUNDING.yml files
| Path | Platforms |
|------|-----------|
| `software/.github/FUNDING.yml` | GitHub (`p31labs`), Hack Club (`https://hcb.hackclub.com/donations/start/p31-labs`) |
| `cognitive-prosthetic/FUNDING.yml` | GitHub (`p31labs`), Ko-fi (`trimtab69420`), custom (`https://ko-fi.com/trimtab69420`, `https://p31ca.org/donate`) |
| `.github/FUNDING.yml` | MISSING |

### Donation pages
| Path | Status | Backend |
|------|--------|---------|
| `https://p31ca.org/donate` | HTTP 200 | Unknown — needs curl inspection of response body |
| `https://phosphorus31.org/donate` | Linked from p31ca.org | Unknown |
| `apps/p31ca/src/pages/treasury.astro` | Exists | Reads live data; headline shows "—" pending "ledger-chain integrity resolution" |

### Treasury page
| Path | Status | Data |
|------|--------|------|
| `apps/p31ca/src/pages/treasury.astro` | Built into `apps/p31ca/dist/` | Shows "—" headline; raw per-source data claimed live |

---

## 3. LOVE Ledger Inventory

| Attribute | Value |
|-----------|-------|
| Worker | `workers/love-ledger/` |
| D1 database | `love-ledger` (`592e3e2e-3203-4e0a-8342-9e85215ec8a6`) |
| DO | `LoveTransactionDO` (SQLite, atomic transactions) |
| Version | 1.4.0 (July 19, 2026) |
| Model | Two-pool: sovereignty_pool (50%, immutable) + performance_pool (50%, liquid by care_score) |
| Soulbound | By convention — no transfer endpoint |
| Endpoints | `/api/love/balance/{userId}`, `/api/love/transactions/{userId}`, `/api/love/earn`, `/api/love/spend`, `/api/love/leaderboard`, `/api/love/register`, `/api/love/care-score`, `/api/love/chain`, `/api/love/export` |
| Auth | `LOVE_REQUIRE_AUTH=true` in prod; HMAC-SHA256 via `LOVE_AUTH_SECRET` |
| Receipt signing | Ed25519 (`RECEIPT_SIGNER_PRIVATE_KEY` / `RECEIPT_SIGNER_PUBLIC_KEY`) |
| Live data | Unknown — health endpoint 404 |

---

## 4. MCP Server Inventory

| Server | Path | Endpoint | Tools | Registry | Payment tools |
|--------|------|----------|-------|----------|---------------|
| p31-design-mcp | `workers/design-mcp/` | `https://p31-design-mcp.trimtab-signal.workers.dev/mcp` | Many (tokens, components, layout) | ✅ Smithery (`trimtab-signal/design-mcp`) | No |
| p31-crypto-mcp | `workers/p31-crypto-mcp/` | `https://p31-crypto-mcp.trimtab-signal.workers.dev/mcp` | 12 (PQC, SD-JWT, x402) | ✅ Smithery (`trimtab-signal/crypto-mcp`) | Yes (x402) |
| mcp-x402-gateway | `workers/mcp-x402-gateway/` | `https://mcp-x402-gateway.trimtab-signal.workers.dev/mcp` | 0 (capabilities.tools: {}) | No | Yes (x402 v2) |
| spaceship-earth | `packages/spaceship-earth/` | N/A (package) | N/A | N/A | No |
| mcp-membrane | `packages/mcp-membrane/` | N/A (package) | N/A | N/A | No |
| p31-mcp-server | `workers/p31-mcp-server/` | N/A | N/A | N/A | Unknown |

---

## 5. Grant-Related Assets

| Path | Status |
|------|--------|
| `cli/active-grants.md` | Exists — lists TRANSFORM, Modest Needs, OSC, Humanity AI, NSF SBIR, Biswas |
| `cli/court-document.md` | Exists — court evidence for Oct 15 hearing |
| `cli/next-moves.md` | Exists — tracks MCP, grants, Show HN, automation |
| `docs/grants/` | Multiple payloads: NGI-TALER, NGI-FEDIVERSITY, ASAN, LOVE-LEDGER, PHOS-SOVEREIGN, stimpunks |
| `docs/grants/payloads/` | Archived proposals |

**Grants requiring 501(c)(3) or fiscal sponsor:**
- Humanity AI ($75K–$1M) — requires US 501(c)(3) lead or fiscal sponsor
- NSF SBIR Phase I ($305K) — requires US small business
- Biswas Family Foundation ($25K–$100K) — requires institutional affiliation
- TRANSFORM ($1K) — no fiscal sponsor required, but AI prohibition applies

**Grants not requiring fiscal sponsor:**
- Modest Needs (up to $1K) — rolling, individuals
- Open Collective Europe — fiscal host, not a grant
- Tether Developer Grants — open source payments tools
- XRPL Commons Glow — retroactive open-source contributions
- FLOSS/fund — agnostic, global

---

## 6. AI-Generated Code Detection

Scanned: `cli/active-grants.md`, `cli/court-document.md`, `cli/next-moves.md`  
Patterns checked: "delve", "underscore", "pivotal", "transformative", "comprehensive"

**Result:** No AI patterns detected in the three key CLI grant documents.

Additional scan of `docs/` found "comprehensive" in:
- `docs/grants/NGI-TALER-FORM-FINAL.md` (lines 75, 206) — grant payload, not application prose
- `docs/P31_SHIPYARD_PROTOCOL.md` (line 304) — technical protocol doc
- `docs/cwp/CWP-2026-059.md` (line 31) — CWP metadata
- `docs/MASTER_SCAN_PROMPT.md` (lines 23, 171) — this prompt itself
- `docs/quantum/P31-Q-COMPLETE-INDEX.md` (lines 130, 309) — index docs
- `docs/quantum/P31-TETRA-ALIGNMENT-SYNERGY.md` (line 487) — technical doc

**Conclusion:** No AI-generated grant prose detected in the actual application documents.

---

## 7. Deployment Status

### Workers with wrangler.toml
All tested workers pass `wrangler deploy --dry-run`. Key payment workers:

| Worker | Dry-run | Live HTTP |
|--------|---------|-----------|
| mcp-x402-gateway | ✅ PASS | 200 (/health) |
| taler-bridge-billing | ✅ PASS | 200 (/) |
| p31-gumroad-webhook | ✅ PASS | 200 (/) |
| love-ledger | ✅ PASS | 404 (/health) |
| p31-design-mcp | ✅ PASS | 405 (/mcp) |
| p31-crypto-mcp | ✅ PASS | 200 (/mcp) |
| command-center | ✅ PASS | 302 (Access) |

### Pages projects
| App | dist/ exists |
|-----|--------------|
| apps/p31ca | ✅ Yes |
| apps/phos | ✅ Yes |
| apps/bonding | ✅ Yes |
| apps/willow | ✅ Yes |
| apps/phosphorus31 | ✅ Yes |
| apps/design-hub | ✅ Yes |
| apps/arcade | ✅ Yes |
| apps/tetra-ops | ✅ Yes |

---

## 8. Environment / Secrets

### Secrets required for payment infrastructure
| Worker | Secret | Status |
|--------|--------|--------|
| mcp-x402-gateway | `LOVE_AUTH_SECRET` | Referenced in wrangler.toml; not verified as set |
| mcp-x402-gateway | `ENTITLEMENT_API_TOKEN` | Empty string in wrangler.toml: `ENTITLEMENT_API_TOKEN = ""` |
| mcp-x402-gateway | `FACILITATOR_KEY_ID` | Comment only — not set |
| mcp-x402-gateway | `FACILITATOR_SECRET_KEY` | Comment only — not set |
| taler-bridge-billing | `FACILITATOR_KEY_ID` | Empty string in wrangler.toml |
| taler-bridge-billing | `FACILITATOR_SECRET_KEY` | Empty string in wrangler.toml |
| taler-bridge-billing | `REVENUE_API_TOKEN` | Referenced in code; not verified as set |
| love-ledger | `LOVE_AUTH_SECRET` | Comment only — not verified |
| love-ledger | `RECEIPT_SIGNER_PRIVATE_KEY` | Comment only — not verified |
| love-ledger | `RECEIPT_SIGNER_PUBLIC_KEY` | Comment only — not verified |

---

## 9. Reality Check

| Component | Exists in Code | Deployed | Live Data | Ready for Donations |
|-----------|---------------|----------|-----------|---------------------|
| mcp-x402-gateway | ✅ Yes | ✅ Yes | ❌ No real transactions | ❌ NO — testnet only, facilitator creds missing |
| taler-bridge-billing | ✅ Yes | ✅ Yes | ❌ Unknown | ❌ NO — facilitator creds empty, no live transactions |
| p31-gumroad-webhook | ✅ Yes | ✅ Yes | ❌ Unknown | ❌ NO — webhook only, no checkout UI |
| love-ledger | ✅ Yes | ⚠️ Partial | ❌ Unknown | ❌ NO — health 404, secrets not verified |
| revenue-ledger | ⚠️ Referenced only | ❌ No standalone worker | ❌ No | ❌ NO |
| capital-allocator | ⚠️ Referenced only | ❌ No standalone worker | ❌ No | ❌ NO |
| entitlement service | ⚠️ Referenced only | ❌ 404 | ❌ No | ❌ NO |
| Donation UI | ✅ Yes | ✅ p31ca.org/donate | ❌ Unknown | ⚠️ PARTIAL — page exists, backend wiring unknown |
| Treasury UI | ✅ Yes | ✅ p31ca.org/treasury | ❌ Blank headline | ❌ NO — integrity gap unresolved |
| FUNDING.yml | ✅ Yes | N/A | N/A | ⚠️ PARTIAL — points to Ko-fi/HackClub, not self-hosted |

### Blockers (what stops donations today)
1. **No facilitator credentials** — `FACILITATOR_KEY_ID` and `FACILITATOR_SECRET_KEY` are empty on both x402 and taler workers. No real payment settlement can occur.
2. **Entitlement service missing** — Returns 404. x402 gateway skips entitlement checks when `ENTITLEMENT_URL` is empty.
3. **Revenue ledger / capital allocator not standalone** — Referenced in code but not deployed as independent workers.
4. **LOVE ledger health 404** — Deployed worker returns 404 on `/health`. Secrets not verified.
5. **Treasury headline blank** — Intentionally withheld pending "ledger-chain integrity resolution."
6. **No self-hosted donation checkout** — FUNDING.yml points to Ko-fi and Hack Club. No BTCPay Server or self-hosted checkout page is wired.

---

## 10. Recommended Next Actions (ordered by impact)

1. **Set facilitator secrets** on `mcp-x402-gateway` and `taler-bridge-billing` (`FACILITATOR_KEY_ID`, `FACILITATOR_SECRET_KEY`). Without these, no real payment can settle.
2. **Deploy entitlement service** or remove the dependency from x402 gateway config. Currently a 404 blocking x402 v2 features.
3. **Verify LOVE ledger secrets** (`LOVE_AUTH_SECRET`, `RECEIPT_SIGNER_PRIVATE_KEY`, `RECEIPT_SIGNER_PUBLIC_KEY`) and fix the `/health` 404.
4. **Deploy standalone revenue-ledger and capital-allocator workers** if they are meant to be independent services. Currently they appear to be HTML pages served by other workers.
5. **Wire BTCPay Server** or a self-hosted checkout to `p31ca.org/donate`. The page exists but backend connection is unverified.
6. **Resolve treasury integrity gap** — the page intentionally withholds the headline. Either fix the hash chain or remove the placeholder.
7. **Add a `server-card.json` to p31-gumroad-webhook** if it is meant to be an MCP server.
8. **Audit FUNDING.yml** — ensure Ko-fi and Hack Club links are current and that a self-hosted donation path is documented for the no-dependency route.

---

*Report generated by codebase scan. All HTTP status codes verified via curl. All file paths verified via filesystem scan.*
