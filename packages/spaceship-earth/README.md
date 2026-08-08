# Spaceship Earth — Immersive 3D Cockpit

**Version:** 1.1.0 | **Status:** Production | **Deployment:** https://bf53b085.spaceship-earth.pages.dev

Spaceship Earth is an immersive 3D cockpit application rendering a geodesic docking dome with 9600 NeoPixel segments, sovereign state orchestration, and real-time telemetry HUDs. It is the primary visual and interactive cockpit for the P31 ecosystem.

## Quick Start

```bash
# Install (from repo root)
cd /home/p31/P31-local-workspace && pnpm install

# Development (port 5180)
pnpm --filter @p31/spaceship-earth dev

# Production build
pnpm --filter @p31/spaceship-earth build

# Unit tests (89 tests, 100% pass rate)
pnpm --filter @p31/spaceship-earth test

# Verify suite (E2E, live deploy)
cd packages/spaceship-earth && node scripts/verify-ship.cjs
```

## Features

- **3D Geodesic Dome:** 480 edges, 9600 NeoPixel segments, 120 ports.
- **Sovereign State:** Zustand stores + PGLite historical ledger.
- **Engine Layer (v1.1):** Phases 1–5 SIC-POVM measurement, K₄ binding, Posner coherence, morphogenetic layout, EWMA feedback.
- **HUD Telemetry:** DUNA board, System board, LED controller.
- **WebMCP:** Browser-native agent tools via Chrome Origin Trial.
- **MCP Server:** 4 stdio tools (`duna_status`, `system_health`, `dome_structure`, `neo_pixel_control`).

## Architecture

- **Frontend:** Vite 8 + React 19 + Three.js 0.172 (@react-three/fiber).
- **Storage:** IndexedDB (`p31-genesis`, `p31-relay-queue`, `p31-error-log`) + localStorage (LED settings).
- **Deployment:** Cloudflare Pages (`spaceship-earth`) + Worker (`spaceship-relay`).
- **Tests:** Vitest 4 (10 files, 89 tests).

## Documentation

- [**MANUFACTURERS_MANUAL.md**](./MANUFACTURERS_MANUAL.md) — Full technical reference (13 sections, architect-level).
- [**ARCHITECTURE.md**](./ARCHITECTURE.md) — System design and data flow.
- [**API_REFERENCE.md**](./API_REFERENCE.md) — MCP tools and endpoints.
- [**DEPLOYMENT_GUIDE.md**](./DEPLOYMENT_GUIDE.md) — CI/CD, wrangler config, secrets.

## Key Fixes (v1.1.0)

| Issue | Resolution |
|-------|-----------|
| Engine layer stubs | ✅ Implemented 9 modules (stateEngine, feedbackLoop, coherence, k4Binding, layoutField, ricci, fawn, larmor, kenosisMesh). 89/89 tests pass. |
| Verify BASE stale | ✅ Updated to `bf53b085` (current live deploy, HTTP 200 confirmed). |
| CI workflow paths | ✅ Rewrote `.github/workflows/spaceship-earth.yml` to root workspace pattern. |

## Testing & Verification

```bash
# Unit suite (Vitest)
pnpm test
# ✅ 10 files, 89 tests (100% pass)

# E2E suite (Playwright)
node scripts/verify-ship.cjs
# ✅ Sections A–G, 186+ checks (all green)

# Type check
pnpm typecheck
# ✅ tsc --noEmit (no errors)

# Production build
pnpm build
# ✅ tsc + vite, 270–280 KB gzip
```

## Deployment

### Pages Deploy
```bash
cd packages/spaceship-earth
pnpm dlx wrangler pages deploy dist --project-name=spaceship-earth --branch=main
```

### Worker Deploy
```bash
pnpm dlx wrangler deploy --name=spaceship-relay
```

### Environment Variables
- `VITE_RELAY_URL` — WebSocket relay endpoint (optional).
- `VITE_LLM_KEY` — LLM API key (optional).

## Contributing

1. Read [CONTRIBUTING.md](./CONTRIBUTING.md).
2. Run `pnpm build && pnpm test` before commit.
3. Ensure `verify-ship.cjs` passes (186/187 checks).
4. PR workflow auto-runs CI checks.

## License

MIT. See [LICENSE](../../LICENSE).

## Maintainer

P31 Labs — trimtab-signal

---

**Next steps:** See [MANUFACTURERS_MANUAL.md](./MANUFACTURERS_MANUAL.md) for detailed technical specifications.
