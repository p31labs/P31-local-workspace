# Parallel agent coordination (P31 + Andromeda)

When **multiple agents** edit the same monorepo, use these **touch boundaries** to reduce merge pain.

| Track | Primary paths (prefer one agent per file per PR) |
|--------|--------------------------------------------------|
| **ECO** — p31ca home / catalog | `src/pages/index.astro` (D2: hub-landing import), `scripts/hub/build-landing-data.mjs` + `hub-app-ids.mjs` (legacy `legacy-mvp-hub.html` retired) |
| **MAP** — monetary | `software/donate-api/`, `scripts/verify-monetary-surface.mjs`, `phosphorus31.org/.../donate.astro` |
| **SC** — SUPER-CENTAUR / phosphorus server | `phosphorus31.org/.../SUPER-CENTAUR/`, `integration-handoff/CWP-30/mesh-bridge.ts` (copy handoff) |
| **K₄ / command-center** | `cloudflare-worker/command-center/`, `unified-k4-cage/`, `k4-cage/` |

**Rule:** if another agent owns **`index.astro`**, this agent should **not** do large D2 rewrites in the same window — use **`hub:diff`**, `diff-index-sources.mjs`, and **docs/ECO-P0-1-SNAPSHOT.md** for alignment without blocking.

**ground-truth** mutations (`ground-truth/p31.ground-truth.json`, `_redirects`) require **`npm run verify:ground-truth`** in the same commit as routing changes.
