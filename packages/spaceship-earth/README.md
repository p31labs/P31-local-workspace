# Spaceship Earth — Immersive 3D Cockpit

**Version:** 1.2.0 | **Status:** Production | **Deployment:** https://spaceship-earth.pages.dev

Spaceship Earth is an immersive 3D cockpit application rendering a geodesic docking dome with 9600 NeoPixel segments, sovereign state orchestration, and real-time telemetry HUDs. It is the primary visual and interactive cockpit for the P31 ecosystem.

## Quick Start

```bash
# Install (from repo root)
cd /home/p31/P31-local-workspace && pnpm install

# Development (port 5180)
pnpm --filter @p31/spaceship-earth dev

# Production build
pnpm --filter @p31/spaceship-earth build

# Unit tests (193 tests, 100% pass rate)
pnpm --filter @p31/spaceship-earth test

# Verify suite (E2E, live deploy)
cd packages/spaceship-earth && node scripts/verify-ship.cjs
```

## Features

- **3D Geodesic Dome:** 480 edges, 9600 NeoPixel segments, 320 interactive face ports.
- **Dymaxion (Bucky) Net:** Full-screen SVG overlay that unfolds the dome onto the verified Wikipedia icosahedron net — click-to-select mirrors 3D port selection.
- **Data Connectors:** Universal dataset layer (JSON / HAPI / SDG) mapped onto the 320 faces with legend, timeline scrubber, and share/export.
- **Sovereign State:** Zustand stores + PGLite historical ledger.
- **Engine Layer:** Phases 1–5 SIC-POVM measurement, K₄ binding, Posner coherence, morphogenetic layout, EWMA feedback.
- **HUD Telemetry:** DUNA board, System board, LED controller, SpoonPulse.
- **WebMCP:** Browser-native agent tools via Chrome Origin Trial.
- **MCP Server:** 4 stdio tools (`duna_status`, `system_health`, `dome_structure`, `neo_pixel_control`).

## Architecture

- **Frontend:** Vite 8 + React 19 + Three.js 0.172 (@react-three/fiber).
- **Storage:** IndexedDB (`p31-genesis`, `p31-relay-queue`, `p31-error-log`) + localStorage (LED settings).
- **Deployment:** Cloudflare Pages (`spaceship-earth`) + Worker (`spaceship-relay`).
- **Tests:** Vitest 4 (18 files, 193 tests).

## Documentation

- [**MANUFACTURERS_MANUAL.md**](./MANUFACTURERS_MANUAL.md) — Full technical reference (13 sections, architect-level).
- [**ARCHITECTURE.md**](./ARCHITECTURE.md) — System design and data flow.
- [**API_REFERENCE.md**](./API_REFERENCE.md) — MCP tools and endpoints.
- [**DEPLOYMENT_GUIDE.md**](./DEPLOYMENT_GUIDE.md) — CI/CD, wrangler config, secrets.
- [**src/cockpit/PERFORMANCE_AUDIT.md**](./src/cockpit/PERFORMANCE_AUDIT.md) — Dome renderer draw-call analysis.

## Key Fixes (v1.2.0)

| Issue | Resolution |
|-------|-----------|
| 320 face targets | ✅ All 320 dome faces interactive — invisible hit targets at face centroids (`PORT_COUNT = 320`). |
| Dymaxion net | ✅ New `engine/dymaxion.ts` + `cockpit/BuckyView.tsx` — verified Wikipedia net, 14 dymaxion tests. |
| Data connectors | ✅ New dataset layer (`datasetStore`, `datasetParser`, `timeSeries`, `share`) + DatasetPanel, Legend, TimeControls, ExportButton, Onboarding. |
| Universal mapping | ✅ `faceMapper` maps any dataset vertex/face onto the 320 dome faces. |

## Testing & Verification

```bash
# Unit suite (Vitest)
pnpm test
# ✅ 18 files, 193 tests (100% pass)

# E2E suite (Playwright)
node scripts/verify-ship.cjs
# ✅ Sections A–G against live deploy

# Type check
pnpm typecheck
# ✅ tsc --noEmit (no errors)

# Production build
pnpm build
# ✅ tsc + vite, ~310 KB gzip (main bundle)
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
3. Ensure `verify-ship.cjs` passes against the live deploy.
4. PR workflow auto-runs CI checks.

## License

MIT. See [LICENSE](../../LICENSE).

## Maintainer

P31 Labs — trimtab-signal

---

**Next steps:** See [MANUFACTURERS_MANUAL.md](./MANUFACTURERS_MANUAL.md) for detailed technical specifications.
