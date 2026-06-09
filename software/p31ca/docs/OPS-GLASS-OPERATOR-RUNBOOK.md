# Ops glass + command-center — operator runbook

Concise reference for **`/ops/`** on p31ca, **EPCP** (`command-center` Worker), and **local** `npm run command-center`. Canonical glass list: home **`p31-ecosystem.json`** → p31ca **`npm run ops:ingest`** → **`src/data/ops-glass-probes.json`**.

---

## 1. What is public vs gated (command-center Worker)

| Route | Method | Auth | Typical HTTP | Notes |
|-------|--------|------|--------------|-------|
| **`/api/health`** | GET | None (intended) | **200** `{ ok, ts }` | Glass **`command-center-health`**. If the **entire** `*.workers.dev` hostname sits behind Access **without** a path bypass, browsers/scripts may get **302 → login** instead of JSON — configure a bypass for **`GET /api/health`** so liveness matches **`EDGE-SECURITY.md`**. |
| **`/api/operator/shift`** | GET | Optional Access | **200** `{ schema, public: { state, at }, … }` | **PII-free** public state. Optional **`audit`** when Access session present. Glass **`operator-shift-public`**. |
| **`/api/operator/shift`** | POST | **Cloudflare Access + `operator` role** | **401/403** if missing/forbidden | Body: `{ "action": "in"\|"out", "note"?: string }`. **Not** callable from static `/ops/` (no POST from that page). |
| **`/api/status`** | GET | Access **`reader`** | 401 without session | |
| **`/api/status`** | POST | Access **`operator`** | 401/403 | Mutates fleet status KV. |
| **`/api/sse`**, **`/api/analytics/*`**, many internals | GET | Access / session headers | **401** common without SSO | Expected **`auth`** row in glass — edge up, not “down”. |

**401 vs 403:** Implementation uses **`withAccess`** and route-specific checks; treat both as “not authorized for this identity.” **Glass strict mode** (`P31_GLASS_STRICT=1`) fails only on **`down`** (5xx / network), not on **`auth`** or **`warn`**.

---

## 2. When mesh (or glass) is red — suggested order

1. **Local bar:** `npm run verify` (includes **`verify:mesh`** when configured, **`verify:ecosystem`**, **`verify:map-pipeline`**).
2. **Live probes:** `P31_GLASS_STRICT=1 npm run ecosystem:glass` → inspect **`/tmp/p31_glass_report.json`**.
3. **K₄ personal:** `MESH_LIVE_STRICT=1 npm run verify:mesh` (or CI-style **`MESH_LIVE_STRICT=1 npm run p31:ci`** when Andromeda present).
4. **Constants vs fleet:** `npm run verify:constants` — URLs must match **`p31-live-fleet.json`** / **`p31-constants.json`** (no invented hosts).
5. **Worker logs:** Cloudflare dashboard → **k4-personal** / **k4-cage** / **k4-hubs** as indicated by failing probe **group**.
6. **Operator shift:** `GET https://command-center.trimtab-signal.workers.dev/api/operator/shift` — if **503**, **STATUS_KV** may be missing in Worker env.

---

## 3. Human-in-the-loop (automation)

- **p31ca `/ops/`:** Read-only probes in the browser (**GET** only). Shift changes use **EPCP** (Access) or home **`npm run operator:shift-in`** / **`operator:shift-out`** (local JSONL).
- **Local command center (127.0.0.1:3131):** **`POST /api/run`** is **whitelist-only**; UI defaults **locked** until the operator unlocks the session (`scripts/p31-local-command-center.mjs`).

---

## 4. Coherence: one probe source

Do not hand-edit **`ops-glass-probes.json`**. Change **`p31-ecosystem.json`**, then from **`andromeda/software/p31ca`**: **`npm run ops:ingest`** (also runs in **prebuild**). The **ambient** strip on `/ops/` intentionally re-probes a **small subset** (k4-personal, orchestrator, command-center **health**) for fast feedback; full truth is the **glass table** + CLI **`ecosystem:glass`**.

---

## 5. Proof commands

- `npm run verify:command-center` (home)
- `npm run verify:ecosystem`
- `P31_GLASS_STRICT=1 npm run ecosystem:glass` — **command-center** probes should be **UP** (or **AUTH** for routes that require SSO, not **DOWN**)

Edge trust details: **`andromeda/software/p31ca/docs/EDGE-SECURITY.md`**.
