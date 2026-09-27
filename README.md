# P31 Andromeda Cognitive OS

[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/p31labs/andromeda/badge)](https://securityscorecards.dev/viewer/?uri=github.com/p31labs/andromeda)
[![Open Collective](https://opencollective.com/p31-labs/backers.svg)](https://opencollective.com/p31-labs)
[![Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/trimtab69420)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**P31 Andromeda** is the decentralized, zero-telemetry cognitive operating system engineered by P31 Labs, Inc. -- a Georgia domestic nonprofit (501(c)(3) pending). It provides local-first mesh networking, verifiable ADA Title II compliance tools, and autonomic cognitive insulation for neurodivergent operators.

> ⚠️ **npm scope migration (2026-09-27):** `@p31/*` is **orphaned** -- publish access to that scope is lost. All active packages live under **`@p31ca/*`** (e.g. `@p31ca/ui`, `@p31ca/design-core`, `@p31ca/cli`). **Do not depend on `@p31/*` for new work** -- depend on `@p31ca/*`. Workspace-internal names that were never published (`@p31/shared`, `@p31/interface-generator`, `@p31/design-system`, and the `software/packages/*` forks) remain workspace-resolved and are intentionally untouched.

## Repository Topology (K4 Invariant)

```
andromeda/
├── admin/                     # Corporate governance, board resolutions
├── apps/                      # Standalone edge apps (Willow, PHOS)
├── cwp-*/                     # Ecosystem alignment & jitterbug telemetry
├── firmware/                  # ESP32-S3, LVGL, LoRa (Node Zero / Node One)
├── governance/                # Decision logs, code of conduct
├── infrastructure/            # Cloudflare Workers, Terraform
├── legal-instruments/         # ADA Title II firewalls, court filings
├── packages/                  # Shared TypeScript libraries
├── software/                  # Web apps (p31ca, bonding)
└── wcds/                      # Work Control Documents (immutable runbooks)
```

## Getting Started

```bash
git clone https://github.com/p31labs/andromeda.git
cd andromeda
pnpm install
pnpm run build
cd software/p31ca
pnpm run dev
```

## Security & Compliance

- **OpenSSF Scorecard** -- ensures supply chain integrity.
- **Branch protection** -- `main` requires PR + 1 approval + passing status checks.
- **Vulnerability reporting** -- via [GitHub Security Advisories](https://github.com/p31labs/andromeda/security/advisories).

## Agent governance — the reference implementation

P31 runs a governance stack aligned with the IETF's 2026 agent-identity and audit work: **Agent Audit Trail** (SHA-256 per RFC 8785, EU AI Act compliant), **AIC-JWT / AIP** (capability-bound agent identity), and **MTAC** (Ed25519 + ML-DSA-65 post-quantum signatures), aligned with the WIMSE working group. The Loom — a family-scoped, self-hosted co-presence agent — enforces "proposes, never acts" at the gate (its "Proof-of-Behavior" enforcement layer), with a refusal sidecar any third party can verify.

- `docs/PROOF-OF-BEHAVIOR.md` — the compliance mapping (each IETF draft → the code path)
- `docs/POSITIONING.md` — the competitive claim
- `docs/GRANT-PIPELINE.md` — verified open funding (Rural AI Catalyst, Sentient $42M, NLnet)

Live: `loom.p31ca.org` (Access-gated), `GET /api/loom/verify`, 7 production portals.

## Funding

P31 Labs operates without venture capital or IP-NFT extraction. Support open-source assistive tech:

- [Open Collective](https://opencollective.com/p31-labs) (fiscal sponsor)
- [Ko-fi](https://ko-fi.com/trimtab69420) (one-time)

## License

MIT (c) P31 Labs, Inc. Hardware designs are CERN-OHL-S. See [LICENSE](LICENSE).
