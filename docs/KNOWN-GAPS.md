# P31 Known Gaps — Honest Assessment

**Date:** 2026-07-15
**Purpose:** Transparent inventory of incomplete features for NGI submission and contributor roadmap.

---

## PHOS v2 Phase System

The PHOS v2 system (`apps/p31ca/src/phos-v2/`) is an experimental 8-phase architecture for ambient neurodivergent computing. **None of the stubbed phases are in production code paths** — the live PHOS surface (`apps/phos`) uses the stable v1 workspace. The v2 system is isolated research work.

| Phase | Feature | Completion | Core TODOs | Effort | Dependency |
|-------|---------|-----------|------------|--------|------------|
| 1: Voice | Browser-native Whisper speech recognition | ~10% | 3 (WASM model load, audio capture, inference) | 5-9 days | None |
| 2: Bros | Persona switching engine | ~85% | 0 (placeholder personas only) | Done | Phase 1 |
| 3: Router | Mesh routing + K4 vertex management | ~60% | 2 (handoff protocol, intent resolution) | 4-7 days | K4 topology |
| 4: Visual | Three.js 3D constellation visualization | ~5% | 5 (scene, render loop, highlight, camera, modes) | 8-15 days | Phase 1,2,3 |
| 5: Predictive | ML intent prediction + suggestions | ~15% | 3 (model, inference, suggestions) | 9-21 days | Phase 8 Memory |
| 6: Guardian | Child safety + content filtering | ~20% | 3 (safety rules, content check, activity reports) | 6-9 days | Phase 8 Memory |
| 7: Bridge | Native platform bridge (iOS/Android/Desktop) | ~25% | 2 (native bridge, sync) | 14-26 days | Disabled in prod |
| 8: Memory | Long-term context + preference persistence | ~70% | 1 (persistence backend) | 2-3 days | None |

**Critical path to first demo:** Memory persistence (2-3d) → Router handoff (4-7d) → Voice WASM (5-9d) → Visual Three.js (8-15d) = **19-34 days for Week 4 "First Major Demo"**

---

## Feature Gaps

| Feature | Status | Plan |
|---------|--------|------|
| **i18n / Localization** | 16 keys (onboarding portal only) in 4 languages (en/es/fr/de). ~500 translatable strings remain across 34 surfaces. | Phase 1: infrastructure + JSON dict files. Phase 2: P0 surfaces (Passport, Governance, Onboarding, MagicDrawer). Phase 3: remaining surfaces. |
| **E2E Tests (gateway, auth, care-mesh)** | 0 tests. Gateway has 18 endpoint scenarios, auth has 10, care-mesh has 8 — all untested. | Miniflare-based vitest integration tests. Gateway and auth first (critical path for all API consumption). |
| **E2E Tests (bridge workers)** | HTTP endpoint tests missing for ledger-bridge (12 scenarios) and federation-bridge (15 scenarios). Unit tests exist. | Post-gateway/auth test work. |
| **D1 Migration Rollbacks** | 30 migration files, 0 companion `_down.sql` files. 4 migrations contain court-admissible evidence with hard rollback risk. | 14 SIMPLE _down.sql written. 12 MEDIUM documented. 4 HARD: R2 cold-archive restore procedure. |
| **pglite WASM size** | 9.5MB loads on every p31ca page. 48MB total PHOS dist. | Lazy-loaded via manualChunks + React.lazy/Suspense (implemented 2026-07-15). |
| **EUDI Wallet certification** | Technical readiness confirmed (6 endpoints). No formal EBSI conformance harness run. | Documented gap in `docs/EUDI-CERTIFICATION.md`. No public harness available. |
| **Hybrid PQC TLS** | Not enabled on p31ca.org zone (requires Cloudflare dashboard access). | Manual ops step — documented in `docs/POST-LAUNCH-ROADMAP.md`. |
| **GitHub Secrets** | `DISCORD_WEBHOOK_PHOS`, `DISCORD_WEBHOOK_WILLOW` not set. Blocks community launch. | Manual ops step. |

---

## Honest Limitations

1. **P31 does not have a mobile app.** All surfaces are web-only. The Bridge phase (PHOS v2 Phase 7) is designed for this but is 25% complete and disabled in production.

2. **P31 does not have automated content moderation.** The Guardian phase (PHOS v2 Phase 6) is 20% complete. Content safety checks are planned but not implemented.

3. **P31's ML capabilities are stubs.** The Predictive phase (PHOS v2 Phase 5) has no model loaded and no inference capability. All suggestions are placeholders.

4. **P31's 3D visualizations are static.** The Visual phase (PHOS v2 Phase 4) has no Three.js integration. The current K4 hero SVG and molecular field DOM renderings are the only visualizations.

5. **P31 does not have offline-first data synchronization.** PGlite provides local storage but cross-device sync is not implemented.

6. **P31's i18n covers 16 strings out of ~500.** Only the onboarding portal is translated. The rest of the platform is English-only.

---

*This document is maintained honestly. Every gap listed here is a known limitation, not a surprise. We document what we haven't built so contributors know where to help.*
