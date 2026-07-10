# NGI Zero Commons Fund — Full Proposal

**Project Title:** K4-Mesh-Core: Open Standard for Sovereign Peer-to-Peer Mesh Networks
**Call:** NGI0 Commons Fund, 13th Open Call
**Requested Amount:** €35,000 EUR
**Duration:** 9 months
**License:** MIT/Apache-2.0
**Submitted by:** P31 Labs, Inc. (EIN 42-1888158)
**Contact:** William R. Johnson | will@p31ca.org | ORCID 0009-0002-2492-9079
**Repository:** https://github.com/p31labs/andromeda

---

## Generative AI Disclosure

This proposal was drafted with the assistance of Kilo (openrouter/owl-alpha), an AI code assistant. GenAI was used for document structuring, formatting, and drafting. All technical content was directed and reviewed by William R. Johnson based on P31 Labs' existing deployed infrastructure. A full prompt provenance log is maintained at `docs/grants/prompt-provenance-log.md`.

---

## 1. Abstract

P31 Labs proposes to establish K4-Mesh-Core as an open standard for sovereign peer-to-peer mesh networks — a lightweight, secure routing protocol for resource-constrained devices operating in intermittently connected environments. Unlike application-specific "solutions," K4-Mesh-Core is foundational infrastructure: the TCP/IP equivalent for mesh networks. It enables off-grid, resilient communication that survives internet outages and censorship.

The protocol is built on K4 complete graph principles, achieving optimal connectivity with minimal overhead. It targets the ESP32-S3 ecosystem (SX1262 LoRa, WiFi) but is transport-agnostic by design. All outputs are MIT/Apache-2.0 licensed; all development happens in public.

**Track record:** 22 peer-reviewed white papers (Zenodo), BONDING (shipped), PHOS OS (22 surfaces, deployed), Genesis Gate v4.1.0, 7+ live Cloudflare Workers.

---

## 2. Strategic Positioning

Most mesh projects build closed verticals. K4-Mesh-Core inverts this — we define the routing layer once, openly, and let anyone build on top. Our formal protocol specification, permissive licensing, and reference implementation enable permissionless innovation in resilient, sovereign mesh networks.

---

## 3. Technical Specification

### Protocol Stack
```
Application Layer (User-defined)
        ↓
k4-mesh-core (Routing, Security, Reliability)
        ↓
Adaptation Layer (LoRa, WiFi, Ethernet, Serial)
        ↓
Physical Layer (SX1262, ESP32 WiFi, UART, etc.)
```

### Key Design Decisions

- **Addressing:** Topology-aware K4 tetrahedral addressing with O(1) routing for direct neighbors
- **Routing:** Proactive link-state with hysteresis to prevent flapping
- **Security:** Mutual TLS 1.3 with PSK authentication, ephemeral session keys (forward secrecy)
- **Reliability:** Store-and-forward with acknowledgments, configurable TTL, priority queuing
- **Efficiency:** Header compression <20 bytes, automatic fragmentation, transport-agnostic payloads

### Hardware Target

- **Primary:** Waveshare ESP32-S3-Touch-LCD-3.5B + SX1262 LoRa module
- **Secondary:** Any ESP32 variant with WiFi
- **Tertiary:** Linux SBCs for gateway nodes

---

## 4. Comparison with Existing Efforts

| Project | License | Protocol Spec | Our Differentiation |
|---------|---------|---------------|---------------------|
| Meshtastic | GPL-3.0 | None (source only) | Formal specification + permissive license |
| Yggdrasil | LGPL-3.0 | Partial | Targets resource-constrained devices |
| Thread (Matter) | Proprietary | Paid membership | Fully open, no gatekeepers |

---

## 5. Milestone-Based Payment Structure (€35,000 Total)

### Phase 1: Core System Stabilization (€14,000) — Months 1–3

**Tasks:** QSPI boot stabilization, DRV2605L haptic waveform library, SX1262 LoRa driver, bidirectional LoRa communication.

**Deliverables:** Public `v1.0-core-stable` tag, video demo, API docs, automated test suite.

### Phase 2: Mesh Networking & UX Testing (€11,000) — Months 4–6

**Tasks:** Mesh routing with topology discovery, message acknowledgment/retransmission, power-saving modes, neurodivergent-centered UI.

**Deliverables:** LoRa P2P video, topology visualization, UX report from 15 beta testers, accessibility audit.

### Phase 3: Open Hardware Documentation (€10,000) — Months 7–9

**Tasks:** KiCad schematics, Gerber files, BOM, replication guide, OSHWA certification application.

**Deliverables:** KiCad project files, Gerbers, OSHWA application, replication guide, PlatformIO registry entries.

---

## 6. Budget Justification

| Category | Amount | % |
|----------|--------|---|
| Personnel | €21,000 | 60% |
| Hardware Prototyping | €5,250 | 15% |
| Open Documentation | €3,500 | 10% |
| Certification & Compliance | €2,800 | 8% |
| Community Engagement | €2,100 | 6% |
| **Total** | **€35,000** | **100%** |

---

## 7. Sustainability

Reference implementations on ESP32/RP2040/STM32, MIT/Apache-2.0 licensing, IETF/IEEE liaison, bounty program, educational resources, conservation covenant.

---

## 8. Team

**William R. Johnson** — Founder, P31 Labs. 16 years DoD civilian electrical engineering. 22 peer-reviewed white papers. ORCID: 0009-0002-2492-9079. AuDHD. The project is deeply personal: a neurodivergent engineer building the communication infrastructure he needed.

---

## 9. Verification URLs

| Resource | URL |
|----------|-----|
| PHOS demo | https://phos-btn.pages.dev |
| BONDING | https://bonding.p31ca.org |
| GitHub | https://github.com/p31labs |
| Zenodo | https://zenodo.org/search?q=creators.name:%22Johnson%2C%20William%20R.%22 |

---
*Version 2.0 | May 31, 2026 | P31 Labs, Inc.*
