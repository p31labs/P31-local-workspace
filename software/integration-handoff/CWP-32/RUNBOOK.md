# Initial Build — runbook (D-IB8)

**Surface:** `p31ca/public/initial-build.html` (short URL `/build` → 301)  
**Script:** `public/lib/p31-initial-build-bake.js` — `PUT /state` (profile) then `PUT /tetra` (merged welcome package + server defaults)

## Happy path (manual)

1. Open `https://p31ca.org/build` (or `?agent=https://…` to override k4-personal base, same as mesh-start).
2. Either complete **planetary onboard** (passkey or child path) so `localStorage.p31_subject_id` exists, or click **Create guest id** (mints `guest_*` via `p31-subject-id.js` and reloads).
3. Choose **welcome package** and optional **display name**; click **Bake to my agent**.
4. Expect `localStorage.p31_build_record` (schema `p31.buildRecord/0.1.0`) with `bakedAt`, `tetraBuildHash`, etc.
5. **Continue to mesh home** — `mesh-start.html` seeds profile/tetra if missing, so a second pass is idempotent for mesh copy.

## Re-entry

- If `p31_build_record` is already set, the page shows a **last bake** strip with a direct link to mesh home.
- Re-bake overwrites the DO profile + tetra for the same `subject_id` (idempotent for identical payload; new payload updates docks).

## Partial failure (strict plan §9)

| Symptom | Meaning | Action |
|--------|---------|--------|
| `PUT /state` fails | Network, CORS, or DO error | Fix connectivity; `?agent=` if wrong worker. No tetra write yet. |
| `PUT /state` OK, `PUT /tetra` fails | Invalid tetra (400) or server error (5xx) | Read error text on page. 400: package produced invalid href/label — file an issue. 5xx: retry **Bake**; profile may already exist in DO. |
| No `p31_build_record` after “success” | `localStorage` blocked | Private mode / policy; server state may still be updated — verify with `GET /agent/:id/tetra` in DevTools. |

## Playwright

- **Local / CI preview:** `andromeda/software/p31ca` — `npm run build`, then `npx playwright test e2e/hub-smoke.spec.ts -g "initial build"` (uses Astro preview + `dist`).
- **After deploy to p31ca.org:** `PLAYWRIGHT_BASE_URL=https://p31ca.org PLAYWRIGHT_SKIP_WEBSERVER=1 npx playwright test e2e/prod-smoke.spec.ts` — includes `/build`, `/lib/p31-initial-build-bake.js`, and canon demo. **Requires a full Pages build** so `public/*.html` and `public/lib/*` are in `dist` (see `P31 Pages deploy` workflow, which runs `p31-ci.mjs` before `wrangler pages deploy`).

Optional future: mock `fetch` in e2e to assert PUT order without the live worker.
