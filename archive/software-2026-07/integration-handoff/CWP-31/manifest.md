# `GET /agent/:userId/manifest` — field list (D-PA3)

**Schema string:** `p31.personalAgentManifest/0.1.0`  
**Implementation:** `k4-personal/src/index.js` → `PersonalAgent._manifest()`.

| Field | Type / shape | Notes |
|--------|----------------|--------|
| `schema` | string | Always `p31.personalAgentManifest/0.1.0`. |
| `personalTetra` | object | `normalizePersonalTetra` output; docks `structure` / `connection` / `rhythm` / `creation`. |
| `profile` | object | `name`, `role` (nullable strings from `state.profile`). |
| `energy` | object | `spoons`, `max` (numbers). |
| `retention` | object | `p31.agentRetention/0.1.0`: `chatMessagesMaxRows` (from `MESSAGES_MAX_ROWS`, default 2000), `strategy: "delete_oldest_over_cap"`. |
| `service` | object | `name: "k4-personal"`, `durableObject: "PersonalAgent"`. |

**Normative product note:** `docs/PERSONAL-TETRA-UNIFIED-WORKER.md` (manifest row + Phase 3). Extend this table and `_manifest()` together if new slices (e.g. `codeProjects`) are added.

**Verify:** `curl -sS "${K4_BASE}/agent/${ID}/manifest" | jq .` (replace `K4_BASE` with `p31-constants.json` `mesh.k4PersonalWorkerUrl`).
