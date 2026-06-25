# P31 Maturity Model — Repository Grading Report

**Generated:** 2026-06-25T06:33:56
**Schema:** PMM_SCHEMA=1.1
**Total artifacts graded:** 85
**Overrides applied:** 6
**Scan duration:** 17.76s

## Summary

| Stage | Count |
|-------|-------|
| 🍎 **FRUIT** | 0 |
| 🌸 **BLOOM** | 1 |
| 🌳 **SAPLING** | 3 |
| 🌿 **SPROUT** | 38 |
| 🌱 **SEED** | 43 |

## Full Artifact Index

| Stage | Path | CODE | TEST | DOCS | OPS | SEC | STYLE | Overall | Weakest | Override |
|-------|------|------|------|------|-----|-----|-------|---------|---------|----------|
| 🌱 SEED | `admin` | 5 | 1 | 2 | 4 | 2 | 2 | 1 | TEST |  |
| 🌱 SEED | `apps` | 1 | 1 | 4 | 4 | 2 | 2 | 1 | CODE, TEST |  |
| 🌱 SEED | `ecosystem/analytics` | 5 | 3 | 2 | 4 | 2 | 1 | 1 | STYLE |  |
| 🌱 SEED | `ecosystem/discord` | 5 | 3 | 5 | 4 | 2 | 1 | 1 | STYLE |  |
| 🌱 SEED | `ecosystem/gamification` | 5 | 3 | 2 | 4 | 2 | 1 | 1 | STYLE |  |
| 🌱 SEED | `ecosystem/ipfs` | 4 | 3 | 2 | 4 | 2 | 1 | 1 | STYLE |  |
| 🌱 SEED | `ecosystem/middleware` | 4 | 3 | 2 | 4 | 2 | 1 | 1 | STYLE |  |
| 🌱 SEED | `firmware` | 5 | 1 | 4 | 4 | 2 | 2 | 1 | TEST |  |
| 🌱 SEED | `p31labs/social-content-engine` | 4 | 2 | 4 | 4 | 2 | 1 | 1 | STYLE |  |
| 🌱 SEED | `packages` | 2 | 1 | 4 | 4 | 2 | 2 | 1 | TEST |  |
| 🌱 SEED | `packages/sovereign-core/pkg` | 5 | 1 | 4 | 4 | 2 | 1 | 1 | TEST, STYLE |  |
| 🌱 SEED | `scripts` | 5 | 1 | 4 | 4 | 2 | 2 | 1 | TEST |  |
| 🌱 SEED | `software/cloudflare-worker` | 5 | 3 | 4 | 4 | 3 | 1 | 1 | STYLE |  |
| 🌱 SEED | `software/cloudflare-worker/bouncer` | 3 | 2 | 3 | 4 | 3 | 1 | 1 | STYLE |  |
| 🌱 SEED | `software/cloudflare-worker/command-center` | 5 | 4 | 5 | 4 | 3 | 1 | 1 | STYLE |  |
| 🌱 SEED | `software/cloudflare-worker/p31-gumroad-webhook` | 4 | 1 | 4 | 4 | 3 | 1 | 1 | TEST, STYLE |  |
| 🌱 SEED | `software/cloudflare-worker/social-drop-automation` | 5 | 2 | 4 | 4 | 3 | 1 | 1 | STYLE |  |
| 🌱 SEED | `software/donate-api` | 4 | 4 | 3 | 4 | 3 | 1 | 1 | STYLE |  |
| 🌱 SEED | `software/extensions/p31-cockpit-panel` | 3 | 2 | 4 | 4 | 3 | 1 | 1 | STYLE |  |
| 🌱 SEED | `software/extensions/p31-cognitive-shield` | 3 | 2 | 4 | 4 | 3 | 1 | 1 | STYLE |  |
| 🌱 SEED | `software/extensions/p31-progressive-disclosure` | 4 | 2 | 4 | 4 | 3 | 1 | 1 | STYLE |  |
| 🌱 SEED | `software/extensions/p31-spoon-gauge` | 3 | 2 | 4 | 4 | 3 | 1 | 1 | STYLE |  |
| 🌱 SEED | `software/extensions/p31ca` | 4 | 2 | 2 | 4 | 3 | 1 | 1 | STYLE |  |
| 🌱 SEED | `software/geodesic-room` | 5 | 2 | 3 | 4 | 3 | 1 | 1 | STYLE |  |
| 🌱 SEED | `software/k4-cage` | 5 | 3 | 3 | 4 | 3 | 1 | 1 | STYLE |  |
| 🌱 SEED | `software/k4-hubs` | 4 | 3 | 2 | 4 | 3 | 1 | 1 | STYLE |  |
| 🌱 SEED | `software/k4-personal` | 5 | 3 | 4 | 4 | 3 | 1 | 1 | STYLE |  |
| 🌱 SEED | `software/kenosis-mesh` | 4 | 2 | 4 | 4 | 3 | 1 | 1 | STYLE |  |
| 🌱 SEED | `software/p31-agent-hub` | 5 | 2 | 3 | 4 | 3 | 1 | 1 | STYLE |  |
| 🌱 SEED | `software/p31-cortex` | 5 | 3 | 2 | 4 | 3 | 1 | 1 | STYLE |  |
| 🌱 SEED | `software/p31-dashboard` | 3 | 1 | 4 | 4 | 3 | 2 | 1 | TEST |  |
| 🌱 SEED | `software/p31-forge` | 5 | 3 | 4 | 4 | 3 | 1 | 1 | STYLE |  |
| 🌱 SEED | `software/p31-google-bridge` | 5 | 2 | 4 | 4 | 3 | 1 | 1 | STYLE |  |
| 🌱 SEED | `software/p31ca/workers/fhir` | 5 | 2 | 3 | 4 | 3 | 1 | 1 | STYLE |  |
| 🌱 SEED | `software/p31ca/workers/sync` | 3 | 2 | 3 | 4 | 3 | 1 | 1 | STYLE |  |
| 🌱 SEED | `software/packages/k4-mesh-core` | 5 | 3 | 4 | 4 | 3 | 1 | 1 | STYLE |  |
| 🌱 SEED | `software/packages/quantum-edge` | 4 | 2 | 4 | 4 | 3 | 1 | 1 | STYLE |  |
| 🌱 SEED | `software/packages/sovereign` | 4 | 2 | 4 | 4 | 3 | 1 | 1 | STYLE |  |
| 🌱 SEED | `software/telemetry-worker` | 4 | 3 | 3 | 4 | 3 | 1 | 1 | STYLE |  |
| 🌱 SEED | `software/workers` | 5 | 3 | 5 | 4 | 3 | 1 | 1 | STYLE |  |
| 🌱 SEED | `tools` | 1 | 1 | 4 | 4 | 2 | 2 | 1 | CODE, TEST |  |
| 🌱 SEED | `tools/phos-forge` | 5 | 3 | 4 | 4 | 2 | 1 | 1 | STYLE |  |
| 🌱 SEED | `wcds` | 4 | 1 | 4 | 4 | 2 | 2 | 1 | TEST |  |
| 🌿 SPROUT | `apps/willow` | 4 | 4 | 2 | 4 | 2 | 2 | 2 | DOCS, SEC, STYLE |  |
| 🌿 SPROUT | `cli` | 4 | 3 | 5 | 4 | 2 | 2 | 2 | SEC, STYLE |  |
| 🌿 SPROUT | `ecosystem` | 5 | 3 | 2 | 4 | 2 | 2 | 2 | DOCS, SEC, STYLE |  |
| 🌿 SPROUT | `interfaces` | 4 | 3 | 4 | 4 | 2 | 2 | 2 | SEC, STYLE |  |
| 🌿 SPROUT | `p31-surrogate-backend` | 5 | 2 | 4 | 4 | 2 | 2 | 2 | TEST, SEC, STYLE |  |
| 🌿 SPROUT | `p31labs` | 2 | 3 | 4 | 4 | 2 | 2 | 2 | CODE, SEC, STYLE |  |
| 🌿 SPROUT | `phos` | 5 | 4 | 3 | 4 | 2 | 2 | 2 | SEC, STYLE |  |
| 🌿 SPROUT | `phosphorus31.org` | 2 | 3 | 4 | 4 | 2 | 2 | 2 | CODE, SEC, STYLE |  |
| 🌿 SPROUT | `phosphorus31.org/planetary-planet` | 5 | 3 | 3 | 4 | 2 | 2 | 2 | SEC, STYLE |  |
| 🌿 SPROUT | `software` | 5 | 3 | 4 | 4 | 3 | 2 | 2 | STYLE |  |
| 🌿 SPROUT | `software/discord/p31-bot` | 5 | 3 | 5 | 4 | 3 | 2 | 2 | STYLE |  |
| 🌿 SPROUT | `software/docs` | 3 | 2 | 4 | 4 | 3 | 2 | 2 | TEST, STYLE |  |
| 🌿 SPROUT | `software/frontend` | 5 | 3 | 4 | 4 | 3 | 2 | 2 | STYLE |  |
| 🌿 SPROUT | `software/p31-hearing-ops` | 5 | 4 | 4 | 4 | 3 | 2 | 2 | STYLE |  |
| 🌿 SPROUT | `software/p31ca` | 5 | 4 | 3 | 4 | 3 | 2 | 2 | STYLE |  |
| 🌿 SPROUT | `software/p31ca/workers/glass-box-ws` | 4 | 2 | 3 | 4 | 3 | 2 | 2 | TEST, STYLE |  |
| 🌿 SPROUT | `software/packages/brain-dump-orchestrator` | 5 | 5 | 3 | 4 | 3 | 5 | 3 | DOCS, SEC | operator baseline |
| 🌿 SPROUT | `software/packages/game-engine` | 5 | 4 | 5 | 4 | 3 | 2 | 2 | STYLE |  |
| 🌿 SPROUT | `software/packages/harmonic-linter` | 4 | 3 | 5 | 4 | 3 | 2 | 2 | STYLE |  |
| 🌿 SPROUT | `software/packages/jitterbug-api` | 5 | 3 | 3 | 4 | 3 | 2 | 2 | STYLE | operator baseline |
| 🌿 SPROUT | `software/packages/love-ledger` | 5 | 3 | 3 | 4 | 3 | 2 | 2 | STYLE |  |
| 🌿 SPROUT | `software/packages/node-zero` | 5 | 3 | 4 | 4 | 3 | 2 | 2 | STYLE |  |
| 🌿 SPROUT | `software/packages/node-zero/pwa` | 5 | 2 | 4 | 4 | 3 | 2 | 2 | TEST, STYLE |  |
| 🌿 SPROUT | `software/packages/oracle-terminal` | 4 | 2 | 5 | 4 | 3 | 2 | 2 | TEST, STYLE |  |
| 🌿 SPROUT | `software/packages/q-distribution` | 3 | 2 | 5 | 4 | 3 | 2 | 2 | TEST, STYLE |  |
| 🌿 SPROUT | `software/packages/quantum-core` | 5 | 3 | 5 | 4 | 3 | 2 | 2 | STYLE |  |
| 🌿 SPROUT | `software/packages/shared` | 5 | 4 | 5 | 4 | 3 | 2 | 2 | STYLE |  |
| 🌿 SPROUT | `software/packages/sovereign-sdk` | 4 | 2 | 4 | 4 | 3 | 2 | 2 | TEST, STYLE |  |
| 🌿 SPROUT | `software/sovereign-command-center` | 4 | 2 | 5 | 4 | 3 | 2 | 2 | TEST, STYLE |  |
| 🌿 SPROUT | `software/spaceship-earth` | 5 | 3 | 4 | 4 | 3 | 2 | 2 | STYLE |  |
| 🌿 SPROUT | `software/spaceship-earth/astro-landing` | 2 | 2 | 2 | 4 | 3 | 2 | 2 | CODE, TEST, DOCS, STYLE |  |
| 🌿 SPROUT | `software/spin-mesh` | 5 | 3 | 4 | 4 | 3 | 2 | 2 | STYLE |  |
| 🌿 SPROUT | `software/spin-mesh/logistics-do` | 4 | 2 | 4 | 4 | 3 | 2 | 2 | TEST, STYLE |  |
| 🌿 SPROUT | `software/spin-mesh/matchmaking-do` | 4 | 2 | 4 | 4 | 3 | 2 | 2 | TEST, STYLE |  |
| 🌿 SPROUT | `software/spoon-calculator` | 4 | 2 | 5 | 4 | 3 | 2 | 2 | TEST, STYLE |  |
| 🌿 SPROUT | `src` | 5 | 2 | 4 | 4 | 2 | 2 | 2 | TEST, SEC, STYLE |  |
| 🌿 SPROUT | `tests` | 2 | 3 | 2 | 4 | 2 | 2 | 2 | CODE, DOCS, SEC, STYLE |  |
| 🌿 SPROUT | `weave-machine` | 4 | 2 | 4 | 4 | 2 | 2 | 2 | TEST, SEC, STYLE |  |
| 🌳 SAPLING | `software/p31-delta-hiring` | 3 | 2 | 3 | 2 | 2 | 1 | 1 | STYLE | operator baseline |
| 🌳 SAPLING | `software/packages/agent-engine` | 3 | 3 | 2 | 1 | 2 | 1 | 1 | OPS, STYLE | operator baseline |
| 🌳 SAPLING | `software/packages/jitterbug-pwa` | 5 | 3 | 5 | 4 | 3 | 5 | 3 | TEST, SEC |  |
| 🌸 BLOOM | `software/bonding` | 4 | 4 | 3 | 4 | 3 | 3 | 3 | DOCS, SEC, STYLE | operator baseline |

## Evidence Notes

| Path | CODE | TEST | DOCS | OPS | SEC | STYLE |
|------|------|------|------|-----|-----|-------|
| `admin` | 837 lines, mature codebase | No test files | README exists (43 lines) but no usage examples | CI/CD pipeline | Lockfile present (lockfile (pnpm-lock.yaml)) | Build present, no CSS pipeline |
| `apps` | No source files | No test files | Detailed docs (52 lines, examples) | CI/CD pipeline | Lockfile present (lockfile (pnpm-lock.yaml)) | Build present, no CSS pipeline |
| `ecosystem/analytics` | 1018 lines, mature codebase | Basic tests (18 assertions) | README exists (6 lines) but no usage examples | CI/CD pipeline | Lockfile present (lockfile (pnpm-lock.yaml)) | No CSS pipeline evidence |
| `ecosystem/discord` | 830 lines, mature codebase | Basic tests (18 assertions) | Comprehensive docs (307 lines, examples, TOC) | CI/CD pipeline | Lockfile present (lockfile (pnpm-lock.yaml)) | No CSS pipeline evidence |
| `ecosystem/gamification` | 708 lines, mature codebase | Basic tests (18 assertions) | README exists (6 lines) but no usage examples | CI/CD pipeline | Lockfile present (lockfile (pnpm-lock.yaml)) | No CSS pipeline evidence |
| `ecosystem/ipfs` | 395 lines of real logic | Basic tests (18 assertions) | README exists (6 lines) but no usage examples | CI/CD pipeline | Lockfile present (lockfile (pnpm-lock.yaml)) | No CSS pipeline evidence |
| `ecosystem/middleware` | 491 lines of real logic | Basic tests (18 assertions) | README exists (6 lines) but no usage examples | CI/CD pipeline | Lockfile present (lockfile (pnpm-lock.yaml)) | No CSS pipeline evidence |
| `firmware` | 1932 lines, mature codebase | No test files | Detailed docs (52 lines, examples) | CI/CD pipeline | Lockfile present (lockfile (pnpm-lock.yaml)) | Build present, no CSS pipeline |
| `p31labs/social-content-engine` | 326 lines of real logic | Minimal tests (0 assertions) | Detailed docs (52 lines, examples) | CI/CD pipeline | Lockfile present (lockfile (pnpm-lock.yaml)) | No CSS pipeline evidence |
| `packages` | Minimal implementation | No test files | Detailed docs (52 lines, examples) | CI/CD pipeline | Lockfile present (lockfile (pnpm-lock.yaml)) | Build present, no CSS pipeline |
| `packages/sovereign-core/pkg` | 615 lines, mature codebase | No test files | Detailed docs (52 lines, examples) | CI/CD pipeline | Lockfile present (lockfile (pnpm-lock.yaml)) | No CSS pipeline evidence |
| `scripts` | 8722 lines, mature codebase | No test files | Detailed docs (52 lines, examples) | CI/CD pipeline | Lockfile present (lockfile (pnpm-lock.yaml)) | Build present, no CSS pipeline |
| `software/cloudflare-worker` | 2012 lines, mature codebase | Basic tests (17 assertions) | Detailed docs (79 lines, examples) | CI/CD with wrangler deploy | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | No CSS pipeline evidence |
| `software/cloudflare-worker/bouncer` | 77 lines of real logic | Minimal tests (0 assertions) | README with usage (33 lines) | CI/CD with wrangler deploy | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | No CSS pipeline evidence |
| `software/cloudflare-worker/command-center` | 7897 lines, mature codebase | Comprehensive tests (241 assertions) + vitest thresholds | Comprehensive docs (119 lines, examples, TOC) | CI/CD with wrangler deploy | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | No CSS pipeline evidence |
| `software/cloudflare-worker/p31-gumroad-webhook` | 175 lines of real logic | No test files | Detailed docs (79 lines, examples) | CI/CD with wrangler deploy | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | No CSS pipeline evidence |
| `software/cloudflare-worker/social-drop-automation` | 766 lines, mature codebase | Minimal tests (0 assertions) | Detailed docs (79 lines, examples) | CI/CD with wrangler deploy | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | No CSS pipeline evidence |
| `software/donate-api` | 282 lines of real logic | Comprehensive tests (89 assertions) + vitest thresholds | README with usage (25 lines) | CI/CD with wrangler deploy | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | No CSS pipeline evidence |
| `software/extensions/p31-cockpit-panel` | 75 lines of real logic | Minimal tests (0 assertions) | Detailed docs (56 lines, examples) | CI/CD pipeline | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | No CSS pipeline evidence |
| `software/extensions/p31-cognitive-shield` | 68 lines of real logic | Minimal tests (0 assertions) | Detailed docs (56 lines, examples) | CI/CD pipeline | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | No CSS pipeline evidence |
| `software/extensions/p31-progressive-disclosure` | 105 lines of real logic | Minimal tests (0 assertions) | Detailed docs (56 lines, examples) | CI/CD pipeline | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | No CSS pipeline evidence |
| `software/extensions/p31-spoon-gauge` | 69 lines of real logic | Minimal tests (0 assertions) | Detailed docs (56 lines, examples) | CI/CD pipeline | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | No CSS pipeline evidence |
| `software/extensions/p31ca` | 444 lines of real logic | Minimal tests (0 assertions) | README exists (5 lines) but no usage examples | CI/CD pipeline | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | No CSS pipeline evidence |
| `software/geodesic-room` | 603 lines, mature codebase | Minimal tests (0 assertions) | README with usage (34 lines) | CI/CD with wrangler deploy | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | No CSS pipeline evidence |
| `software/k4-cage` | 721 lines, mature codebase | Basic tests (12 assertions) | README with usage (17 lines) | CI/CD with wrangler deploy | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | No CSS pipeline evidence |
| `software/k4-hubs` | 372 lines of real logic | Core paths tested (32 assertions) | README exists (19 lines) but no usage examples | CI/CD with wrangler deploy | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | No CSS pipeline evidence |
| `software/k4-personal` | 972 lines, mature codebase | Core paths tested (26 assertions) | Detailed docs (56 lines, examples) | CI/CD with wrangler deploy | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | No CSS pipeline evidence |
| `software/kenosis-mesh` | 400 lines of real logic | Minimal tests (0 assertions) | Detailed docs (148 lines, examples) | CI/CD with wrangler deploy | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | No CSS pipeline evidence |
| `software/p31-agent-hub` | 603 lines, mature codebase | Minimal tests (0 assertions) | README with usage (30 lines) | CI/CD with wrangler deploy | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | No CSS pipeline evidence |
| `software/p31-cortex` | 2704 lines, mature codebase | Basic tests (6 assertions) | README exists (18 lines) but no usage examples | CI/CD with wrangler deploy | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | No CSS pipeline evidence |
| `software/p31-dashboard` | 68 lines of real logic | No test files | Detailed docs (56 lines, examples) | CI/CD pipeline | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | CSS deps present but no entry file |
| `software/p31-forge` | 2895 lines, mature codebase | Basic tests (7 assertions) | Detailed docs (516 lines, examples) | CI/CD with wrangler deploy | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | No CSS pipeline evidence |
| `software/p31-google-bridge` | 656 lines, mature codebase | Minimal tests (0 assertions) | Detailed docs (86 lines, examples) | CI/CD with wrangler deploy | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | No CSS pipeline evidence |
| `software/p31ca/workers/fhir` | 594 lines, mature codebase | Minimal tests (0 assertions) | README with usage (38 lines) | CI/CD with wrangler deploy | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | No CSS pipeline evidence |
| `software/p31ca/workers/sync` | 97 lines of real logic | Minimal tests (0 assertions) | README with usage (38 lines) | CI/CD with wrangler deploy | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | No CSS pipeline evidence |
| `software/packages/k4-mesh-core` | 1531 lines, mature codebase | Core paths tested (44 assertions) | Detailed docs (56 lines, examples) | CI/CD pipeline | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | No CSS pipeline evidence |
| `software/packages/quantum-edge` | 358 lines of real logic | Minimal tests (0 assertions) | Detailed docs (56 lines, examples) | CI/CD with wrangler deploy | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | No CSS pipeline evidence |
| `software/packages/sovereign` | 373 lines of real logic | Minimal tests (0 assertions) | Detailed docs (56 lines, examples) | CI/CD pipeline | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | No CSS pipeline evidence |
| `software/telemetry-worker` | 119 lines of real logic | Basic tests (5 assertions) | README with usage (19 lines) | CI/CD with wrangler deploy | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | No CSS pipeline evidence |
| `software/workers` | 3008 lines, mature codebase | Core paths tested (57 assertions) | Comprehensive docs (210 lines, examples, TOC) | CI/CD with wrangler deploy | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | No CSS pipeline evidence |
| `tools` | No source files | No test files | Detailed docs (52 lines, examples) | CI/CD pipeline | Lockfile present (lockfile (pnpm-lock.yaml)) | Build present, no CSS pipeline |
| `tools/phos-forge` | 5930 lines, mature codebase | Core paths tested (65 assertions) | Detailed docs (52 lines, examples) | CI/CD pipeline | Lockfile present (lockfile (pnpm-lock.yaml)) | No CSS pipeline evidence |
| `wcds` | 348 lines of real logic | No test files | Detailed docs (52 lines, examples) | CI/CD pipeline | Lockfile present (lockfile (pnpm-lock.yaml)) | Build present, no CSS pipeline |
| `apps/willow` | 285 lines of real logic | Comprehensive tests (678 assertions) + vitest thresholds | README exists (19 lines) but no usage examples | CI/CD pipeline | Lockfile present (lockfile (pnpm-lock.yaml)) | Build present, no CSS pipeline |
| `cli` | 164 lines of real logic | Basic tests (9 assertions) | Comprehensive docs (394 lines, examples, TOC) | CI/CD pipeline | Lockfile present (lockfile (pnpm-lock.yaml)) | Build present, no CSS pipeline |
| `ecosystem` | 9218 lines, mature codebase | Basic tests (9 assertions) | README exists (6 lines) but no usage examples | CI/CD pipeline | Lockfile present (lockfile (pnpm-lock.yaml)) | Build present, no CSS pipeline |
| `interfaces` | 140 lines of real logic | Basic tests (9 assertions) | Detailed docs (52 lines, examples) | CI/CD pipeline | Lockfile present (lockfile (pnpm-lock.yaml)) | Build present, no CSS pipeline |
| `p31-surrogate-backend` | 2193 lines, mature codebase | Minimal tests (0 assertions) | Detailed docs (52 lines, examples) | CI/CD pipeline | Lockfile present (lockfile (pnpm-lock.yaml)) | Build present, no CSS pipeline |
| `p31labs` | Minimal implementation | Basic tests (9 assertions) | Detailed docs (52 lines, examples) | CI/CD pipeline | Lockfile present (lockfile (pnpm-lock.yaml)) | Build present, no CSS pipeline |
| `phos` | 63657 lines, mature codebase | Comprehensive tests (813 assertions) + vitest thresholds | README with usage (37 lines) | CI/CD with wrangler deploy | Lockfile present (lockfile (pnpm-lock.yaml)) | CSS deps present but no entry file |
| `phosphorus31.org` | Minimal implementation | Basic tests (9 assertions) | Detailed docs (52 lines, examples) | CI/CD pipeline | Lockfile present (lockfile (pnpm-lock.yaml)) | Build present, no CSS pipeline |
| `phosphorus31.org/planetary-planet` | 508 lines, mature codebase | Basic tests (9 assertions) | README with usage (45 lines) | CI/CD with wrangler deploy | Lockfile present (lockfile (pnpm-lock.yaml)) | CSS deps present but no entry file |
| `software` | 8471 lines, mature codebase | Core paths tested (24 assertions) | Detailed docs (56 lines, examples) | CI/CD pipeline | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | Build present, no CSS pipeline |
| `software/discord/p31-bot` | 6431 lines, mature codebase | Core paths tested (169 assertions) | Comprehensive docs (156 lines, examples, TOC) | CI/CD with Docker deploy | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | Build present, no CSS pipeline |
| `software/docs` | 50 lines of real logic | Minimal tests (0 assertions) | Detailed docs (56 lines, examples) | CI/CD pipeline | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | Build present, no CSS pipeline |
| `software/frontend` | 9943 lines, mature codebase | Core paths tested (74 assertions) | Detailed docs (56 lines, examples) | CI/CD with Docker deploy | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | Build present, no CSS pipeline |
| `software/p31-hearing-ops` | 1318 lines, mature codebase | Tests with coverage tracking (31 assertions) | Detailed docs (58 lines, examples) | CI/CD with wrangler deploy | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | Build present, no CSS pipeline |
| `software/p31ca` | 46780 lines, mature codebase | Comprehensive tests (886 assertions) + vitest thresholds | README with usage (38 lines) | CI/CD with wrangler deploy | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | CSS deps present but no entry file |
| `software/p31ca/workers/glass-box-ws` | 317 lines of real logic | Minimal tests (0 assertions) | README with usage (38 lines) | CI/CD with wrangler deploy | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | Build present, no CSS pipeline |
| `software/packages/brain-dump-orchestrator` | 2325 lines, mature codebase | Core paths tested (85 assertions) | Comprehensive docs (192 lines, examples, TOC) | CI/CD pipeline | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | Build present, no CSS pipeline |
| `software/packages/game-engine` | 1115 lines, mature codebase | Comprehensive tests (341 assertions) + vitest thresholds | Comprehensive docs (198 lines, examples, TOC) | CI/CD pipeline | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | Build present, no CSS pipeline |
| `software/packages/harmonic-linter` | 156 lines of real logic | Core paths tested (68 assertions) | Comprehensive docs (177 lines, examples, TOC) | CI/CD pipeline | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | Build present, no CSS pipeline |
| `software/packages/jitterbug-api` | 840 lines, mature codebase | Core paths tested (55 assertions) | Detailed docs (123 lines, examples) | CI/CD with wrangler deploy | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | Build present, no CSS pipeline |
| `software/packages/love-ledger` | 543 lines, mature codebase | Core paths tested (396 assertions) | README with usage (31 lines) | CI/CD pipeline | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | Build present, no CSS pipeline |
| `software/packages/node-zero` | 5558 lines, mature codebase | Core paths tested (524 assertions) | Detailed docs (114 lines, examples) | CI/CD pipeline | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | Build present, no CSS pipeline |
| `software/packages/node-zero/pwa` | 1363 lines, mature codebase | Minimal tests (0 assertions) | Detailed docs (69 lines, examples) | CI/CD with wrangler deploy | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | Build present, no CSS pipeline |
| `software/packages/oracle-terminal` | 419 lines of real logic | Minimal tests (0 assertions) | Comprehensive docs (501 lines, examples, TOC) | CI/CD pipeline | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | Build present, no CSS pipeline |
| `software/packages/q-distribution` | 51 lines of real logic | Minimal tests (0 assertions) | Comprehensive docs (177 lines, examples, TOC) | CI/CD pipeline | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | Build present, no CSS pipeline |
| `software/packages/quantum-core` | 1990 lines, mature codebase | Core paths tested (128 assertions) | Comprehensive docs (196 lines, examples, TOC) | CI/CD with Docker deploy | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | Build present, no CSS pipeline |
| `software/packages/shared` | 9011 lines, mature codebase | Comprehensive tests (462 assertions) + vitest thresholds | Comprehensive docs (313 lines, examples, TOC) | CI/CD pipeline | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | CSS deps present but no entry file |
| `software/packages/sovereign-sdk` | 328 lines of real logic | Minimal tests (0 assertions) | Detailed docs (56 lines, examples) | CI/CD pipeline | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | Build present, no CSS pipeline |
| `software/sovereign-command-center` | 409 lines of real logic | Minimal tests (0 assertions) | Comprehensive docs (240 lines, examples, TOC) | CI/CD with wrangler deploy | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | CSS deps present but no entry file |
| `software/spaceship-earth` | 14322 lines, mature codebase | Core paths tested (127 assertions) | Detailed docs (56 lines, examples) | CI/CD with wrangler deploy | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | Build present, no CSS pipeline |
| `software/spaceship-earth/astro-landing` | Minimal implementation | Minimal tests (0 assertions) | README exists (9 lines) but no usage examples | CI/CD with wrangler deploy | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | Build present, no CSS pipeline |
| `software/spin-mesh` | 1083 lines, mature codebase | Basic tests (16 assertions) | Detailed docs (180 lines, examples) | CI/CD pipeline | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | Build present, no CSS pipeline |
| `software/spin-mesh/logistics-do` | 114 lines of real logic | Minimal tests (0 assertions) | Detailed docs (180 lines, examples) | CI/CD with wrangler deploy | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | Build present, no CSS pipeline |
| `software/spin-mesh/matchmaking-do` | 144 lines of real logic | Minimal tests (0 assertions) | Detailed docs (180 lines, examples) | CI/CD with wrangler deploy | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | Build present, no CSS pipeline |
| `software/spoon-calculator` | 331 lines of real logic | Minimal tests (0 assertions) | Comprehensive docs (103 lines, examples, TOC) | CI/CD pipeline | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | Build present, no CSS pipeline |
| `src` | 1785 lines, mature codebase | Minimal tests (0 assertions) | Detailed docs (52 lines, examples) | CI/CD pipeline | Lockfile present (lockfile (pnpm-lock.yaml)) | Build present, no CSS pipeline |
| `tests` | Minimal implementation | Core paths tested (91 assertions) | README exists (11 lines) but no usage examples | CI/CD pipeline | Lockfile present (lockfile (pnpm-lock.yaml)) | Build present, no CSS pipeline |
| `weave-machine` | 208 lines of real logic | Minimal tests (0 assertions) | Detailed docs (52 lines, examples) | CI/CD pipeline | Lockfile present (lockfile (pnpm-lock.yaml)) | Build present, no CSS pipeline |
| `software/p31-delta-hiring` | 1743 lines, mature codebase | Core paths tested (32 assertions) | Detailed docs (98 lines, examples) | CI/CD pipeline | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | Build present, no CSS pipeline |
| `software/packages/agent-engine` | 2659 lines, mature codebase | Core paths tested (342 assertions) | Comprehensive docs (502 lines, examples, TOC) | CI/CD pipeline | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | Build present, no CSS pipeline |
| `software/packages/jitterbug-pwa` | 648 lines, mature codebase | Basic tests (8 assertions) | Comprehensive docs (108 lines, examples, TOC) | CI/CD pipeline | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | Complete CSS pipeline (@tailwindcss/vite, tailwindcss) |
| `software/bonding` | 19581 lines, mature codebase | Comprehensive tests (1270 assertions) + vitest thresholds | Detailed docs (181 lines, examples) | CI/CD with wrangler deploy | Lockfile + lint config (lockfile (pnpm-lock.yaml), eslint.config.mjs) | Complete CSS pipeline (@tailwindcss/vite, tailwindcss) |