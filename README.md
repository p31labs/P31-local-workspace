# P31 Andromeda Cognitive OS / Project Polyhedron

[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/p31labs/andromeda/badge)](https://securityscorecards.dev/viewer/?uri=github.com/p31labs/andromeda)
[![Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/trimtab69420)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

### Current Status (June 2026)

P31 Labs, Inc. is a **determined 501(c)(3) nonprofit** (EIN 42-1888158) with an active **Mercury bank account** and **SAM.gov UEI registration**. Fiscal sponsorship has been fully migrated — P31 Labs operates independently as its own tax-exempt entity. Contributions are tax-deductible.

**P31 Andromeda** is the decentralized, zero-telemetry cognitive operating system engineered by P31 Labs, Inc. -- a Georgia domestic nonprofit (501(c)(3) determined). It provides local-first mesh networking, verifiable ADA Title II compliance tools, and autonomic cognitive insulation for neurodivergent operators.

**Project Polyhedron** is the sovereign, local-first, polymorphic web architecture within Andromeda. It spans biophysics (`p31-core`), adaptive UI facets (Law/Kid/A11y), a VS Code IDE copilot, a community Discord bot, and production edge monitoring.

### Packages

| Package | Description |
|---------|-------------|
| `packages/p31-core` | Biophysical, cryptographic, and cognitive pacing engine. Larmor frequency, coherence, spoon ledger. |
| `packages/ui-facets` | Polymorphic React dashboards: Law (terminal), Kid (playful), A11y (accessible). |
| `packages/vscode-extension` | VS Code sidebar copilot with sovereign data awareness. |
| `workers/discord-alerter` | Cloudflare Worker forwarding alerts to Discord webhook. |
| `ecosystem/discord` | Oracle Bot "Classic Willy" with Upstash Redis and Crew Manual onboarding. |

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

## Project Polyhedron Core

```bash
cd packages/p31-core
pnpm install && pnpm build

cd ../vscode-extension
pnpm install && pnpm build

cd ../../ecosystem/discord
docker compose up -d
```

See [`packages/p31-core/`](packages/p31-core) for the zero-dependency TypeScript library, [`packages/ui-facets/`](packages/ui-facets) for the React UI facets, and [`ecosystem/discord/`](ecosystem/discord) for the Oracle Bot.

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

## Funding

P31 Labs operates without venture capital or IP-NFT extraction. Support open-source assistive tech:

- **Direct donations:** Tax-deductible via P31 Labs' 501(c)(3). Contact will@p31ca.org.
- [Ko-fi](https://ko-fi.com/trimtab69420) (one-time)

## License

MIT (c) P31 Labs, Inc. Hardware designs are CERN-OHL-S. See [LICENSE](LICENSE).
