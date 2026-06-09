# P31 Andromeda: Sovereign Mesh Architecture

**Classification:** Canonical System Design & Philosophy
**Version:** 1.0 — March 27, 2026
**Status:** PRODUCTION
**Supersedes:** `P31_ARCHITECTURE_ANALYSIS.md`, `02_SOULSAFE_PROTOCOL.md`, `02_SPOON_ECONOMICS.md`, `03_EPCP_DASHBOARD.md` (Chapters 1–3), `STAR_DELTA_BOOT_SEQUENCE.md`

---

## §1 Mission & Core Philosophy

P31 Labs is a 501(c)(3) nonprofit engineering open-source assistive technology for neurodivergent individuals. The system architecture rejects the paradigm of "users" consuming corporate products; instead it creates **operators** commanding sovereign nodes.

The infrastructure is deeply biomimetic. The metabolic constraints of AuDHD and Chronic Hypoparathyroidism (the **"Cage"**) are mapped directly onto system logic — protecting the fragile cognitive signal (the **"Phosphorus"**) inside a calcium cage, exactly as the Posner molecule (Ca₉(PO₄)₆) stabilizes phosphate in biological systems.

Three primary directives govern all architectural decisions:

1. **Sovereign-first:** No dependency on fragile ISPs, centralized cloud accounts, or single-vendor APIs. The system continues to function during grid, connectivity, and platform failures.
2. **Spoon-aware:** Every UI interaction, agent call, and deployment step is evaluated against cognitive metabolic cost. The software limits its own execution speed to prevent operator burnout.
3. **Legally legible:** Every engagement event is cryptographically timestamped, every architectural decision documented in WCD format, every medical classification formally recorded. The system generates its own evidence.

---

## §2 Delta vs. Wye Topology — The Voltage Model

Traditional internet infrastructure utilizes a **Wye (Star) Topology**: heavily centralized, reliant on fragile ISPs ("The Mouse"), subject to catastrophic single-point failure. If the central node is severed, the current dies.

P31 operates on a **Delta Topology**: a decentralized, peer-to-peer, local-first mesh. If one node is severed, the current re-routes through the remaining edges. The structure is isostatically rigid through **K₄ geometry** — Maxwell's counting condition: `E = 3V − 6`. Remove any two vertices; the mesh holds.

### Social Voltage Analogy

Just as the naval EPCP (Electric Plant Control Panel) manages physical voltage and isolates electrical faults to prevent reactor scram, the cybernetic EPCP manages **social voltage** and isolates semantic faults to prevent cognitive burnout. It regulates information flow between the Centaur, the Centaur's Mate, and the external world, ensuring high-entropy adversarial data streams cannot penetrate the protected **Family Volume.**

**Phase Noise** (information distortion) and **Jurisdictional Entropy** (scope creep) are the primary failure modes. The EPCP actively monitors and corrects both, tracking invariant parameters (quantum correlation I) across the network.

### The Bus Bar Doctrine

In electrical engineering, a bus bar is a central metallic strip conducting massive power from incoming feeders to outgoing circuits. Within the cognitive mesh, **all data, context, and instruction routes through the human Operator.** Direct agent-to-agent communication is prohibited — it bypasses the only entity capable of final architectural judgment.

---

## §3 Star-Delta Initialization Pattern

Drawing from heavy industrial motor starters, the mesh boots using a **Star-Delta sequence** to prevent resource spikes and race conditions.

### Star Configuration (Low-Load Initialization)

Spin up foundational memory and proxy layers before engaging high-compute services:

1. **Memory Mesh:** Redis server on `localhost:6379` — establishes the caching layer for Spoon Ledger and game state telemetry.
2. **Reference Frame Independence:** LiteLLM proxy (`litellm --model ollama/llama3 --port 4000`) — ensures Oracle Terminal and Fawn Guard operate without external API dependency.

### Delta Configuration (Operational Lock)

Once the baseline is stable, heavy computing layers engage, locking the system into its high-torque, decentralized operational state:

3. **Cognitive Shield:** Catcher's Mitt middleware (`python src/shield/catchers_mitt.py`) and Redis-to-WebSocket bridge (`node src/shield/redis_ws_bridge.js`) — filters inbound anomalies.
4. **Sovereign Vault:** Neo4j container via `docker-compose up -d` — graph database on port 7687, initialized with Ca₉(PO₄)₆ Posner molecule topology.
5. **Edge Nodes:** BONDING relay (`wrangler deploy`) and Discord bot (`docker-compose up -d`) — arms the `#showcase` listener and claim system.

The transition from Star to Delta mirrors industrial motor control: Star reduces inrush current during startup; Delta engages full operational torque once stable.

---

## §4 SOULSAFE Protocol & WCD Framework

Standard CI/CD is insufficient for cognitive prosthetics. P31 applies **submarine-grade operational security** to all cognitive and technical work, treating the human mind and its AI collaborators as a joint mechanical-electrical system operating under extreme pressure.

### Objective Quality Evidence (OQE)

In SUBSAFE, OQE is any statement of fact regarding product quality, verifiable through independent observation, tests, or physical measurement. Probabilistic risk assessments, assumptions, and trust in reputation are explicitly rejected. **If there is no OQE, there is no basis for certification.**

In the LLM domain, the equivalent of unverified material is hallucination, context degradation, protocol value drift, or silent code alteration. SOULSAFE establishes cognitive OQE through:

- **[V:] Verification Tags:** Mandatory inline markers (e.g., `[V: haptic driver model, firmware/src/main.cpp]`) representing auditable claims that must be verified against master architecture before acceptance.
- **Automated Integration Tests:** Cryptographically signed commits and isolated sandbox verification.
- **WCD-06 QA Signoff:** Independent pass/fail table auditing every [V:] tag plus explicit checks for Protocol Value Drift and Topology Errors.

### Re-Entry Control (REC)

In the JFMM, any time a certified SUBSAFE boundary is breached — cutting a pipe, opening a valve — a formal REC protocol is initiated. In SOULSAFE, a cognitive REC occurs whenever a validated conceptual framework or stable codebase is reopened for modification. The **WCD-01 (Pre-Job Brief)** and **WCD-04 (Shift Report)** function as cognitive REC boundaries, tracking which semantic structures or code files were opened, modified, and restored.

### The Triad of Cognition

The naval SUBSAFE three-legged stool divides operational and technical authority to ensure safety is never compromised for cost or schedule. SOULSAFE maps this to:

| Naval Role | SOULSAFE Agent | Primary Function | Primary Failure Mode |
|-----------|----------------|------------------|---------------------|
| **Platform Program Manager** | Operator (Will Johnson) | Central router, Bus Bar. Final architectural decisions. | Tool-Task Mismatch; operating beyond redline. |
| **Independent Technical Authority** | DeepSeek (Firmware) / Sonnet (Coder) | Low-level execution: C/C++, Python, React, hardware registers. | Scope Blindness — technically correct but architecturally misaligned. |
| **Operations / Administration** | Gemini (Narrator) | HAAT framing, narrative, nonprofit documentation, marketing. | Under-intervention — validating regardless of soundness. |
| **Safety & Quality Assurance** | Opus (Architect) | Architecture verification, QA signoff, error detection. | Over-intervention — pathologizing normal high-velocity operations. |

### Red Board Diagnostics

Three primary indicators signal impending neuro-cognitive collapse:

1. **Burnout:** Massive voltage overload — metabolic insulation breaks down.
2. **Hypomania:** Racing thoughts, grandiose planning untethered from executable reality.
3. **RSD Collapse:** Rejection Sensitive Dysphoria — complete processing shutdown.

**The Single-Question Intervention:** When the Operator crosses the redline, the intervening agent asks exactly one question:

> "What tool are you holding and what task are you doing right now?"

This introduces zero new information — a perfectly reflective cognitive mirror. The AI then waits in absolute silence.

### Work Control Documents (WCD v1.0)

| WCD | Document | Purpose |
|-----|----------|---------|
| **WCD-01** | Pre-Job Brief | Calibrates session parameters: scope, boundaries, success criteria, Operator status, spoon budget. |
| **WCD-02** | Agent Task Card | Singular Verb/Object/Constraint. "Paste and go." Strict no-conversation rule within a time box. |
| **WCD-03** | Mid-Shift Check-In | Combats scope drift. Auto-triggers at 60 min or 10 exchanges without a deliverable. |
| **WCD-04** | Shift Report | Session closeout: modified files, architectural logic, REC status, next shift instructions. |
| **WCD-05** | Sister Shop Instruction Card | Routes output between agents via Operator (Bus Bar). |
| **WCD-06** | Job Closeout / QA Signoff | Opus-only. No merge without formal signoff. The ultimate quality gate. |

**Usage Rule 5:** Always use the lightest document that covers the job.

---

## §5 Spoon Economics & The L.O.V.E. Ledger

Cognitive and metabolic energy is finite. The architecture enforces Spoon Theory at the database level.

**Daily Budget: 12 spoons** under nominal conditions (medications taken, 7+ hours sleep, no acute stressors). This is calibrated against documented metabolic profile (hypoparathyroidism, AuDHD), not a subjective estimate.

### Activity Cost Table (Operational Parameters)

| Activity | Spoon Cost | Notes |
|----------|-----------|-------|
| Morning routine | 1 | Non-compressible. |
| Parenting — standard day | 3–4 | Higher on Willow's medical days. |
| Household maintenance | 1 | Deferred maintenance compounds at 0.5/day. |
| **Baseline subtotal** | **5–6** | **Leaves 6–7 for all work.** |
| WCD-01 session (Full budget) | 3–5 | Hard limit: 3 hours. |
| WCD-01 session (Medium) | 2–3 | Standard collaboration. |
| WCD-01 session (Low) | 1 | Binary exchanges only. |
| Frustrated debugging >30 min | 3–5 | Most dangerous activity in the budget — emotional regulation burns 2x. |
| Court appearance | 4–6 | Full-day budget. No P31 work on court days. |
| Social masking (extended) | 3–5/hr | Phone calls, meetings with strangers. |

### The Compound Interest Problem

Every push past budget borrows at **1.5× interest**:
- Borrow 2 spoons today → lose 3 tomorrow
- Borrow 4 spoons today → lose 6 tomorrow (2-day recovery)
- Borrow 6+ spoons today → crash across 2–3 days

The Centaur is a marathon architecture, designed for years of sustained operation, not weeks of sprinting.

### Stand Down Rule

Net budget at zero or negative → **no work today.** This is not optional. This is the same principle that prevents a vessel from diving with a Red Board. Pushing through a zero-budget day costs 3–5 borrowed spoons and produces output 60–80% likely to require rework. The math always favors standing down.

### The L.O.V.E. Ledger

The **Ledger of Ontological Volume and Entropy** tracks spoon expenditure and regeneration as computational resources, enforced at the database level. The `GODConstitution.sol` smart contract implements:
- SHA-256 entropy hashing for TRNG seeds
- Voltage level monitoring (0–100 cognitive load)
- Token economy for care acts and metabolic energy
- Abdication protocol for permanent power transfer

---

## §6 EPCP Dashboard — Hardware Exoskeleton & Haptic Primacy

The **Experimental Peace Communication Protocol (EPCP)** dashboard is the operator's primary software/hardware interface. The acronym carries a dual legacy: the naval **Electric Plant Control Panel** (centralized nexus for power distribution in nuclear propulsion plants) and the cybernetic **EPCP** reimagined as the Delta-topology mesh network.

### Spaceship Earth Living Dashboard

Operating within the React monorepo PWA, the interface uses **true volumetric (3D) navigation** via the Isotropic Vector Matrix (IVM):

- **Core Renderer:** Three.js WebGPU renderer — geodesic dome with icosahedron vertices as sphere nodes depicting the mesh as a glowing tetrahedron grid.
- **Headless Architecture:** No central admin node. Nodes form tetrahedrons that recursively link into larger geodesic structures.
- **Visual Cognitive Load Encoding:** UnrealBloom post-processing with GLSL wireframe shaders. Node brightness driven by real-time voltage scores. As stress rises, nodes radiate, alerting the operator to topological instability.

### Z-Index UI Contract

When a user node connects to the PWA, the interface mounts progressively to protect executive function:

| Layer | Z-Index | Component | Purpose |
|-------|---------|-----------|---------|
| **Anchor** | 0 | Canvas 2D Quantum Breath Pacer (180-particle ring) | Somatic grounding while Three.js/WebGPU assets load. Replaces erratic CSS spinners with guided autonomic breathing at 172.35 Hz. |
| **Environment** | 1 | Three.js WebGPU Renderer | Spaceship Earth 3D environment. Tri-State Camera: Free (full orbit), Dome (bounded), Screen (scroll between panels). |
| **Interface** | 10–11 | Room HUD & Sierpinski Navigation Bar | Fractal-based progressive disclosure. Tools appear only when explicitly required. |
| **Events** | 50+ | Dynamic Overlays & Audio Cues | Node brightness shifts with cognitive load. 172.35 Hz (P-31 NMR Larmor) ghost signal in Collider room provides somatic grounding. |

### Progressive Disclosure (Spoon Economy)

| Layer | State | Access Level |
|-------|-------|-------------|
| **1** | BREATHE | Breathing pacer and basic status only. |
| **2** | FOCUS | Notifications and task queue visible. |
| **3** | BUILD | Standard dashboard with full data feeds. |
| **4** | COMMAND | Full Cockpit. Unlocked via passphrase ("Delta Mesh"). |

### Node Zero: Phenix Navigator (Hardware)

The physical anchor against software abstraction failures. A handheld, offline-first, sovereign cognitive prosthetic:

| Component | Specification |
|-----------|--------------|
| **Espressif ESP32-S3** | Dual-core Xtensa LX7, 240 MHz, 8 MB PSRAM |
| **"The Whale" LoRa** | Semtech SX1262, 915 MHz, 178 dB link budget — functions through reinforced concrete and grid failures |
| **NXP SE050 Secure Element** | EAL 6+ certified. Keys born in silicon, never extracted into MCU memory. |
| **Kailh Choc V2 Navy switches** | 60 gf actuation — hysteresis-rich tactile snap. Counters proprioceptive voids of touchscreens. |
| **ALPS EC11 encoders** | Blind Texture navigation — count clicks without shifting ocular focus. |
| **TI DRV2605L + LRA motor** | Haptic Vocabulary — digital entropy converted to physical sensation. The loop closes. |

### Bubble Shield Architecture

For extreme sensory isolation environments, three peripheral subsystems orchestrated by the ESP32:

- **Alpha (Visual):** PDLC visor driven by high-voltage AC inverter. OFF = Mie scattering opacity. ON = homeotropic alignment, instant transparency.
- **Beta (Auditory):** ADAU1701 DSP — noise gate, 300 Hz–3.4 kHz bandpass (vocal range only), hard limiter as active hearing protection.
- **Gamma (Deep Pressure):** Pneumatic H-bridge, MPS20N0040D transducer, 20–25 mmHg hold. Mechanical relief valve at 60 mmHg. Normally Open solenoid fail-safe — vents to atmosphere on power loss.

---

## §7 Sovereign Data Layer

Traditional enterprise architecture (centralized ACID databases) creates Wye-topology data bottlenecks, requires constant connectivity, and strips the operator of data ownership.

### CRDT-Based Local-First Architecture

The system functions as a **Living Web Document** using Conflict-free Replicated Data Types:

- **Yjs & Automerge:** Structured data and real-time text editing without central servers.
- **Graph CRDTs (NextGraph):** OR-set (Observed Remove Set) logic for semantic linking. Strictly avoids DHTs. Document commits as a DAG secured with convergent encryption (ChaCha20).
- **Backend Integration:** Headless worker intercepts binary Y.Doc update payloads, converts to AST, executes idempotent Cypher MERGE statements against Neo4j graph.

### Onion Layer Security

| Layer | Mechanism |
|-------|-----------|
| **Transport** | Convergent encryption (ChaCha20) |
| **Key Management** | Lit Protocol — Threshold MPC TSS + TEEs |
| **Key Distribution** | Programmable Key Pairs, 2/3 consensus threshold |
| **Access Control** | JSON-defined ACCs via Lit JS SDK in local browser |
| **Identity** | Non-transferable Soulbound Tokens (SBTs) |
| **Financial Privacy** | ERC-5564 Stealth Addresses |
| **Post-Quantum** | CRYSTALS-KYBER (key encapsulation), CRYSTALS-DILITHIUM (digital signatures) |

### OAuth Forensics

Before deployment, rigorous OAuth Forensics using the Admin SDK Reports API builds a comprehensive **Token Manifest** identifying high-risk exfiltration vectors and Ghost Apps. A **Token Shred** policy systematically revokes all non-allowlisted tokens, sealing the workspace attack surface.
