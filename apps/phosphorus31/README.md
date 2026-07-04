# phosphorus31.org

<!-- pmm-badge -->
![PMM Maturity](../../.p31/badges/phosphorus31.svg)
<!-- /pmm-badge -->

[![PMM Stage: FRUIT](https://img.shields.io/badge/PMM-FRUIT-22c55e?style=flat-square)](.pmm-stage)

Institutional site for P31 Labs, Inc. — research, products, and the Planetary Planet initiative.

## Stack

- **Astro 5** with React islands
- **Tailwind CSS v4** (via `@tailwindcss/vite`)
- **nanostores** for lightweight client state
- **Deployed to** Cloudflare Pages via `wrangler`

## Quick start

```bash
npm install
npm run dev        # local dev at localhost:4321
npm run build      # production build → dist/
npm run test       # vitest with coverage
```

## Health

```bash
curl https://phosphorus31.org/api/health
# → {"status":"ok","version":"0.0.1","service":"phosphorus31.org","timestamp":"…"}
```

## CI/CD

| Event | Action |
|-------|--------|
| PR to `main` | Build only |
| Push to `main` | Build + deploy to Cloudflare Pages |

See `.github/workflows/phosphorus31-site.yml`.

## PMM Maturity

This project is at **FRUIT** (PMM Stage 5) — all five dimensions scored ≥4, average ≥4.5.
