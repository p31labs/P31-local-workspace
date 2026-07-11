# TRIPER MVP Certification Suites

These 12 suites certify the P31 Adaptive Exocortex interfaces against the 6 TRIPER axes:

- **Task** — the interface fulfills its purpose (valid description with widgets)
- **Resilience** — degrades gracefully (crisis mode at `spoons=0`; malformed input never throws)
- **Interface** — structurally valid `InterfaceDescription` (layout/density/widgets with id+type+title)
- **Purity** — deterministic (identical input → identical output)
- **E2E** — the intent path (`generateInterfaceFromIntent`) yields a valid interface
- **Regression** — stable widget shape for fixed input

## Suites (12)

| Suite | Component |
| :--- | :--- |
| bonding | Molecular builder |
| cars | C.A.R.S. — Root bonding-soup engine |
| personal | PERSONAL — SIMPLEX + Passport + K₄ personal |
| hub | HUB — p31ca technical hub |
| mesh | MESH — K₄ cage + hubs + personal |
| simplex | SIMPLEX — v7 agent layer |
| email | EMAIL — simplex-email Worker |
| epcp | EPCP — Command center |
| geodesic | GEODESIC — GeodesicRoom WS |
| p31ca-user-sentinel | P31CA USER SENTINEL — E2E swarm |
| mesh-integrity | MESH INTEGRITY — URL/PRS/glass |
| systems-integrity | SYSTEMS INTEGRITY — Alignment/workflow |

## Run

```bash
node tests/triper/triper-runner.mjs --cert          # all 12 suites -> JSON cert in tests/triper/logs/
node tests/triper/triper-runner.mjs bonding        # single suite
npx vitest run --config vitest.triper.config.ts   # direct vitest (all TRIPER tests)
```

## Notes

- Each suite imports the shared helpers in `_triper.mjs` (`isValidDescription`, `triperScorecard`, re-exports of `generateInterface` / `generateInterfaceFromIntent`).
- Suites assert against `software/packages/interface-generator` output; `viewData` is seeded with generator-recognized keys so the description carries domain widgets.
- The runner writes a JSON cert (`overall`, `suites[]`, `timestamp`) and a log line `Result: ✅ PASSED` / `❌ FAILED`. A fresh cert must be <24h for the CI gate.
