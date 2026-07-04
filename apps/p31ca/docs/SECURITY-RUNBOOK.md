# P31 Security Runbook

Single-page operator reference. Run `npm run security:check` and use this to triage what you see.

---

## Quick commands

| Command | What it does |
|---------|-------------|
| `npm run security:check` | SCA + worker inventory + crypto surface (no full build) |
| `npm run security:check:full` | Same + runs existing `npm run verify` contracts first |
| `npm run security:audit` | npm audit only, with suppression filtering |
| `npm run security:workers` | Worker inventory scan, writes `build/security-inventory.json` |
| `npm run security:crypto` | PQC gate (quantum-core tests) + passkey boundary check |
| `npm run security:lint` | ESLint security rules on `src/` + `workers/` |

---

## When `security:check` fails

### P0: Prod-runtime vulnerability (SCA)

```
[FAIL] Prod dep <pkg> — high: <title>
```

**Cause:** A package in `dependencies` (not `devDependencies`) has an unsuppressed critical or high CVE.

**Actions:**
1. `npm audit --omit=dev` — confirm the finding
2. Check if the dep is actually runtime-deployed (CF Workers use `workers/passkey/`; CF Pages deploys `dist/` — no Node deps at runtime)
3. If it's a build artifact dep that leaked into `dependencies`, move it to `devDependencies`
4. If genuinely runtime: patch/upgrade; if no fix available, add a suppression with a short expiry and reason to `security/audit-suppressions.json`

### P0: quantum-core tests failed

```
[FAIL] quantum-core: test suite FAILED
```

**Cause:** ML-KEM or ML-DSA implementation broken after a change.

**Actions:**
1. `cd andromeda/software/packages/quantum-core && npm test` — see exact failure
2. Check if `@noble/post-quantum` import paths changed (see `GHSA-` or npm changelog)
3. Restore the FIPS 203/204 key-size constants in tests if the library changed a variant

### P0: passkey wrangler RP_ID drift

```
[FAIL] passkey wrangler: [env.production.vars] RP_ID must be "p31ca.org" (got …)
```

**Cause:** `workers/passkey/wrangler.toml` lost the documented production or preview **RP_ID** (WebAuthn rpId binding would not match the public hub).

**Actions:**
1. Restore **`[env.production.vars]`** → `RP_ID = "p31ca.org"` and **`[env.preview.vars]`** → `RP_ID = "p31ca.pages.dev"` unless you are intentionally changing the public passkey hostname (then update `EDGE-SECURITY.md`, ground-truth, and client assumptions in the same change).
2. `npm run security:crypto` — confirm Phase E passes.

---

## When `security:check` shows P1 warnings

### P1: Dev dep CVE (not suppressed)

```
[WARN] Dev dep <pkg> — high: <title>
```

If this is a build tool (Vite, PostCSS, Astro), add it to `security/audit-suppressions.json`:

```json
{
  "id": "GHSA-xxxx-xxxx-xxxx",
  "package": "<pkg>",
  "severity": "high",
  "reason": "<why it's acceptable — scope, exploitability>",
  "scope": "dev",
  "addedAt": "YYYY-MM-DD",
  "expiresAt": "YYYY-MM-DD"   // max 6 months; force a revisit
}
```

### P1: Worker not in allowlist

```
[WARN] Worker not in allowlist: <name> — add to security/worker-allowlist.json
```

**Actions:**
1. Review `build/security-inventory.json` — find the entry
2. Check bindings (KV/D1/DO), var names, and CORS
3. Add an entry to `security/worker-allowlist.json` with notes on auth scheme and CORS policy

### P1: Wildcard CORS found

```
[WARN] Wildcard CORS in <worker>: N match(es) — review if credentials are passed
```

**Actions:**
1. Check if the endpoint receives or returns auth tokens or cookies
2. If credentials are involved and `*` is set: switch to explicit origin allowlist
3. If it's a public read-only endpoint (public health check, etc.): document in `worker-allowlist.json` as intentional

### P1: Suppression expired

```
[WARN] Suppression expired YYYY-MM-DD: GHSA-xxx — review or renew
```

Open `security/audit-suppressions.json`, find the entry, check if a patch is available. Either update the package or extend `expiresAt` with a new reason.

---

## Closed policy items (governance, not open backlog)

| Item | State |
|------|--------|
| **F4 — CI path filters** (home `p31-ci.yml`) | **Closed.** The workflow runs on every push/PR to `main`/`master` (no `paths` filter). You cannot “miss” P31 CI by editing only files that were off an old list. |
| **F3 / P1 — CORS `*` inventory WARNs** | **Closed for CI policy.** P1 `Wildcard CORS` lines are **informational**; the security suite does **not** fail the merge on them. Triage: document intentional wildcards in `security/worker-allowlist.json` (already required for new Workers); change code only when credentials or cookies cross the boundary. |
| **Semgrep (home `p31-ci.yml` + `p31-security.yml`)** | **Closed for mode.** SAST is **report-only** (`continue-on-error` / SARIF upload) until a future decision to make it blocking. That is a deliberate state, not a forgotten gate. |
| **Orchestrator auth (F8)** | **Closed in policy** — see **Orchestrator** in `docs/EDGE-SECURITY.md` for the definition of done; deploy-time enforcement on the Worker. |
| **Mesh / agent / orchestrator URLs in static pages** | **Closed** — `p31-constants.json` → `apply:constants` → `p31-mesh-constants.json` + `dev-workbench.html` + `verify-constants` (root). |

---

## Suppression policy

- All suppressions must have a `reason` and `expiresAt` (max 6 months from `addedAt`)
- `scope: "dev"` = build-tool only, never deployed
- `scope: "prod"` = runtime dep, accepted risk — requires senior review and very short expiry
- No `scope: "prod"` suppressions currently exist

---

## Crypto trust boundary

| Layer | Algorithm | Where |
|-------|-----------|-------|
| WebAuthn / passkey | ECDSA P-256 (ES256) or RSA (RS256) | `workers/passkey/` — set by authenticator hardware |
| App-layer signing | ML-DSA-65 (FIPS 204) | `packages/quantum-core` |
| App-layer KEM | ML-KEM-768 (FIPS 203) | `packages/quantum-core` |
| Transport | TLS 1.3 (Cloudflare managed) | Not in this repo |

**The passkey Worker is correctly classical.** WebAuthn wire format is defined by the FIDO2 spec and hardware authenticators — we cannot put ML-DSA there. PQC is for P31's own signing and key exchange at the application layer.

---

## Adding a new worker

1. Create `workers/<name>/wrangler.toml`
2. Run `npm run security:workers` — it will flag the new worker as P1
3. Review the generated entry in `build/security-inventory.json`
4. Add to `security/worker-allowlist.json` with bindings, CORS policy, and auth scheme
5. Run `npm run security:workers` again — should be clean

---

## Reference

- Suppression file: `security/audit-suppressions.json`
- Worker allowlist: `security/worker-allowlist.json`
- Generated inventory: `build/security-inventory.json` (gitignored)
- Generated report: `build/security-report.json` (gitignored)
- Security scripts: `scripts/security/`
- CI workflow: `.github/workflows/p31-security.yml` (home repo)
- Edge trust boundary: `docs/EDGE-SECURITY.md`
