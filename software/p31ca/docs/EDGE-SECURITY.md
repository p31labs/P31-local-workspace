# P31 Edge Security

Trust boundary and security posture for Cloudflare Pages + Workers.

---

## Deployment topology

```
Browser
  │
  ├─ HTTPS → Cloudflare Edge (TLS 1.3, managed by CF)
  │              │
  │              ├─ CF Pages → static dist/ (HTML/CSS/JS from Astro build)
  │              │              No Node.js at runtime. No server-side deps.
  │              │
  │              └─ CF Workers → workers/passkey/ (TypeScript, compiled by wrangler)
  │                              Runtime: V8 isolate, 10ms CPU, 1000 subreqs max
  │
  └─ WebAuthn → Hardware authenticator (FIDO2, CTAP2)
```

---

## What Cloudflare controls (not in this repo)

| Control | Who manages |
|---------|-------------|
| TLS cipher suites | Cloudflare (TLS 1.3, ECDHE, AES-GCM-256) |
| DDoS mitigation | Cloudflare (managed) |
| WAF rules | Cloudflare (free tier = basic) |
| IP reputation / bot scoring | Cloudflare |
| PQC-in-TLS (hybrid KEM) | Cloudflare (rolling out; no config needed from us) |
| Cert lifecycle | Cloudflare Universal SSL |

---

## What this repo controls

### Static pages (`public/`, `src/pages/`)

- **No server-side rendering** in production — Astro builds to static `dist/`
- **Security headers** in `public/_headers` (Cloudflare Pages applies these at edge):
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- **CSP**: Currently not set via `_headers`. Inline scripts and Tailwind CDN usage on some pages (`delta.html`, `planetary-onboard.html`) means a strict nonce-based CSP would require a build pipeline change. This is a P2 improvement item.
- **`Clear-Site-Data`**: Applied on navigation (via `_headers`) — localStorage is wiped. The `?dial=N` onboarding handoff uses query params instead of localStorage for this reason.

### Security suite entrypoints (what runs when)

| Entry | Phases | When |
|--------|--------|------|
| `npm run security:check` (from `p31ca/`) | **B** npm audit (suppressions) + **C** worker inventory / CORS grep + **E** PQC gate + passkey checks | Default after a successful hub `npm run verify` in **CI** (`scripts/p31-ci.mjs` when `GITHUB_ACTIONS`/`CI` and p31ca present); locally use `node scripts/p31-ci.mjs --security` or run `security:check` by hand. Uses `--skip-A` so it does **not** re-run full `npm run verify` inside p31ca. |
| `npm run security:check:full` | **A** `npm run verify` in p31ca + B + C + E | Manual “belt and suspenders” gate. |
| `.github/workflows/p31-security.yml` | B, C, E only (sparse checkout: p31ca + `quantum-core`) | Push/PR path filters + weekly schedule; **does not** run the home root `verify` bar—use **P31 CI** for that. |
| `scripts/p31-all.mjs` | Invokes `p31-ci` with `--security` when Andromeda is present (+ e2e, glass, soft Semgrep) | **P31 / full stack** job after root verify. |

**`/ops/` static shell (`src/pages/ops/`):** Uses only public URLs (command-center base, mesh constants from build data, glass probe list from `ops-glass-probes.json`). No API tokens or Worker secrets belong in Astro frontmatter or client bundles; mutations stay on Access-gated Workers.

### Passkey Worker (`workers/passkey/`)

**Endpoints:**
- `POST /api/passkey/register-begin`
- `POST /api/passkey/register-finish`
- `POST /api/passkey/auth-begin`
- `POST /api/passkey/auth-finish`

**Auth model:**
- Challenge-response: KV stores a 5-min TTL challenge; `clientDataJSON` must match
- Replay protection: `signCount` comparison in auth-finish (rejects if ≤ stored non-zero count)
- rpId binding: `SHA-256(RP_ID)` must match first 32 bytes of authData

**CORS (implementation in `workers/passkey/src/index.ts`):**
- Worker sets `Access-Control-Allow-Origin: *` on passkey JSON responses to allow preflight-free calls from the hub and local dev.
- **Trust boundary** for WebAuthn is not CORS: **rpId** (`RP_ID` / `p31ca.org`) and **authData / clientData** verification; an attacker on another origin cannot satisfy **rpIdHash** in the authenticator. See `ground-truth/p31.ground-truth.json` and `security/worker-allowlist.json` (`p31-passkey` notes) for the documented posture.
- **P2 (optional):** restrict `Access-Control-Allow-Origin` to `p31ca.org` + `p31ca.pages.dev` if you want defense-in-depth; same-origin production calls do not *require* CORS, but the Worker currently returns `*`.

**Same-origin production API — condensed threat model**

- **Happy path:** Pages on `https://p31ca.org` call `fetch('/api/passkey/…')`; the zone route sends traffic to the passkey Worker. **RP_ID** in `[env.production.vars]` must stay **`p31ca.org`** (enforced by `scripts/security/verify-crypto-surface.mjs`).
- **Why CORS `*` is not a WebAuthn bypass:** A malicious site can call the API, but the authenticator will not produce a valid assertion for `p31ca.org`’s **rpIdHash** unless the user is tricked into using a different RP or the attacker controls a same-rpId context (e.g. XSS on a real p31ca page).
- **Preview:** `[env.preview.vars]` **RP_ID** is **`p31ca.pages.dev`** — keep aligned with Cloudflare Pages preview hostnames.
- **Hardware / education colocated routes:** `p31ca.org/api/hardware/*` and `api/education/*` share the Worker; hardware pairing uses **Ed25519** and high-entropy opaque ids in `node-zero.ts`, not WebAuthn wire format—still treat firmware abuse and KV stuffing as operational risks (rate limits P2).
- **Out of scope for CI:** Phishing (typosquat domains), device malware, Cloudflare account compromise. **In scope:** dependency P0s, quantum-core tests, passkey source boundary (SubtleCrypto, no ML-DSA in WebAuthn path), wrangler RP_ID contract, allowlisted worker inventory.

**Command Center operator shift (`command-center` Worker, `GET/POST/OPTIONS /api/operator/shift`):**
- **GET** is intentionally **public** (PII-free JSON: `state` + `at`); CORS allows listed origins (p31ca, bonding, `*.pages.dev`, localhost) so the `/ops/` glass table and shift line can read it without a session.
- **POST** (tag in/out) requires **Cloudflare Access** and **operator** role; **OPTIONS** preflight reflects the browser `Origin` when allowlisted. Audit entries and elevated fields are not returned to unauthenticated GETs.

### Access bypass rules (Cloudflare Access)

For **`command-center.trimtab-signal.workers.dev`** the dashboard uses **two** Access applications so public glass can read shift state without giving the world SSO:

| App | Policy | Path scope | Purpose |
|-----|--------|------------|--------|
| **Public operator shift** (or equivalent name) | **Bypass** — Include = *Everyone* (or path-scoped bypass) | **`/api/operator/shift`** for **GET** only in practice | PII-free JSON for `/ops` + ecosystem glass; not a free pass to other routes. |
| **command-center** (default) | **Allow** e.g. Admins / named IdP group | `*` on this hostname (or all non-bypassed paths) | **POST** `/api/operator/shift`, internal operator UI, and any mutating or sensitive paths. |

**Rules:** (1) **GET** `/api/operator/shift` is the intentionally public read — implemented in the Worker + CORS; Access **bypass** for that path avoids **302 to login** in browsers that hit the Worker URL directly. (2) **POST** `/api/operator/shift` is **not** bypassed — requires Access session + **operator** role. (3) All **other** command-center routes should remain under the main Access app, not the bypass. (4) If you add routes, re-audit: no bypass wider than needed for the glass operator story.

**Operator runbook (mesh red, probe order, 401/403 table):** **`OPS-GLASS-OPERATOR-RUNBOOK.md`** (this directory).

**Rate limiting:**
- Not implemented at Worker level — relies on Cloudflare edge rate limiting (free tier: basic)
- P2 item: add `CHALLENGES` KV TTL as a natural rate limit; consider explicit rate-limit token in KV

**Orchestrator (`/orchestrator` page, `p31-orchestrator.trimtab-signal.workers.dev`):**
- Unlisted from hub grid (Pauli assertion in egg-hunt manifest enforces this)
- **Trust boundary (definition of done):** the **static** Astro/JS page is a convenience UI only; it is not an authentication layer. The **`p31-orchestrator` Worker** must enforce production controls on **mutating** and **sensitive read** paths: (1) **Cloudflare Access** in front of the `*.workers.dev` route *or* **Worker** validation of `Authorization: Bearer` against a `wrangler secret`, (2) **rate limits** (Workers Rate Limiting API, `fetch` throttling, or WAF), (3) **audit** logging for approval/mutation events. Unauthenticated **GET**s for read-only status may remain acceptable if documented and abuse-reviewed; **POST**/approve/queue must not be world-writable. See `docs/EGG-HUNT.md` for the `ORCH-WORKER` entry. **Policy F8: closed** — no further “P2” backlog item; implementation lives in the orchestrator worker deploy, not in static HTML.

---

## Crypto trust boundary

| Layer | What happens | Algorithm |
|-------|-------------|-----------|
| TLS handshake | Cloudflare ↔ browser | TLS 1.3 (ECDHE + AES-256-GCM) — CF managed |
| WebAuthn registration | Authenticator generates key, returns COSE public key | ECDSA P-256 (ES256) or RSA-2048 (RS256) — hardware-set |
| WebAuthn authentication | Authenticator signs `authData \|\| SHA-256(clientDataJSON)` | Same as above — hardware-set |
| Passkey Worker verification | SubtleCrypto.verify() | ES256 or RS256 — per FIPS 186 |
| P31 app-layer signing | ML-DSA-65 via `@noble/post-quantum` | FIPS 204 — software |
| P31 app-layer KEM | ML-KEM-768 via `@noble/post-quantum` | FIPS 203 — software |

**Why the passkey Worker is correctly classical:**
WebAuthn/FIDO2 is a hardware protocol. The key pair lives inside the authenticator (Secure Enclave, TPM, YubiKey, etc.). The authenticator generates ECDSA/RSA — we cannot substitute ML-DSA in the wire format without changes to the FIDO Alliance spec and OS-level APIs that don't exist yet (2026). The PQC layer (`packages/quantum-core`) is for P31's own signing and key transport, not for the WebAuthn attestation chain.

When ML-DSA becomes available in platform authenticators (likely ~2028–2030), the passkey Worker can be extended to support it as an additional `alg`.

---

## CSP roadmap (P2)

Current state: no `Content-Security-Policy` header in `_headers`.

Blockers:
1. Several `public/*.html` files use `<script>` inline blocks and Tailwind CDN (`https://cdn.tailwindcss.com`)
2. Three.js loaded from `unpkg.com` CDN on multiple pages
3. No nonce pipeline in the Astro build

Path to strict CSP:
1. Move Tailwind to build-time (already done for Astro pages; remaining: `delta.html`, `planetary-onboard.html`, `connect.html`, `auth.html`)
2. Move Three.js to `node_modules` import or a bundled module (removes CDN dependency)
3. Add nonce generation to Astro middleware or use hash-based CSP for static inline scripts
4. Add `Content-Security-Policy` to `_headers` with `script-src 'nonce-...' 'strict-dynamic'`

This is a meaningful improvement but not blocking any current function. Track as P2.
