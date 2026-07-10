# NGI Fediversity — Full Proposal

**Project Title:** PHOS-Sovereign: Service-Portable Cognitive Prosthetic Platform with Data Decoupling
**Call:** NGI Fediversity, 11th Open Call
**Requested Amount:** €25,000 EUR
**Duration:** 9 months
**License:** AGPL-3.0 (software), CC-BY-4.0 (documentation)
**Submitted by:** P31 Labs, Inc. (EIN 42-1888158)
**Contact:** William R. Johnson | will@p31ca.org | ORCID 0009-0002-2492-9079
**Repository:** https://github.com/p31labs/andromeda
**Demo:** https://phos-btn.pages.dev

---

## Generative AI Disclosure

This proposal was drafted with the assistance of Kilo (openrouter/owl-alpha), an AI code assistant. GenAI was used for document structuring, formatting, and drafting. All technical content was directed and reviewed by William R. Johnson based on P31 Labs' deployed PHOS system. A full prompt provenance log is maintained at `docs/grants/prompt-provenance-log.md`.

---

## 1. Abstract

PHOS-Sovereign addresses a critical gap in the NGI Fediversity ecosystem: cognitive prosthetic infrastructure that is fully service-portable and data-decoupled. Current Fediverse and self-hosted services assume neurotypical users who can manage data migration and service orchestration. For neurodivergent individuals with executive dysfunction, the "just deploy it yourself" promise is inaccessible without a cognitive layer that travels with the data.

PHOS (Phosphorus Human Operating Surface) is a deployed, 22-surface cognitive OS that runs entirely on-device with zero telemetry. PHOS-Sovereign extends it with: (1) data decoupling via standardized .phos export format, (2) NixOS module for declarative deployment, (3) ActivityPub bridge for Fediverse federation.

---

## 2. Problem & Solution

**The Gap:** Self-hosting assumes users who can manage NixOS configs, data migration, and multi-service orchestration. For the 15-20% of the population that is neurodivergent, these assumptions break down under cognitive load.

**The Solution:** PHOS provides spoon-aware UI degradation, GRAY_ROCK mode, SANCTUARY mode, PGLite local-first storage, and WebAuthn hardware-secured auth. PHOS-Sovereign adds data decoupling and NixOS reproducibility.

---

## 3. Technical Approach

### 3.1 Data Decoupling Layer
- `.phos` export format (tar.gz of SQLite dump + metadata JSON)
- Import pipeline with schema validation and migration
- Incremental CRDT-based sync between devices

### 3.2 NixOS Deployment Module
Declarative deployment of the entire PHOS stack (static site, API worker, atmosphere worker, PGLite WASM) with TLS, backups, and OPFS persistence.

### 3.3 Fediverse Bridge (ActivityPub)
Maps PHOS family mesh events to Fediverse activities: mesh pings → `Create(Note)`, spoon changes → `Update(Person)`, Guardian → `Flag`, visitation → `Event`.

---

## 4. Milestone-Based Payment Structure (€25,000 Total)

### Phase 1: Data Decoupling Layer (€10,000) — Months 1–3
.phos format spec, export/import pipeline, schema versioning, NixOS module skeleton.

### Phase 2: Service Portability & Fediverse Bridge (€8,000) — Months 4–6
Complete NixOS module, ActivityPub adapter, CRDT sync, migration tool.

### Phase 3: Validation & Documentation (€7,000) — Months 7–9
Reference deployment, user testing with 10 neurodivergent participants, accessibility audit, replication guide.

---

## 5. Budget

| Category | Amount | % |
|----------|--------|---|
| Personnel | €14,000 | 56% |
| Hardware | €3,000 | 12% |
| Documentation | €3,500 | 14% |
| User Testing | €2,500 | 10% |
| Community | €2,000 | 8% |
| **Total** | **€25,000** | **100%** |

---

## 6. Team

**William R. Johnson** — Built PHOS from scratch over 16+ months. 22 peer-reviewed white papers. AuDHD, hypoparathyroidism. Building the tools he needed.

---

## 7. Verification URLs

| Resource | URL |
|----------|-----|
| PHOS demo | https://phos-btn.pages.dev |
| BONDING | https://bonding.p31ca.org |
| GitHub | https://github.com/p31labs |

---
*Version 1.0 | May 31, 2026 | P31 Labs, Inc.*
