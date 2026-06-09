# CWP-31 — Personal Agent Room (PAR) handoff

**Parent:** [`CONTROLLED-WORK-PACKAGE-PERSONAL-AGENT-ROOM.md`](../CONTROLLED-WORK-PACKAGE-PERSONAL-AGENT-ROOM.md) — `CWP-P31-PAR-2026-01`

**Sister (Initial Build, production CWP):** [`CONTROLLED-WORK-PACKAGE-INITIAL-BUILD.md`](../CONTROLLED-WORK-PACKAGE-INITIAL-BUILD.md) — `CWP-P31-IB-2026-01` — handoff [`CWP-32/`](../CWP-32/README.md) — `https://p31ca.org/build` — intake → bake tetra; PAR remains the ongoing room.

| Artifact | Purpose |
|----------|---------|
| [`deliverables-matrix.json`](./deliverables-matrix.json) | Machine-readable D-PA* status for agents and checklists |
| [`identity.md`](./identity.md) | PA-0.1: `subject_id` flow (file:line map + contract) |
| [`baseline-audit.md`](./baseline-audit.md) | PA-0.3: verify commands + commit anchor |
| [`k4-personal-routes.md`](./k4-personal-routes.md) | PA-0.2: Worker + DO public routes |
| [`manifest.md`](./manifest.md) | D-PA3: `GET /agent/.../manifest` field list |
| [`operator-data-lifecycle.md`](./operator-data-lifecycle.md) | D-PA4/D-PA5: export + retention reality |
| [`governance-youth.md`](./governance-youth.md) | D-PA6: mesh-start vs agent-hub check |

**Primary code paths** (from `software/`)

- `k4-personal/` — Worker + `PersonalAgent` DO
- `p31ca/public/planetary-onboard.html` — `p31_subject_id` write
- `p31ca/public/mesh-start.html` — chat + tetra
- `p31ca/public/p31-welcome-packages.json` — welcome + dock defaults
- `p31ca/workers/passkey/` — WebAuthn (identity hardening, optional in PAR v1)

**BONDING Soup (home root)**

- **`soup-demo.html`** (same `npm run demo` as Cognitive Passport) links to **`../../p31ca/public/planetary-onboard.html`** and **`mesh-start.html`** via paths under `andromeda/software/…` when this tree is present—**full stack dev** from one static server.
- **`P31-ROOT-MAP.md`**, **`README.md`**, **`AGENTS.md`** item **8c**, and **`docs/REVIEW-SUPPLEMENT-C-ECO-CWP-AND-INTEGRATIONS.md`** section **C.1b** describe the integration.

**Verify**

- From Andromeda `software`: `pnpm --filter k4-personal verify`
- From P31 home (if monorepo linked): `npm run verify:mesh` (includes live probe when strict)
