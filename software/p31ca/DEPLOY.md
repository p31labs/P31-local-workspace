# Deploy `p31ca.org` (Astro technical hub)

**Ecosystem work package (unified hub + registry + edge inventory):** see **`docs/CONTROLLED-WORK-PACKAGE-ECOSYSTEM-INTEGRATION.md`**.

**Monetary pipeline (Stripe / donate-api / webhooks / export) —** does not change Pages deploy here, but must align **registry** and **Support** links: **`../docs/CONTROLLED-WORK-PACKAGE-MONETARY-PIPELINE.md`** (`CWP-P31-MAP-2026-01`).

**Scope:** This file is only for **`p31ca.org`**. The **`phosphorus31.org`** site is a **parallel** tree and workflow; do not route its deploy through this project unless the operator merges work on purpose.

## Correct project

| Cloudflare Pages project | Repo path | Domains |
|--------------------------|-----------|---------|
| **`p31ca`** | `software/p31ca/` | `p31ca.org`, `www.p31ca.org` |
| **`p31-hearing-ops`** | `software/p31-hearing-ops/` | `ops.p31ca.org` only |

Deploying **any other app’s `dist/`** to project **`p31ca`** replaces the hub for **every** domain on that project.

**Hub automation** — Registry: `scripts/hub/registry.mjs`. **Ship bar:** `npm run hub:ci` = `hub:about:generate` + full **`npm run verify`** (passport + prebuild + `astro build` + **`postbuild` `verify-p31ca-dist`**) — fails if `dist/` is missing critical `public/*` statics (e.g. `mesh-start.html`, `initial-build.html`, `lib/*`) before you deploy. **Deploy:** `npm run deploy` (runs `predeploy` = `verify`, then `wrangler pages deploy dist` — do not use wrangler on an empty `dist`).

**CI (Andromeda monorepo):** **`.github/workflows/p31ca-hub.yml`** — on push to `main` under `software/p31ca/**`, runs `hub:ci` and **auto-deploys** `dist/` to the **`p31ca`** Pages project (requires `CLOUDFLARE_API_TOKEN` in repo secrets). **BONDING home** repo: **`.github/workflows/p31-pages-deploy.yml`** — manual `workflow_dispatch`, runs `node scripts/p31-ci.mjs` then the same `wrangler pages deploy` pattern.

After `npm ci`, **`postinstall`** refreshes `hub-landing.json`.

**Passport + CI** — `npm run deploy` runs `predeploy` → `passport:verify` (then build → Pages). Canonical transform: `scripts/passport-p31ca-transform.mjs` in this package. From full P31 home, sync first: `npm run sync:passport` at home root, or `npm run passport:sync` from here. **GitHub Actions** (`P31 Automation` → `deploy_p31ca`): `passport:verify` runs with `P31_WORKSPACE_ROOT` set; it **skips** if `cognitive-passport/` is missing (Andromeda-only clone). For a **strict** check, run workflow **manually** and enable **`p31ca_strict_passport`** (fails if no authoring file). **Wrangler** for Pages is pinned in `package.json` (dev dependency).

## Recover if the apex shows Hearing Ops (or any wrong app)

1. **Redeploy the hub** (from this directory):

   ```bash
   npm run deploy
   ```

2. **Cloudflare Dashboard** → Workers & Pages → **`p31ca`** → **Deployments** — confirm the top production build is from **`software/p31ca`** (Astro), not another pipeline.

3. **Custom domains** — on **`p31ca`**: `p31ca.org` / `www`. On **`p31-hearing-ops`**: only `ops.p31ca.org`. Remove `p31ca.org` from the Ops project if it was added by mistake.

4. **Service worker** — If you still see the old app after deploy, the browser may have cached a PWA from this origin. Hard refresh, or DevTools → Application → Service Workers → Unregister, or deploy includes a small unregister script in `BaseLayout.astro` to clear stale workers.

## Public surfaces

These static files are served directly from `public/` with no build step — they ship as-is via Cloudflare Pages.

| File | Short URL | Description |
|------|-----------|-------------|
| `public/planetary-onboard.html` | `/onboard` | Five-phase neuro-inclusive onboarding. Phases 1–4 local; Phase 5 calls passkey Worker. |
| `public/connect.html` | `/mesh` | K₄ mesh navigator — family cage + product satellites. Receives `?dial=N` handoff from onboarding. |
| `public/delta.html` | `/why` `/delta` | Wye→Delta narrative. Entry point for external visitors. |
| `public/initial-build.html` | `/build` | CWP-P31-IB-2026-01: guest/onboarded `subject_id` + `PUT` profile/tetra + `p31_build_record`. |
| `public/auth.html` | `/auth` | Passkey authentication for returning mesh members. Calls passkey Worker auth endpoints. |

Short-path aliases are defined in `public/_redirects` (Cloudflare Pages edge rules):

```
/onboard  →  /planetary-onboard.html   301
/mesh     →  /connect.html             301
/delta    →  /delta.html               301
/why      →  /delta.html               301
/build    →  /initial-build.html       301
/auth     →  /auth.html                301
```

These are also mirrored in `ground-truth/p31.ground-truth.json` under `edgeRedirects` and verified on every build by `npm run verify:p31ca-contracts`.

---

## Passkey Worker (`workers/passkey/`)

The passkey Worker is a **separate Cloudflare Worker** — it is NOT deployed by `npm run deploy`. Deploy it independently with `wrangler` from `workers/passkey/`.

Full documentation: `workers/passkey/README.md`.

### First-time setup

**1. Create the KV namespace for challenges:**

```bash
cd workers/passkey
wrangler kv:namespace create CHALLENGES
```

Copy the `id` from output. Edit `wrangler.toml` → replace `REPLACE_WITH_KV_NAMESPACE_ID`:

```toml
[[kv_namespaces]]
binding = "CHALLENGES"
id      = "<your-kv-id>"
```

**2. Create the D1 database:**

```bash
wrangler d1 create p31-passkey-db
```

Copy `database_id`. Edit `wrangler.toml` → replace `REPLACE_WITH_D1_DATABASE_ID`:

```toml
[[d1_databases]]
binding       = "DB"
database_name = "p31-passkey-db"
database_id   = "<your-d1-id>"
```

**3. Apply the schema:**

```bash
# Production
wrangler d1 execute p31-passkey-db --file=schema.sql

# Local dev
wrangler d1 execute p31-passkey-db --local --file=schema.sql
```

**4. Deploy:**

```bash
# Preview (RP_ID = p31ca.pages.dev)
wrangler deploy --env preview

# Production (RP_ID = p31ca.org)
wrangler deploy --env production
```

**5. Verify:**

```bash
curl -s -X POST https://p31ca.org/api/passkey/register-begin \
  -H 'Content-Type: application/json' | jq .
```

Should return a challenge object with `rp.id = "p31ca.org"`.

### Re-deploy (after code changes)

```bash
cd workers/passkey
wrangler deploy --env production
```

No schema migration needed unless `schema.sql` changed.

### Local development

```bash
cd workers/passkey
wrangler dev --local
```

Worker runs at `http://localhost:8787`. The Astro dev server at `localhost:4321` will call it from `planetary-onboard.html` and `auth.html` (Phase 5 and auth flows).

Browsers restrict WebAuthn to secure origins (`localhost` is allowed; any other `http://` is not).

---

## Do not use project `p31ca` for

- `p31-hearing-ops` (use **`p31-hearing-ops`**)
- Spaceship Earth (use its own Pages project, e.g. **`spaceship-earth`**, not `p31ca`)
