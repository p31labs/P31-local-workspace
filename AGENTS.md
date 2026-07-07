# P31 Labs — Agent Instructions

## Project Overview
P31 Labs builds open-source assistive technology for neurodivergent individuals. Monorepo at `/home/p31/P31-local-workspace`.

## Architecture
- **Stack:** Cloudflare Workers + Pages, Astro, React 19, Tailwind, Vite, pnpm workspaces
- **Frontend apps:** `apps/phos` (phos.p31ca.org), `apps/willow` (willow.p31ca.org), `apps/bonding` (bonding.p31ca.org), `apps/p31ca` (p31ca.org), `apps/phosphorus31` (phosphorus31.org)
- **Backend workers:** `apps/gateway` (gateway.p31ca.org), `apps/status` (status.p31ca.org), `apps/auth` (p31-auth), `software/cloudflare-worker/llm-proxy` (p31-llm-proxy)
- **Shared packages:** `packages/design-system`, `packages/auth`
- **Free Plan limits:** 100k req/day, 200k log events/day, 10 D1 databases, 5 cron triggers

## Design System

Visual identity, component guidelines, and neuroinclusive invariants are encoded in [`DESIGN.md`](./DESIGN.md) at the repo root (Google Labs `DESIGN.md` spec). When generating or modifying UI, agents MUST read `DESIGN.md` and must not violate its hard invariants:
- **Spoon-aware motion** — all animation/transition respects the `data-spoons` (0–5) attribute; motion is fully disabled at `spoons` 0–1.
- **Glassmorphism** — elevated surfaces use `.glass-panel` / `.glass-card` (`backdrop-filter: blur(12px)`, 24px radius).
- **Crisis Mode** — at `spoons === 0` no UI chrome may render; only the breathing overlay + exit control (Escape / "I'm ready").
- **Single accent** — `quantum-cyan` is the only primary accent; never pure white/black text or backgrounds.

## Build & Deploy Commands

### phos (Astro + React)
Build: `cd apps/phos && bash node_modules/.bin/astro build` (Node 24 needs shell wrapper)
Deploy: `cd apps/phos && npx wrangler pages deploy dist --project-name phos --commit-dirty=true`

### p31ca (Astro static)
Build: `cd apps/p31ca && bash node_modules/.bin/astro build`
Deploy: `cd apps/p31ca && npx wrangler pages deploy dist --project-name p31ca --commit-dirty=true`

### phosphorus31 (Astro hybrid)
Build: `cd apps/phosphorus31 && npm run build`
Deploy: `cd apps/phosphorus31 && npx wrangler pages deploy dist --project-name phosphorus31-org --commit-dirty=true`

### bonding (Vite React SPA)
Build: `cd apps/bonding && npm run build`
Deploy: `cd apps/bonding && npx wrangler pages deploy dist --project-name bonding --commit-dirty=true`

### willow (Vite React SPA)
Build: `cd apps/willow && npm run build`
Deploy: `cd apps/willow && npx wrangler pages deploy dist --project-name willow --commit-dirty=true`

### gateway
Deploy: `cd apps/gateway && npx wrangler deploy`

### status
Deploy: `cd apps/status && npx wrangler deploy`

### auth
Deploy: `cd apps/auth && npx wrangler deploy`

### llm-proxy
Deploy: `cd software/cloudflare-worker/llm-proxy && npx wrangler deploy`

### counterscale
Build server: `cd apps/counterscale/packages/server && npm run build`
Deploy: `cd apps/counterscale/packages/server && npx wrangler deploy`

## Infrastructure

### Service Bindings
- `gateway.phos_ai_proxy` → `p31-llm-proxy` (LLM routing)
- Gateway routes: `/api/*` (auth-protected), `/ai/chat` (public, rewrites to LLM proxy)

### Cron Triggers (5 max on Free Plan)
- p31-status: `*/15 * * * *`
- command-center: `*/5 * * * *`
- love-ledger: `0 */6 * * *`
- p31-cortex: `0 7,18 * * *`
- counterscale: `0 2 * * *` (daily rollups)

### Observability
- Built-in: `[observability] enabled = true` in wrangler.toml
- Axiom OTLP: `https://api.axiom.co/v1/logs` (dataset: p31-workers)
- Sentry: phos, bonding, gateway, auth (via @sentry/react or @sentry/cloudflare)

### D1 Databases (6 of 10 used)
- p31-status-db (status page history), p31-auth, p31-cortex, love-ledger, k4-cage-db, sovereign-justice-db

### Analytics
- Counterscale at analytics.p31ca.org (self-hosted, Analytics Engine)
- Tracking: `<script defer src="https://analytics.p31ca.org/tracker.js" data-domain="SITE">`

### Auth
- DID:key login via `apps/auth` + `packages/auth`
- JWT session in localStorage under `p31-auth`
- Write routes on gateway require `Authorization: Bearer <JWT>`

## Counterscale Setup Notes
- Analytics Engine dataset: `metricsDataset`, binding: `WEB_COUNTER_AE`
- R2 bucket: `counterscale-daily-rollups`
- Tracker package: `apps/counterscale/packages/tracker`
- Build tracker first: `cd apps/counterscale/packages/tracker && npm run build`
- Then copy: `cp ../tracker/dist/loader/tracker.js ../server/public/`
- Then rebuild server: `cd apps/counterscale/packages/server && npm run build`

## GitHub Actions Secrets (Manual — API token lacks secrets scope)
These must be added at https://github.com/p31labs/P31-local-workspace/settings/secrets/actions:
- `CLOUDFLARE_API_TOKEN` — Wrangler OAuth token (`cfoat_...` from `~/.wrangler/config/default.toml`) or Cloudflare API Token with Workers + Pages edit
- `SENTRY_DSN` — Sentry project DSN (same value as `wrangler secret put SENTRY_DSN`)

## Communication Style
- Direct. Skip preamble. Output code and commands.
- Never use submarine, naval, or military metaphors.
- Spoon-aware UI (0–5 scale via `data-spoons` attribute) mandatory for all surfaces.

## WCAG 2.2 AAA Compliance (Baseline — July 2026)
- **Touch targets:** All interactive elements ≥48×48px (WCAG 2.5.8 Enhanced).
- **Contrast ratios:** All text ≥4.5:1 AA (≥7:1 for AAA preferred). Avoid `text-white/30` and `text-white/50` on dark backgrounds. Use `text-white/50` and `text-white/70` for AA/AAA compliance.
- **Focus indicators:** Global `:focus-visible` outline (2px `var(--phos-primary)`, offset 2px).
- **Skip navigation:** `<a href="#main-content" class="skip-link">` in `index.astro`.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` sets all durations to 0ms (`motion.css`). `data-reduced-motion` attribute fallback. Crisis mode (spoons=0) also disables motion.
- **ARIA labels:** All icon buttons have `aria-label`, all SVGs have `aria-hidden="true"`. Navigation has `role="navigation"` + `aria-label`. Chat messages use `aria-live="polite"`.
- **Voice input:** `VoiceInputButton` detects `isSupported`, shows disabled state with "Voice input unavailable" when unsupported. Dual engine (local WASM + edge fallback).
- **Keyboard navigation:** Tab order logical (left→right, top→bottom). Enter/Space triggers buttons. Escape closes magic drawer (handled in `PHOSMagicDrawer`).
- **Automated audit:** axe-core (`@axe-core/playwright`) scan yields 0 violations (WCAG 2 A + AA + AAA). Run with `node scripts/audit-wcag.mjs`.
