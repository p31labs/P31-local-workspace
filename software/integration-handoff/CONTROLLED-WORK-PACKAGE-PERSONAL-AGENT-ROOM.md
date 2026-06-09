# Controlled Work Package — Personal Agent Room (k4-personal + p31ca front door)

| Field | Value |
|--------|--------|
| **CWP ID** | `CWP-P31-PAR-2026-01` |
| **Title** | One bounded “room” per person: stable identity, isolated Durable Object agent, static hub handoff, optional cage bridge — without expanding big-vendor cloud trust as the default path |
| **Version** | 1.0.0 |
| **Effective date** | 2026-04-26 |
| **Status** | Issued for execution |
| **Applies to** | **`andromeda/software/k4-personal`**, **`p31ca/public/**`** (onboard, mesh-start, welcome JSON, EDE), **`p31ca/workers/passkey`** (as identity matures), root **`p31-constants.json`** + **`apply:constants`**, **optional** `p31-agent-hub` **documentation only** (orchestrator ≠ youth path) |

**Related (do not conflate):**

| Name | What it is |
|------|------------|
| **Personal Agent Room (PAR)** | The **product** story: *one* stable `subject_id` → *one* `PersonalAgent` DO (SQLite) on **k4-personal** + *one* “home” surface (mesh-start + optional Worker HTML `/u/:id/home`). |
| **Family cage (k4-cage)** | **Shared** topology; **opt-in** bridge from personal — never the default data path. |
| **p31-agent-hub** | **Orchestrator** with bindings to multiple Workers; keep **AGENT_HUB_SECRET** for non-public; **not** the primary private channel for minors. |
| **CWP-P31-SC-2026-01** | SUPER-CENTAUR ↔ **Ring D**; uses **`CWP-30/mesh-bridge.ts`**. **Sister** CWP; inventory alignment only here. |
| **CWP-P31-ECO-2026-01** | p31ca **hub/catalog** unification. **Sister** CWP; PAR does **not** require merging catalog work. |
| **@p31/agent-engine** | TypeScript **library** (personality/skills) — **not** wired to k4-personal runtime; future integration is **out of band** until a sub-CWP reopens scope. |
| **CWP-P31-IB-2026-01** | **Initial Build** — intake → bake **personal tetra** before/during first handoff; **sister** CWP. **`https://p31ca.org/build`**. `integration-handoff/CWP-32/`. **Does not** replace PAR; **consumes** same `subject_id` + k4-personal. |

---

## 1. Purpose

1. **Bind** a **stable, URL-safe** `subject_id` to **exactly one** `PERSONAL_AGENT.idFromName(subject_id)` (see existing router in `k4-personal/src/index.js`).
2. **Complete** the static **front door → room** path: `planetary-onboard.html` → `mesh-start.html` → `k4-personal` `/agent/.../chat` (and **`GET /u/:id/home`**) with **one** source of truth for **welcome** + **dial** metadata (`p31-welcome-packages.json` + `localStorage` today; **KV/edge config** later).
3. **Harden** trust boundaries: **CORS** allowlist, **no anonymous** sensitive routes, **documented** **Workers AI** use inside `_chat` (CF inference, not an arbitrary third-party key path).
4. **Govern** data: **retention** / **export** / **delete** story for SQLite-backed chat (minors: operator policy + possible TTL job).
5. **Avoid** conflating **public** hub **EDE** (`ede.html` static) with **private** “room” — plan an **optional** Worker-bundled static slice on **same origin** as k4-personal (see `docs/PERSONAL-TETRA-UNIFIED-WORKER.md`).
6. **Verify** reproducibly: `pnpm --filter k4-personal verify`, root **`verify:mesh`**, p31ca **Playwright** e2e where applicable; **no** live mesh numbers in this doc — use `GET /api/health` or registry.

---

## 2. References (read order)

| # | Path / artifact | Use |
|---|------------------|-----|
| R1 | `andromeda/software/k4-personal/README.md` + `src/index.js` | Router, DO routes, `GET /u/:userId/home`, CORS |
| R2 | `andromeda/software/k4-personal/src/personal-tetra.js` | `p31.personalTetra/1.0.0` |
| R3 | `andromeda/software/k4-personal/src/tetra-home-html.js` | Tetra shell HTML |
| R4 | `p31ca/public/mesh-start.html` | `p31_subject_id`, worker base, `POST .../chat` |
| R5 | `p31ca/public/planetary-onboard.html` | Phase 5 meta, redirect to mesh-start |
| R6 | `p31ca/public/p31-welcome-packages.json` | `p31.welcomePackages/1.0.0` |
| R7 | `p31ca/ground-truth/p31.ground-truth.json` | Routes: onboard, mesh-start, welcome packages |
| R8 | `docs/MESH-MAP-PERSONAL-START-PAGES.md` | Phased target model, success criteria |
| R9 | `docs/PERSONAL-TETRA-UNIFIED-WORKER.md` | “Room” vs **p31ca.org** front door |
| R10 | `docs/PLAN-KIDS-VIBE-CODING.md` | Youth path, EDE, **no** agent-hub for minors in prod |
| R11 | `p31-constants.json` + `src/p31-constants-generated.ts` (home) | `mesh.k4PersonalWorkerUrl` |
| R12 | `p31ca/workers/passkey/README.md` + `schema.sql` | WebAuthn user binding (future `subject_id` source) |
| R13 | `integration-handoff/CWP-30/mesh-bridge.ts` | Worker URL map; **cage** vs **personal** hostnames — **read-only** for PAR unless bridging |
| R14 | `scripts/verify-mesh.mjs`, `scripts/verify-mesh-live.mjs` (home) | Live mesh vs constants |
| R15 | `CWP-31/deliverables-matrix.json` | Machine-readable D-PA* checklist (this CWP) |

**Sister CWPs:** **ECO** (catalog), **SC** (phosphorus mesh proxy). **PAR** is **Andromeda + home constants**-centric; it does **not** deploy **phosphorus31.org**.

---

## 3. Ecosystem rings (what this CWP owns)

| Ring | This CWP |
|------|----------|
| **A — p31ca.org static** | **Yes** — onboard, mesh-start, welcome JSON, EDE, redirects; **minimal** copy/registry touch for cross-links. |
| **B — k4-personal Worker** | **Yes** — DO behavior, CORS, manifest, optional static asset bundle, retention hooks. |
| **B — passkey Worker** | **Partial** — document + implement **binding** to `subject_id` derivation (when prioritized). |
| **B — p31-agent-hub** | **No code changes required**; document that **youth** path stays on **k4-personal** only. |
| **B — k4-cage** | **Read-only** unless implementing **opt-in** bridge (Phase 6, optional). |
| **C — p31ca full-stack apps (non-static)** | **Out of scope** unless a task explicitly adds a **read-only** link. |
| **D — phosphorus31.org** | **Excluded** — see CWP-SC. |

---

## 4. Assumptions and constraints

- **A1** — `subject_id` is **already** written to `localStorage` as `p31_subject_id` from planetary onboard; production hardening may replace or supplement with **passkey**-derived `u_<hash>` (see MESH-MAP Phase 1).
- **A2** — `PersonalAgent._chat` uses **Workers AI** `@cf/meta/llama-3.1-8b-instruct-fast` today — “no big cloud” means **not** defaulting to OpenAI/Anthropic **from the product UI**; **CF-bound inference** is still **disclosed** in operator docs.
- **A3** — **COPPA / regional minors’ rules** are **out of legal scope** in code; **PLAN-KIDS** + policy tasks document household operation.
- **A4** — Initials for children in **.cursorrules**; no full names in new **public** copy.
- **A5** — `mesh.k4PersonalWorkerUrl` in **`p31-constants.json`** is the **canonical** probe URL for `verify:mesh` (must match **deployed** worker).

---

## 5. Deliverables

| ID | Deliverable | Verification |
|----|-------------|--------------|
| **D-PA1** | **`subject_id` contract** — documented derivation (localStorage now; passkey `rawId` hash **or** signed token **later**); no raw email in URL paths. | `docs/MESH-MAP-*.md` or inline **CWP-31/identity.md** + code comments at write site |
| **D-PA2** | **Onboard → mesh-start** always passes **`welcome` + `dial`** query params; mesh-start **merges** welcome package into first-time **`PUT /agent/.../tetra`** when absent (existing behavior **preserved or improved** with tests / manual script). | Manual + optional Playwright assert |
| **D-PA3** | **`GET /agent/:id/manifest`** returns **`p31.personalAgentManifest/0.1.0`** with **version**, **personalTetra**, **profile**, **energy** — field list **documented** in R9 table (extend if new slices added). | `curl` JSON + schema note |
| **D-PA4** | **Retention**: either **SQL TTL job** in DO (alarm) **or** documented **operator** delete procedure + **`DELETE`/`POST` clear-history** route sketch — **one** must ship before marketing “we delete you.” | Code or runbook |
| **D-PA5** | **Export**: **`GET /history`** (exists) + **one** of: export JSON file from mesh-start, or runbook “copy thread API.” | Doc + sample |
| **D-PA6** | **Minors / agent-hub:** `dev-workbench.html` and **agent-hub** public chat **require secret** in prod; **PLAN-KIDS** cross-linked from **PERSONAL-TETRA** or PAR closure note. | Security smoke |
| **D-PA7** | **Constants + mesh-start:** `verify-constants` passes; mesh-start default worker = **`p31-constants.json` `k4PersonalWorkerUrl`**. | `npm run verify:constants` |
| **D-PA8** | **Ground truth** routes for `planetaryOnboard`, `meshStart`, `welcomePackages` **match** deployed paths (R7). | `npm run verify:ground-truth` (p31ca) |
| **D-PA9** | **Optional** cage bridge: **one** **documented** API or “share edge” **mutation** behind explicit consent — or **deferred** with **R13** link only. | Doc **or** N/A in closure |

---

## 6. Work breakdown structure (WBS)

### Phase 0 — Baseline audit (read-only)

| ID | Task | Output | Acceptance |
|----|------|--------|------------|
| **PA-0.1** | Trace **`p31_subject_id`** from `planetary-onboard.html` → `mesh-start.html` → fetch URLs. | Short diagram in **CWP-31/identity.md** | Matches R4/R5 line numbers (update on drift) |
| **PA-0.2** | List **all** k4-personal **public** routes and **auth** state (if any) per route. | Table in CWP-31 or R1 appendix | Code review |
| **PA-0.3** | Run **`verify:mesh`** and **`pnpm --filter k4-personal verify`** on clean clone; log SHA. | CI log or local transcript | Green |

### Phase 1 — Identity and subject binding

| ID | Task | Output | Acceptance |
|----|------|--------|------------|
| **PA-1.1** | Define **`u_<64-hex>`** (or current **guest_** / random) scheme in one file; **mesh-start** + **k4-personal** use **same** normalization. | D-PA1 | Grep: single helper or shared doc |
| **PA-1.2** | **Passkey (optional in v1):** map `register-finish` user id to **`p31_passkey_sub`** in **localStorage** and/or **server KV**; **or** document **“Phase 1 deferred”** with issue link. | D-PA1 | Maintainer sign-off |
| **PA-1.3** | Ensure **tetra shell** `GET /u/:id/home` uses **only** the **same** `id` as chat routes (no case drift). | — | Manual test |

### Phase 2 — k4-personal hardening

| ID | Task | Output | Acceptance |
|----|------|--------|------------|
| **PA-2.1** | **Rate limit** or **abuse** guard on **`POST /chat`** (per IP or per DO) — minimal middleware in Worker. | D-PA3 security addendum | 429 in stress test (optional) |
| **PA-2.2** | **PII scrub** path — `_scrubPII` already present; **extend rules** if passport JSON is stored in `state.profile`. | Unit or inline tests | — |
| **PA-2.3** | **Manifest** fields stable for one client fetch from mesh-start (if consolidating fetches). | D-PA3 | JSON snapshot test optional |
| **PA-2.4** | **Alarm** / **TTL** for `messages` table — **or** runbook for operator wipe. | D-PA4 | SQL migration in DO or doc |

### Phase 3 — p31ca static alignment

| ID | Task | Output | Acceptance |
|----|------|--------|------------|
| **PA-3.1** | **Welcome** + **mesh-start** always show **k4-personal tetra shell** link with correct **`{BASE}/u/{id}/home`**. | D-PA2 | E2E or visual |
| **PA-3.2** | **Kid** package dock to **`/ede.html`** **unchanged** or improved with **new-tab** to Worker when PA-2.5 lands. | PLAN-KIDS cross-check | — |
| **PA-3.3** | If **`p31.personalStartConfig/0.1.0`** KV is introduced — **separate** micro-CWP; **out of v1** unless R8 Phase 2 accelerates. | N/A or ticket | **Do not** block PAR closure on KV |

### Phase 4 — Governance and youth path

| ID | Task | Output | Acceptance |
|----|------|--------|------------|
| **PA-4.1** | **Operator** doc: *where* chat lives, *who* can read it, *how* to export. | D-PA5 | `docs/*.md` one-pager |
| **PA-4.2** | **D-PA6** check: **agent-hub** not linked from `mesh-start` as primary chat for under-16 copy paths. | Grep + copy review | — |

### Phase 5 — Build surface (optional, same-origin)

| ID | Task | Output | Acceptance |
|----|------|--------|------------|
| **PA-5.1** | Prototype **static** EDE or **reduced** bundle under k4-personal **or** `wrangler` **assets** — **or** “defer” with R9 **Next** table unchanged except **date**. | D-PA0 follow-on | PR optional |

### Phase 6 — Cage bridge (optional)

| ID | Task | Output | Acceptance |
|----|------|--------|------------|
| **PA-6.1** | If bridging: use **CWP-30** **MESH.personal** URL; **no** default KV read of cage from DO without user **mutation**. | D-PA9 | Security review |

### Phase 7 — Verification and closure

| ID | Task | Output | Acceptance |
|----|------|--------|------------|
| **PA-7.1** | Update **`CWP-31/deliverables-matrix.json`** with `status: done` and **PR** links. | R15 | File committed |
| **PA-7.2** | **CWP closure:** **Version** `1.1.0`, **Status** `Complete`, **Change log** | This file | Maintainer |
| **PA-7.3** | **Cross-link** from **MESH-MAP** Related docs to this CWP. | R8 | Link live |

---

## 7. Exclusions

- Replacing **Workers AI** with **local** LLM inference on the Worker (cost/size); **separate** spike.
- **Merging** **p31-agent-hub** into **k4-personal** (remains two Workers).
- **phosphorus31.org** **SUPER-CENTAUR** server work (CWP-SC).
- **Full** **@p31/agent-engine** integration (Discord, etc.).

---

## 8. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| **`subject_id`** guessable if incrementing | Use **random** / **hash**-based ids (MESH-MAP). |
| **PII** in chat | Scrub rules + **minimal** `state.profile` + **export** before share |
| **CF AI** subprocessor disclosure | “Privacy & AI” subpage or footer on mesh-start (copy task) |
| **Drift** `k4PersonalWorkerUrl` | **PA-0.3** in CI; **ECO** inventory alignment optional |

---

## 9. Rollback

1. Revert k4-personal **PR**; redeploy previous Worker.  
2. Revert p31ca **static** if UI regression; **ground-truth** follow **revert** of redirects.  
3. **localStorage** keys remain on clients — new deploy does not erase; document **key migration** on breaking changes.

---

## 10. Configuration management

| Change | Action |
|--------|--------|
| New `k4-personal` **hostname** | **p31-constants.json** + `apply:constants` + `verify-constants` + R7 **if** public mention |
| New **DO** route | CWP **revision**; update R1, **mesh-start** if surfaced |
| Passkey **RP_ID** / **D1** | `passkey/wrangler.toml` + R12 README |

### Change log

| Version | Date | Summary |
|---------|------|---------|
| 1.0.0 | 2026-04-26 | Initial issue — full WBS: identity, k4-personal, p31ca, governance, optional bridge and build surface |

---

## 11. Notes

- **Single inventory** of Worker URLs: stay aligned with **CWP-ECO** D7 and **CWP-SC** D-SC7 where hosts overlap.  
- **Live** mesh **counts** — never from this markdown; use **`GET /api/mesh`** or **k4-cage** tools per **AGENTS.md**.

---

*End of CWP `CWP-P31-PAR-2026-01`*
