# Chapter 3: The EPCP Dashboard & Hardware Exoskeleton — The Body

---

## 3.1 Disambiguating the EPCP

The acronym "EPCP" carries a dual legacy within the P31 architecture, rooted in the professional background of the system's architect as a DoD civilian nuclear electrical engineer supporting the United States Navy Submarine Force.

### The Naval EPCP: Electric Plant Control Panel

In naval architecture, the EPCP is the **Electric Plant Control Panel**, located in the maneuvering area of a nuclear submarine alongside the Steam Plant Control Panel (SPCP) and Reactor Plant Control Panel (RPCP). The EPCP is the centralized nexus for power distribution and casualty control. Propulsion Plant Electrical Operators utilize the EPCP to:

- Shift electric plant lineups from normal to alternate control stations
- Conduct high-voltage maintenance on systems exceeding 700 volts
- Analyze shutdown electric plant trends
- Isolate damaged electrical equipment during high-stakes casualties

The panel features a highly complex **mimic bus** with indicator lights displaying circuit breaker positions, automatic bus transfer (ABT) devices, and systemic health — the ultimate arbiter of the vessel's electrical survivability.

### The Cybernetic EPCP: Experimental Peace Communication Protocol

In the P31 ecosystem, the EPCP is reimagined as the **Experimental Peace Communication Protocol** — an advanced sub-layer of the L.O.V.E. Protocol. Drawing direct inspiration from the life-or-death rigor of the naval panel, this cybernetic EPCP is a Delta-topology mesh network designed to:

- Replace hierarchical communication structures
- Actively monitor and correct **"Phase Noise"** and **"Jurisdictional Entropy"**
- Track invariant parameters like quantum correlation (I) across the network

Just as the naval EPCP manages physical voltage and isolates electrical faults to prevent catastrophic reactor scram, the cybernetic EPCP manages **"social voltage"** and isolates semantic faults to prevent cognitive burnout. It regulates information flow between the Centaur, the Centaur's Mate, and the external world, ensuring high-entropy adversarial data streams cannot penetrate the protected **Family Volume.**

---

## 3.2 The Spaceship Earth Living Dashboard

Drawing upon R. Buckminster Fuller's metaphor of "Spaceship Earth" — the integrated, interdependent planetary system requiring conscious stewardship — the system employs a **Living Dashboard** as the visual interface for the "Noosphere."

### Architecture

Operating within the React-based monorepo of the Shelter Progressive Web App (PWA), the interface abandons flat 2D representations in favor of **true volumetric (3D) navigation** via the **Isotropic Vector Matrix (IVM):**

- **Core Renderer:** Three.js r128 geodesic dome, utilizing icosahedron vertices instantiated as sphere nodes depicting the local mesh network as a "glowing mesh of tetrahedrons."
- **Headless Architecture:** No centralized "Central Sun" admin node. As active nodes verify connections via the EPCP, they form tetrahedrons that recursively link into larger geodesic structures, providing real-time display of collective states and "geometric trust."

### Visual Encoding of Cognitive Load

- **UnrealBloom post-processing** and custom **GLSL wireframe shaders** represent energetic flow and cognitive load.
- Node brightness is **dynamically driven by real-time "voltage" scores** representing cognitive load and metabolic capacity.
- As stress increases, voltage rises, catching the bloom filter and causing affected nodes to intensely radiate — visually alerting the operator to topological instability and impending Red Board conditions.
- GLSL shaders **pulse in time with the operator's biometric breathing patterns**, establishing somatic resonance between observer and interface.

### Quantum Breath Pacer

A **Canvas 2D "Quantum Breath" pacer** replaces basic CSS loading elements with a fluid, 180-particle ring animation that guides regulated autonomic breathing.

### Progressive Disclosure (Spoon Economy)

The UI tracks the exact metabolic cost of digital interactions (e.g., Social Masking: 3-5 spoons/hour). Operational capacity is categorized into four layers:

| Layer | State | Access Level |
|-------|-------|-------------|
| **1** | BREATHE | Foundational. Breathing pacer and basic status only. |
| **2** | FOCUS | Notifications and task queue visible. |
| **3** | BUILD | Standard dashboard with full data feeds. |
| **4** | COMMAND | Full "Cockpit" — high-level observability over Genesis Gate infrastructure and local AI agents. Unlocked via passphrase (e.g., "Delta Mesh"). |

The **Samson V2 PID controller** (damping function / "Brain") detects when spoon expenditure nears critical limits. The conditional disclosure UI automatically restricts access to high-friction tasks, folding inward to mask complex data and limit interactions to the BREATHE state — preventing complete **"Thermal Shutdown."** Full cockpit access requires the operator's capacity to return to a safe baseline (Layer 3: 9-12 spoons).

---

## 3.3 The Hardware Exoskeleton: Node One (Phenix Navigator)

Software abstractions are inherently vulnerable to physical infrastructure degradation. True sovereignty requires a physical anchor — **"Node One,"** instantiated as the **Phenix Navigator.**

### Design Philosophy

The Phenix Navigator is a handheld, offline-first, sovereign communication device engineered specifically as a **cognitive prosthetic.** The design rigorously abandons traditional Wi-Fi and cellular modems — the **"Mouse"** (high speed, fragile, ISP-dependent). Instead, the primary communication backbone utilizes:

**"The Whale" Protocol:** A Semtech SX1262 **LoRa (Long Range) transceiver** operating on the license-free **915 MHz** frequency band. Link budget: **178 dB**, enabling low-bandwidth, high-penetration communication through reinforced concrete and urban foliage without line-of-sight. The Delta mesh remains operative during catastrophic grid failures.

### Internal Architecture: The "Phantom" Configuration

| Component | Function |
|-----------|----------|
| **Espressif ESP32-S3** | Dual-core Xtensa LX7 at 240 MHz, 8 MB PSRAM. |
| **Bi-Cameral Design** | **Body:** LoRa PHY layer and RF propagation. **Brain:** Tetrahedron Protocol encryption and identity. |
| **NXP SE050 Secure Element** | EAL 6+ certified. Private cryptographic keys are "born in silicon" and never extracted into main MCU memory. Total immunity against software exploitation and memory scraping. |

---

## 3.4 Haptic Primacy: The Thick Click & Somatic Bridge

To counteract the **"proprioceptive voids"** of modern touchscreens — which demand continuous visual monitoring and accelerate sensory exhaustion for neurodivergent operators — the interface emphasizes **Haptic Primacy.**

### Mechanical Interface

- **Kailh Choc V2 Navy** low-profile mechanical switches with a mechanical click bar requiring **60 gf** actuation force, delivering a sharp, hysteresis-rich tactile snap.
- **ALPS EC11 rotary encoders** (high-torque) enable **"Blind Texture" navigation** — counting clicks without shifting ocular focus, preserving working memory.

### Dynamic Haptic Feedback

A **Texas Instruments DRV2605L** driver linked to a **Linear Resonant Actuator (LRA)** motor transmits a nuanced **"Haptic Vocabulary"** — choreographed vibration sequences translating digital events into physiological sensation.

### The Haptic Totem

The terminal node of the EPCP. By routing semantic stress scores (Voltage) through the DRV2605L to the LRA, digital entropy is converted into physical sensation. **The loop is closed:** the mind thinks, the software scores, the hardware acts.

---

## 3.5 The Bubble Shield

For extreme environments requiring absolute sensory isolation, the hardware exoskeleton extends into the **Bubble Shield architecture**, orchestrated by the ESP32 Central Nervous System across three peripheral subsystems:

### Subsystem Alpha: Visual Isolation (PDLC Visor)

A high-voltage AC inverter circuit drives a **Polymer Dispersed Liquid Crystal (PDLC) visor:**

- **OFF state:** Refractive index mismatch between liquid crystal droplets and polymer matrix causes **Mie scattering**, rendering the visor opaque — instant visual isolation.
- **ON state:** Electric field aligns molecules homeotropically, instantly restoring transparency.

### Subsystem Beta: Auditory Control (DSP)

An **ADAU1701 Digital Signal Processor** offloads audio mixing from the ESP32 for zero-latency throughput:

- Noise gate
- **Bandpass filter:** 300 Hz – 3.4 kHz (strictly vocal range pass-through)
- Hard limiter acting as active hearing protection against sudden impact noise

### Subsystem Gamma: Deep Pressure Therapy (DPT)

A cranial compression system managed by a **pneumatic H-bridge:**

| Component | Specification |
|-----------|--------------|
| **Pump** | 12V Micro Diaphragm Pump in flexible TPU cradle (decouples structure-borne noise) |
| **Sensor** | MPS20N0040D pressure transducer |
| **Target Pressure** | 20-25 mmHg hold |
| **Fail-Safe** | Normally Open (NO) 12V/5V solenoid valve — immediately vents bladder to atmosphere on power loss |
| **Hard Limit** | Mechanical relief valve at 60 mmHg — prevents tissue ischemia |

---

## 3.6 The Sovereign Data Layer

Traditional enterprise architecture (centralized ACID databases) creates Wye-topology data bottlenecks, requires constant connectivity, and strips the operator of data ownership.

### CRDT-Based Local-First Architecture

The system functions as a **"Living Web Document"** utilizing CRDTs:

- **Yjs & Automerge:** Structured data and real-time text editing.
- **Graph CRDTs (NextGraph):** OR-set (Observed Remove Set) logic for semantic linking.
- **P2P Overlay:** Strictly avoids DHTs. Document commits organized as a Directed Acyclic Graph (DAG) secured with convergent encryption (Symmetric ChaCha20).
- **Backend Integration:** Headless worker connected to y-websocket room intercepts binary Y.Doc update payloads, converts text into an Abstract Syntax Tree (AST), and executes idempotent Cypher MERGE statements against a Neo4j graph.

### Onion Layer Security

| Layer | Mechanism |
|-------|-----------|
| **Transport** | Convergent encryption (ChaCha20) |
| **Key Management** | Lit Protocol (Threshold MPC TSS + TEEs) |
| **Key Distribution** | Programmable Key Pairs across independent nodes, 2/3 consensus threshold |
| **Access Control** | JSON-defined ACCs negotiated via Lit JS SDK in the local browser |
| **Identity** | Non-transferable Soulbound Tokens (SBTs) |
| **Financial Privacy** | ERC-5564 Stealth Addresses |

### OAuth Forensics

Before deployment, the system executes rigorous OAuth Forensics using the Admin SDK Reports API, building a comprehensive **Token Manifest** to identify high-risk data exfiltration vectors and "Ghost Apps." A **"Token Shred"** policy systematically revokes all non-allowlisted tokens, sealing the workspace's attack surface.

---

*Operational runbook extracted to `P31_DEPLOYMENT_RUNBOOK.md`. Architecture reference in `P31_ARCHITECTURE.md`.*

---
