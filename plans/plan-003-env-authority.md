# PLAN-003: .env Authority Resolution

## Problem

Two candidates exist for storing API keys. No authoritative source is established. Conflicting `.env` files will cause deployment failures.

| Candidate     | Path                                           | Status                                               |
| ------------- | ---------------------------------------------- | ---------------------------------------------------- |
| A (candidate) | `c:/Users/sandra/Documents/P31_Andromeda/.env` | Existing                                             |
| B (candidate) | `software/.env`                             | No `.env` found, only `config.env` in build/ subdirs |

Build artifacts (`software/*/build/config.env`) are gitignored (toolchain outputs). No `.env` or `.env.example` currently exists in `software/`.

## Audit Result

All actual env vars live in three places:

1. **Cloudflare Pages dashboard** — `VITE_*` vars for bonding and spaceship-earth (injected at build time)
2. **`[vars]` blocks in `wrangler.toml`** — static vars like `ENVIRONMENT`, `BRENDA_PHONE`, `OPERATOR_USER_ID`
3. **Cloudflare Workers dashboard** — secrets via `wrangler secret put`

No root-level `.env` or `software/.env` was found. All `.env` files in the scan are build artifact `config.env` files in `*/build/` — gitignored, transient, non-authoritative.

## Decision

**Cloudflare dashboard is the authoritative store for production secrets.** No root `.env` is needed.

For local development, add a `.env.example` at root as a template:

```
# P31 Labs — Environment Variables Template
# Copy to .env for local development
# DO NOT commit .env — all secrets live in Cloudflare dashboard

# Sentry (optional — no-op if absent)
VITE_SENTRY_DSN=

# Cloudflare Workers
CF_ACCOUNT_ID=
CF_API_TOKEN=
```

## Steps

### Step 1 — Verify No Root `.env` Exists

```bash
# Confirm no untracked .env at root
git status .env
# If empty → clean. If tracked → remove from git and add to .gitignore
```

### Step 2 — Add Root `.gitignore` Entry (if not present)

```
# Environment
.env
.env.local
.env.production
```

### Step 3 — Create `.env.example` at Root

Template above. Documents what vars exist without exposing values.

### Step 4 — Audit All `wrangler.toml` `[vars]` Blocks

```bash
grep -n "\[vars\]" software/*/wrangler.toml software/workers/wrangler.toml
```

Move any non-secret defaults to `[vars]`. Move secrets (API tokens) to `wrangler secret put`.

### Step 5 — Document the Three-Store Model

Add to `docs/ops/` or the README:

```
ENVIRONMENT VARIABLES — Three Stores

1. Cloudflare Pages dashboard → VITE_* vars (bonding, spaceship-earth)
2. wrangler.toml [vars] block → static non-secret vars
3. wrangler secret put → API tokens, DSNs, HMAC keys

No .env files in git. Local dev: copy .env.example → .env
```

## Priority

**Low.** No active breakage. This is preventive hygiene — eliminates a class of "why is my deploy broken" failures.
