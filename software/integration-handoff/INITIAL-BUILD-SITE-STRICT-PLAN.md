# Initial Build Site — strict planning handoff

| Field | Value |
|--------|--------|
| **ID** | `P31-IB-PLAN-2026-01` |
| **Status** | **Under CWP** — `CWP-P31-IB-2026-01` **issued for execution**; this document remains the **normative appendix** (P/Q, state machine, `PUT` order). |
| **Version** | 0.1.0 (revise in lockstep with CWP minor bumps) |
| **Date** | 2026-04-26 |
| **Parent CWP** | `integration-handoff/CONTROLLED-WORK-PACKAGE-INITIAL-BUILD.md` — handoff `integration-handoff/CWP-32/` |
| **Related** | `CWP-P31-PAR-2026-01` (PAR), `k4-personal` (`personal-tetra.js`), `p31.welcomePackages/1.0.0`, `planetary-onboard.html` / `mesh-start.html` |
| **Normative contract** | `p31.personalTetra/1.0.0` — **no bake payload may violate** `validatePersonalTetra()` in `k4-personal/src/personal-tetra.js` unless this plan is revised and the validator is versioned. |

**Purpose of this document:** Specify an **Initial Build** flow (intake → cryptographic `subject_id` → persisted **personal tetrahedron** in the user’s Durable Object) with **testable invariants**, **ordering**, and **failure semantics**. It is a **deeper, stricter** plan than a roadmap paragraph; implementation must either conform or explicitly supersede sections with a CWP revision.

---

## 1. Definitions

| Term | Definition |
|------|------------|
| **Build session** | One browser session (or re-entrant visit) that starts at the build UI and ends at **handoff** (redirect to `mesh-start` or equivalent) or **abort**. |
| **Subject** | The human. |
| **Subject ID** | Opaque string `subject_id` used as the only **path segment** for `PERSONAL_AGENT.idFromName(subject_id)` and `/u/:id/home`. **Never** a raw email or legal name. |
| **Identity lock** | The moment `subject_id` is written to `localStorage` and (if used) the passkey credential is created. |
| **Tetra bake** | A successful **commit** of `p31.personalTetra/1.0.0` to the DO via `PUT /agent/:id/tetra` after identity lock, such that a subsequent `GET /tetra` returns validator-normalized data. |
| **Bake manifest** | Ordered client-side or server-side record of which steps completed (see section 6.3). Not the same as `GET /agent/:id/manifest`. |

---

## 2. Scope and non-goals (strict)

### 2.1 In scope

- New or refactored **static** (or later Astro) **Initial Build** surface on p31ca origin.
- **Normative** sequence: intake fields → **derive `subject_id`** → **write profile + tetra** to k4-personal for that id.
- **Contract compliance** for `docks.*`: `label` (1–80 chars), `href` (1–2048 chars), `kind` in `{link, worker, passport}` (default `link`), optional `hint` (≤200 chars) — per `validatePersonalTetra`.

### 2.2 Out of scope (unless a separate CWP reopens)

- Family **cage** bridge, `k4-cage` writes, or SUPER-CENTAUR server work.
- **@p31/agent-engine** chat personality wiring beyond existing `PUT /state` `profile` slice.
- **Local LLM** or non–Workers-AI inference in k4-personal.
- Storing full **Cognitive Passport** long form in the DO (link-out only in v1).
- **COPPA** legal conclusion in code; household policy in prose only (see `docs/PLAN-KIDS-VIBE-CODING.md`).

---

## 3. Preconditions and postconditions

### 3.1 Preconditions (must hold before tetra bake)

| # | Invariant | Verification |
|---|-----------|--------------|
| P1 | `subject_id` is set in client storage and matches the id used in all subsequent `/agent/{id}/*` requests. | Grep or e2e: single id string in fetches. |
| P2 | `mesh.k4PersonalWorkerUrl` in use equals canonical home `p31-constants.json` after `apply:constants` (or explicit `?agent=` override with operator intent). | `npm run verify:constants` (home). |
| P3 | CORS preflight for `PUT` from p31ca origin to k4-personal is allowed (existing `corsHeaders` in `k4-personal/src/index.js`). | Manual OPTIONS or e2e. |
| P4 | Payload for tetra is **validatable** before `PUT` (client can run same rules as server or fail fast on server 400). | Unit or inline preflight using rules from `personal-tetra.js` (or duplicate minimal checks in static bundle — document duplication risk). |

### 3.2 Postconditions (must hold after successful handoff)

| # | Invariant | Verification |
|---|-----------|--------------|
| Q1 | `GET /agent/{id}/tetra` returns `schema: p31.personalTetra/1.0.0` and four complete docks. | `curl` + JSON. |
| Q2 | `GET /agent/{id}/state` includes any agreed `profile` keys written during build (if any). | `curl`. |
| Q3 | `localStorage` contains `p31_subject_id` and a JSON meta key (`p31_onboard_meta` and/or a dedicated `p31_build_v1` blob — see section 5). | Manual / Playwright. |
| Q4 | Redirect lands on `mesh-start.html` (or `GET /u/{id}/home`) with **no** second id minting. | Trace network + storage. |

---

## 4. User session state machine (normative)

States: **S0** Entry → **S1** Intake → **S2** Identity lock → **S3** Tetra compose → **S4** Bake (network) → **S5** Handoff → **S6** Terminal (on mesh-start).

```
S0 --[start]--> S1
S1 --[valid intake]--> S2
S2 --[passkey success OR guest confirm]--> S3
S2 --[passkey fail / user chooses guest]--> S2' (locked guest id) --> S3
S3 --[user confirms tetra preview]--> S4
S4 --[PUT success]--> S5
S4 --[PUT fail recoverable]--> S4' (error UI, retry) --> S4
S4 --[unrecoverable]--> S4e (terminal error + support copy)  [no tetra postcondition Q1]
S5 --[redirect]--> S6
```

**Strict rules:**

1. **S2 may not** call `PUT /tetra` for a *new* id before `subject_id` is written (P1). Guest path must still mint `guest_*` before any DO write.
2. **S3 → S4** is the only transition that performs **mutating** DO requests for tetra. Optional `PUT /state` may occur in **S4** only, after id lock, in a defined order (section 6.2).
3. **Re-entry:** If `localStorage.p31_subject_id` already exists, **S0** must branch to **S_rebuild** (summary + “change tetra” / “start fresh guest”) — **normative** to avoid double-minting without explicit user action.

---

## 5. Client storage contract (versioned)

### 5.1 Keys (normative for v1)

| Key | Type | Content | When set |
|-----|------|---------|----------|
| `p31_subject_id` | string | `u_*` or `guest_*` | End of S2 (identity lock) — **align with** `planetary-onboard.html` convention. |
| `p31_onboard_meta` | JSON string | Existing shape from onboard (welcomeKey, dial, etc.) if build is merged with that flow; **or** new key below. | End of S4 or S5. |
| `p31_build_record` | JSON string (optional) | **Bake manifest** section 6.3 | After successful S4. |

**If** Initial Build is a **separate** page from planetary onboard, **do not** duplicate conflicting keys: either:

- **Option A (single meta key):** extend `p31_onboard_meta` with `buildVersion`, `bakedAt`, `tetraBuildHash` (see below), or  
- **Option B (split):** new `p31_build_record` only, keep `p31_onboard_meta` for mesh-start copy only.

**Decision required** before implementation (see section 12).

### 5.2 Tetra build hash (non-cryptographic integrity hint)

- `tetraBuildHash` = first 12 hex chars of `SHA-256( canonicalJSON( personalTetra ) + '|' + subject_id )` computed in **browser** for debugging and support. **Not** a security boundary; **not** sent as sole auth to the worker.

---

## 6. Tetra bake: ordering, idempotency, payload

### 6.1 Canonical merge algorithm (client)

1. `base = defaultPersonalTetra()` (conceptually — in practice `GET /tetra` may return defaults if empty).
2. `merged = deepMerge( base, welcomePackageTetraDocks if present, userBuildDockOverrides )` where **user overrides win** per-dock for `label`, `href`, `hint`, `kind`.
3. `validatePersonalTetra(merged)` must pass; if not, **do not** `PUT`.

**Welcome package** source: `p31-welcome-packages.json` selected by `welcomeKey` from intake — **must** be a key that exists in the file; invalid key → `default` package or block advance with error (strict mode).

### 6.2 Network order (MVP — strict)

For a **fresh** id after S2:

1. `PUT /agent/{id}/state` with **only** the `profile` slice (and no `personalTetra` key in this call **if** you want a single source of truth for tetra in step 2 — **recommended** to avoid interleaved partial state).

2. `PUT /agent/{id}/tetra` with full `personalTetra` object.

**Alternate (single round-trip — future):** A dedicated `POST /agent/{id}/build` in k4-personal is **out of MVP** unless worker scope expands; this plan **does not** require a new route for v1.

**Idempotency:** Re-running step 1+2 with the same payload is safe; re-running with **different** tetra is an **update**, not a new identity.

### 6.3 Bake manifest (stored in `p31_build_record` or `p31_onboard_meta`)

| Field | Type | Description |
|--------|------|-------------|
| `schema` | const | `p31.buildRecord/0.1.0` (new; optional verifier later) |
| `bakedAt` | string ISO | Client clock |
| `subjectIdPrefix` | string | First 8 chars of `subject_id` (for logs only) |
| `welcomeKey` | string | |
| `tetraBuildHash` | string | section 5.2 |
| `clientBuildVersion` | string | e.g. `ib-0.1.0` |

---

## 7. Cryptographic identity (strict)

### 7.1 Derivation (must match one documented path)

| Path | `subject_id` form | When |
|------|---------------------|------|
| Passkey | `u_` + 32 hex chars (SHA-256 of `rawId`, truncated as in `planetary-onboard.html` **or** full 64 hex — **pick one and lock**; current onboard uses 32 hex chars) | S2 success |
| Guest | `guest_` + 20 alphanumeric from UUID | S2 guest |

**Rule:** The derivation function must exist in **one** module used by both onboard and build, or one must re-export the other; **divergence is a P0 bug.**

### 7.2 Server-side binding (optional, post–MVP)

- Passkey Worker `register-finish` stores credential ↔ `subject_id` in D1/KV (see CWP-31 **PA-1.2**). **Not** required for v1 postconditions Q1–Q4 if client-only id is the product decision.

### 7.3 What is never stored in DO or URL

- Raw email, phone, government id.
- Unsalted PII in `profile.name` is discouraged; if display name is collected, cap length and scrub in `_scrubPII` policies for chat (existing k4-personal behavior).

---

## 8. Intake: field spec (suggested v1 — all optional to advance unless marked)

| Field ID | Max length | Maps to | Validation |
|----------|------------|---------|------------|
| `archetype` | enum | `profile.archetype` + welcomeKey filter | `child|elder|default` or package key |
| `welcomeKey` | enum | `p31-welcome-packages` package | must exist in JSON |
| `displayName` | 48 | `profile.name` (optional) | strip `<>` ; optional empty |
| `dockOverrides` | 4 objects | `personalTetra.docks.*` | each must pass per-dock validation |

**Stricter UI:** Block **S4** if any `href` is not `https:` / `/` / relative same-site per allowlist (define **hub allowlist** in one JSON, e.g. `ede.html`, `geodesic.html`, `connect.html`, `passport` paths).

---

## 9. Failure matrix (normative behavior)

| Failure | User-visible | System | Retry |
|---------|--------------|--------|-------|
| CORS or network 0 | “Edge unreachable” | No change to id if S2 not complete; if S2 done, id exists — show retry for PUT only | Yes |
| `PUT` 400 | “Invalid layout — reset dock” | No partial tetra if single PUT; if split state+ tera, document inconsistency | Fix client validation |
| `PUT` 5xx | “Temporary — try again” | Safe retry same payload | Yes |
| Passkey not available | Fall back to guest with explicit copy | Guest id minted | N/A |
| id collision (theoretical) | Show rare error, regenerate guest | New `guest_*` | Once |

**Partial write:** If `PUT /state` succeeds and `PUT /tetra` fails, Q1 fails. **Recovery:** retry tetra only; **or** if policy requires, `DELETE` state keys (not implemented) — **MVP: retry `PUT /tetra` only**; document that profile may exist without tetra until fixed.

---

## 10. Relationship to `planetary-onboard.html` (decision)

| Option | Description | Risk |
|--------|-------------|------|
| **I — Replace** | Onboard is deprecated; all first-run goes through Initial Build. | Two URLs to retire or redirect. |
| **II — Merge** | Onboard phases 0–3 become “story”; Build is phases “intake + lock + bake” inserted before or after dial. | Large single file; long load. |
| **III — Parallel** | `planetary-onboard` = Wye–Delta **narrative**; `/initial-build` = **data + identity + bake**; handoff from one to the other. | User may hit both — need **S_rebuild** and dedupe. |

**This plan does not select I/II/III** — see section 12. Implementation **shall** document the chosen option in the parent CWP and in `MESH-MAP-PERSONAL-START-PAGES.md`.

---

## 11. Youth and accessibility (hard requirements)

- **Child archetype:** No extra passkey pressure; **guest** and caregiver completion paths per **PLAN-KIDS**; EDE as creation dock default remain valid.
- **Keyboard:** every dock override and CTA in tab order; focus trap only inside modals (if any).
- **Reduced motion:** respect `prefers-reduced-motion` for any dial/tetra animation on the build page.
- **Screen reader:** `role=slider` / labels only where controls are real controls; no canvas-only without text alternative.

---

## 12. Open decisions (block or branch implementation)

**Closed for v0:** `integration-handoff/CWP-32/DECISIONS.md` (CWP **D-IB10**). Reopen only with a CWP minor + matrix update.

1. **I / II / III** (section 10) — single owner decision.  
2. **Meta key** Option A vs B (section 5.1).  
3. **Subject id length** for `u_`: 32 vs 64 hex (must match `planetary-onboard` after change).  
4. **Hub href allowlist** file location: `p31.ground-truth` vs new `build-allowlist.json` vs inline in static page.  
5. **MVP handoff URL:** `mesh-start.html` only vs optional `?welcome=` always set from build.  
6. **Telemetry:** log bake success client-side only vs Worker audit log (out of v1 by default).

---

## 13. Traceability: deliverables (D-IB*)

| ID | Deliverable | Verify |
|----|-------------|--------|
| D-IB1 | This plan + decision log for section 10 through section 12 | PR + review |
| D-IB2 | Static build page(s) + ground-truth route | `verify:ground-truth` (p31ca) |
| D-IB3 | `subject_id` derivation single-sourced with onboard | Grep + unit or golden test |
| D-IB4 | `PUT` order (section 6.2) + failure matrix (section 9) | Playwright or script |
| D-IB5 | `p31_build_record` or extended meta written post-bake | Storage inspection |
| D-IB6 | `MESH-MAP` + PAR CWP cross-links updated | Doc review |

**Closure:** CWP for Initial Build (e.g. `CWP-P31-IB-2026-01`) can adopt these D-IB* verbatim.

---

## 14. Rollback

- Revert static page + redirects; **DO state** is per-user — rollback does not erase client-created DOs.  
- Document **“rebuild from mesh-start”** as user-driven `PUT` overwrite.

---

*End of `P31-IB-PLAN-2026-01` strict planning handoff*
