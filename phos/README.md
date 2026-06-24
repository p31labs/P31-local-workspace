# phos — Phosphorus31 Frontend

<!-- pmm-badge -->
![PMM Maturity](../../.p31/badges/phos.svg)
<!-- /pmm-badge -->

**phos.p31ca.org** — Astro + React + PGlite PWA for the P31 sovereign stack.

## Stack
- Astro 5 + React 19 + Tailwind 3
- @electric-sql/pglite (local SQLite)
- Yjs (CRDT collaboration)
- PWA with @khmyznikov/pwa-install

## Setup
```bash
npm install
npm run dev
```

## Deploy
Cloudflare Pages project `phos`. Build output: `dist/`.

```bash
npm run build
npx wrangler pages project create phos --production-branch main
npx wrangler pages deploy dist --project-name phos --branch main
```

## Health
- `GET /health` — liveness (via Astro API route)
- `GET /manifest` — app manifest

## Test
```bash
npm run test
```
