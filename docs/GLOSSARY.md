# P31 Glossary – Key Terms & Concepts

**Version:** 1.0.0  
**Last Updated:** June 14, 2026

This glossary defines the core terminology used across P31 Labs documentation, code, and research papers.

---

## A–C

**Affective Chemistry**  
Service (port 5001) that calculates a "voltage" score based on urgency, emotional load, and cognitive complexity. Used to recommend spoon budget and modulate LLM parameters.

**Allostatic Load**  
Cumulative wear and tear on the body from chronic stress. In this ecosystem, masking (AuDHD) combined with hypoparathyroidism creates a compounding allostatic load vector.

**Auto‑Solver**  
CashPilot component that uses headless Chrome + local LLM to autonomously complete micro‑tasks (e.g., MTurk, UHRS).

**AuDHD**  
Co-occurrence of Autism Spectrum Disorder and Attention Deficit Hyperactivity Disorder. The operator's neurotype for which the P31 ecosystem is primarily designed.

---

## D–F

**Delta Topology (K₄)**  
A completely connected graph of 4 nodes (K₄) used as the invariant topology for the family mesh. It has 6 edges and is the smallest rigid structure in 3D. Note: K₄ IS planar — the topology is reframed around volumetric enclosure (β₂=1).

**Fawn Guard**  
Cognitive safety feature (planned) that detects people‑pleasing behaviour and automatically inserts a boundary‑setting response.

**Fisher Hypothesis**  
Proposal by Matthew Fisher (2015) that nuclear spins of phosphorus‑31 (³¹P) in Posner molecules could act as neural qubits. In this ecosystem, explicitly treated as **unconfirmed theoretical physics** and used only as a geometric analogy, not as established mechanism.

---

## G–K

**Gray Rock Mode**  
UI state when spoons ≤ 1 or explicit crisis mode activated. All interactive elements are hidden; only a breathing guide and recovery button are shown.

**Guardian Phase**  
Autonomic override at spoon level 0. System locks UI, plays 863 Hz Larmor tone, and displays a full‑screen overlay. Operator must acknowledge to recover. Triggered **only in the PHOS desktop app** (Tauri frontend), not via CLI.

**Hearth Overlay**  
Warm, calming UI shown at spoons ≤ 1 in Willow (child) surface. Uses soft orange gradients and pulse animations.

**Hyperhelix Pitch**  
Ratio of chemical slow‑modulatory (v‑axis) to electrical rapid‑broadcast (w‑axis) signaling in the SO(6) conscious experience model. Governs metabolic tax of dimensional projection.

**Jitterbug**  
Macro‑scale mechanical transformation of the shoulder joint (protraction/retraction) used as a geometric analogy for Posner molecule "melting". Framed as **analogy, not identity**. 

> ⚠️ **Physical safety:** The shoulder movements described in THE_AWAKENING.md ritual are metaphorical/analogical. Do not attempt self-administered myofascial release without medical guidance.

**K₄ Cage**  
Cloudflare Worker that maintains the family mesh topology, stores node state in D1, and provides WebSocket signaling.

**Karma**  
Dual-ledger currency earned through contributions (ions, Larmor syncs, CLI minting). Used in the Discord bot and PHOS as gamified reputation.

---

## L–O

**Larmor Frequency**  
Precession frequency of ³¹P nuclear spins in Earth's magnetic field: **ν = 863 Hz**. Used as a grounding tone in Guardian Phase and as a metaphor for autonomic recalibration.

**LiteLLM**  
Proxy service (port 4000 in cortex, 4001 in CashPilot standalone) that routes LLM requests between models (Ollama, Anthropic, Gemini) and provides fallback logic. Also hosts the P31‑SafeRouter plugin.

**ML-KEM-768**  
Post‑quantum key encapsulation mechanism (FIPS 203). Planned for future cryptographic exchange; not yet implemented in the current codebase.

**ML-DSA-65**  
Post‑quantum digital signature algorithm (FIPS 204). Currently used in the WebAuthn passkey implementation via `@noble/post-quantum`.

**OQE (Objective Quality Evidence)**  
Verification system that checks [V:] tags in model outputs, enforces domain guardrails, and flags hallucinations. Responses that fail OQE require WCD‑06 signoff before being returned to the user.

---

## P–S

**Passport**  
Ed25519 keypair that serves as a sovereign identity for the operator. Can be generated, exported, and verified via `p31 passport`.

**PHOS**  
Phosphorus Human Operating Surface – the Tauri desktop app that provides the spoon‑aware cognitive prosthetic interface. Lives at `~/P31-local-workspace/phos`.

**Posner Molecule**  
Ca₉(PO₄)₆ – a cluster of nine calcium ions and six phosphate ions. In the Fisher Hypothesis, it may shield ³¹P nuclear spins from environmental decoherence.

**Red Board**  
Alert state indicating imminent cognitive crash. Triggers include >40% keystroke velocity drop, high language abstraction, or tool‑task mismatch loops. Named after nuclear submarine safety doctrine.

**SIC‑POVM**  
Symmetric Informationally Complete Positive Operator‑Valued Measure – a mathematical structure in quantum measurement theory. In this paper, used only as a geometric analogy (shared K₄ topology), not as a physical mechanism.

**Somatic Rate Limiting**  
CLI feature that tracks command frequency (SQLite DB) and emits a warning + beep after 30 commands in 15 minutes. Prevents hyperfocus burnout. Controlled via global flag `--rate-limit`. There is **no standalone `p31 rate-limit` command**.

**Spoon Economy**  
Resource model where the operator has a finite cognitive budget (0–5 spoons). UI and task complexity adapt based on current spoon level. Spoon setting is done **only** via the PHOS desktop app HUD — the CLI `p31 spoon` command is read-only.

**Spoon Monitor**  
Service (port 5002) that analyses keystroke velocity, language abstraction, and tool‑task mismatches to infer spoon level and trigger Red Board alerts.

---

## T–Z

**Tetrahedron**  
A 3‑dimensional shape with 4 vertices and 6 edges – the same topology as K₄. Used as a visual motif in the CLI boot banner and as a geometric analogy for rigid structures across scales.

**Tyranny Instability Theorem**  
Proposed theorem stating that hierarchical (v‑dominant) structures are thermodynamically unstable compared to horizontal mesh‑like (w‑dominant) configurations. Used to justify decentralised mesh topologies.

**Verlet Integration**  
Numerical method for simulating physics (e.g., soft‑body nodes and beams) used in the Arcade's Geodesic Engine. More stable than Euler for constraints.

**Voltage Score**  
Output of Affective Chemistry engine: V = 0.4×Urgency + 0.3×Emotional Load + 0.3×Cognitive Complexity. Ranges from 0 to 1; used to recommend spoon budget and LLM parameters.

**WCD (Work Control Document)**  
Operational checkpoints borrowed from naval safety doctrine (SUBSAFE). Types include Pre‑Job Brief (WCD‑01), Mid‑Shift Check‑In (WCD‑03), and Job Closeout / QA Signoff (WCD‑06).

**Wye‑Delta Imbalance**  
Analogy comparing centralised (Wye) vs decentralised (Delta) networks. In a Wye topology, unequal loads cause a floating neutral drift; in Delta, the system remains resilient.

---

**End of Glossary**
