# P31 Hearing Ops

Vite + React PWA for contempt hearing prep (offline-first, local fonts, no Google CDN).

## Develop

```powershell
npm install
npm run dev
```

## Production deploy (`ops.p31ca.org`)

This app uses Cloudflare Pages project **`p31-hearing-ops`** — **not** `p31ca`.

**Why:** A Pages project serves **one** production build to **every** custom domain on that project. The hub at `p31ca.org` is project `p31ca` (`software/p31ca/`). Deploying Hearing Ops to `p31ca` would replace the hub on **both** `p31ca.org` and `ops.p31ca.org`. Keep projects separate.

Git-connected Pages projects serve **custom domains from the production branch only**. If you deploy from a feature branch without `--branch`, Wrangler creates a **preview** (your app works on `*.pages.dev` URLs but **not** on `ops.p31ca.org`).

```powershell
npm run deploy
```

Same as `npm run build` followed by:

`npx wrangler pages deploy dist --project-name p31-hearing-ops --branch=main --commit-dirty=true`

If your default branch is not `main`, replace `--branch=main` with that branch name (must match **Settings → Builds & deployments → Production branch** in the Cloudflare dashboard).

### First-time / recovery (Cloudflare dashboard)

1. **Create** a Pages project named **`p31-hearing-ops`** (or run `npm run deploy` once; Wrangler may prompt to create it).
2. Under **Custom domains** for **`p31-hearing-ops`**, attach **`ops.p31ca.org`**.
3. Under **Custom domains** for **`p31ca`**, ensure **`p31ca.org`** (and `www` if used) are listed — **remove** `ops.p31ca.org` from the `p31ca` project if it was added there by mistake.
4. **Restore the hub** after any mistaken deploy: from `software/p31ca/` run `npm run deploy` so project `p31ca` serves the Astro site again.

## Verify

- `https://ops.p31ca.org` — title **P31 Hearing Ops**, seven tabs.
- `https://p31ca.org` — Astro hub / lattice MVP (not Hearing Ops).
- iPhone: Add to Home Screen → airplane mode → content still loads.
