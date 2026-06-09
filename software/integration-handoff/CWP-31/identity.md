# CWP-31 — Identity and `subject_id` (PA-0.1 + baseline)

**Status:** **Update** when `planetary-onboard.html` or `mesh-start.html` change storage keys, derivation, or default worker base.

## Flow (code anchor)

```text
planetary-onboard (Phase 5)                    mesh-start                    k4-personal
-------------------------                       ---------                     -------------
persistSubjectAndMeta()  ──localStorage──►  LS_ID = p31_subject_id   ──►  /agent/:userId/...
     │                                              │
     └─ p31_onboard_meta (JSON)                    └─ ?dial= & ?welcome= on redirect
```

## File:line map

| Step | File | Lines (approx.) | What |
|------|------|-----------------|------|
| Post-onboard target | `p31ca/public/planetary-onboard.html` | 829 | `POST_ONBOARD_URL = '/mesh-start.html'`. |
| `subject_id` + meta | same | 1327–1352 | `persistSubjectAndMeta`: passkey path → `u_` + first **32 hex digits** of SHA-256(`rawId`) (full hash is 64 hex; code uses `.slice(0, 32)` on the hex string); else `guest_` +20 chars from UUID. `localStorage` keys `p31_subject_id`, `p31_onboard_meta`. |
| Redirect query | same | 1470–1473 | `mesh-start.html?dial=…&welcome=…` (welcome = package key). |
| Read id + default worker | `p31ca/public/mesh-start.html` | 150–156, 177–180 | `LS_ID` = `p31_subject_id`; `agentBase()` default must include **`p31-constants.json` `mesh.k4PersonalWorkerUrl`** (enforced by `npm run verify:constants`). |
| Tetra shell link | same | 210–213 | ` ${BASE}/u/${encodeURIComponent(subjectId)}/home` |
| First-time tetra merge | same | 372–384 | `seedPersonalTetra`: if no `personalTetra` in state, merge `activeWelcomePkg` into `PUT .../tetra`. |
| DO + HTML shell | `k4-personal/src/index.js` | 458–478 | `/u/:userId/home` and `/agent/:userId/...` use same `userId` segment. |

## `subject_id` contract (D-PA1)

- **Opaque:** `u_<hex>` (passkey `rawId` hash) or `guest_<alphanum>` — **not** email in the path. Implemented in `planetary-onboard.html` (see table above).  
- **Binding:** The string is the Durable Object name key (`PERSONAL_AGENT.idFromName(userId)`).  
- **Future:** Passkey Worker (`p31ca/workers/passkey`) may become the long-term server-side binding; see parent CWP **PA-1.2**.

## Quick verification

```bash
# After onboard, Application → Local Storage: p31_subject_id, p31_onboard_meta
# Mesh-start probes (BASE = mesh.k4PersonalWorkerUrl):
#   ${BASE}/health
#   ${BASE}/agent/${id}/health
#   ${BASE}/agent/${id}/chat  (POST)
# Tetra shell: ${BASE}/u/${id}/home
```

Replace `BASE` with `p31-constants.json` → `mesh.k4PersonalWorkerUrl`.
