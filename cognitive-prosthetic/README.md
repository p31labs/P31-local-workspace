# P31 Cognitive Prosthetic

A local-first, neurodivergent-first cognitive accessibility infrastructure.

## Architecture

- **SIC-POVM 4-Axis Routing:** Quantum-inspired message routing across a 7-node Sierpinski topology
- **Fawn Guard:** AI filter that strips neurotypical platitudes from incoming communications
- **7-Node Mesh:** R → {A,B,C} → {D,E,F} with deterministic parent/child bindings
- **Local-First:** Runs entirely on-device via PGLite; no telemetry, no tracking

## Quick Start

```bash
npm install
npm run dev
```

## Dual License

This project operates under a strict **Dual-License Model**:

- **Open Source (AGPL-3.0):** Free for individuals, researchers, and open-source contributors. If you run this as a service, you must share your modifications. See [LICENSE](LICENSE) for details.
- **Commercial License:** Required for closed-source SaaS integration, institutional healthcare deployment, and enterprise WCAG 2.2 / ADA Digital Compliance. See [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md) for enterprise pricing, managed hosting options ($20/mo API), and compliance deployment.

## Funding

- **GitHub Sponsors:** [github.com/p31labs](https://github.com/p31labs)
- **Ko-fi:** [ko-fi.com/trimtab69420](https://ko-fi.com/trimtab69420)
- **Donate:** [p31ca.org/donate](https://p31ca.org/donate)

## Topology

```
        R (Root Orchestrator)
      /   |   \
     A    B    C
    / \  / \  / \
   D   E    F    D
```

R → {A, B, C} | A → {D, E} | B → {E, F} | C → {D, F}

## Prior Art

This repository establishes prior art for cognitive prosthetic architecture, including local-first PGLite storage, SIC-POVM routing, and AI-mediated communication filtering for neurodivergent operators.

Copyright (C) 2026 P31 Labs. Licensed under AGPL-3.0. See [LICENSE](LICENSE) and [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md).
