# ASAN Grant Narrative

**Applicant:** William R. Johnson, P31 Labs, Inc.
**Requested Amount:** $6,250
**Project:** PHOS OS: Zero-Telemetry Cognitive Operating System for Autistic Adults

---

My name is William R. Johnson. I am a 40-year-old autistic and ADHD (AuDHD) engineer, father of two, and founder of P31 Labs — a nonprofit building open-source assistive technology for neurodivergent individuals. I was diagnosed with autism and ADHD at age 39, after 16 years of masking in a DoD civilian engineering career and decades of being told I was "too intense," "too rigid," or "not a team player." The diagnosis was not a surprise. It was a decryption key — suddenly, my entire life made sense.

I built PHOS because I needed it. Not as an abstract product idea, but as a survival tool.

When your brain works like mine — high-bandwidth, geometric, systems-first — the typical software landscape is hostile. Every app demands context-switching. Every notification is an interruption. Every UI assumes you have unlimited cognitive energy and perfect executive function. None of them ask: *how many spoons do you have right now?*

PHOS (Phosphorus Human Operating Surface) is my answer. It is a cognitive operating system that runs entirely on your device — no cloud, no accounts, no telemetry, no tracking. It uses Spoon Theory as a first-class design principle: when your energy drops, the UI complexity drops with it. Animations fade. Surfaces simplify. The system holds your state so you don't have to.

The technical architecture reflects the cognitive model:

**Surfaces instead of apps.** PHOS has 22 surfaces — functional areas like Hearth (family connection), Sanctuary (secure memory), Forge (commerce), and Chaos Ingest (brain dump). Each surface has its own visual identity, ambient effects, and auditory signature. Navigation is via an intent engine: you type what you need, and the system routes you to the right surface. No menu-digging. No working memory load.

**Spoon-aware degradation.** The BioStore tracks cognitive energy (spoons) as a first-class state variable. At 5 spoons (full energy), surfaces render full animations, particle effects, and ambient audio. At 2 spoons, animations stop, colors mute, and the UI reduces to essential elements. At 0 spoons, GRAY_ROCK mode activates — pure black and white, zero stimulation, with a breathing guide and a single "Grounding Complete" button.

**Zero telemetry by architecture.** PHOS uses PGLite (SQLite compiled to WASM) for local storage. All data stays on-device. The service worker caches everything for offline operation. There are no analytics, no tracking pixels, no data leaving the device except explicit user-initiated family mesh pings. The code is open source (AGPL-3.0) so anyone can verify this claim.

The requested $6,250 would fund:

1. **Accessibility audit** by a neurodivergent usability expert ($2,000)
2. **User testing with 10 autistic adults** ($2,250)
3. **Documentation and replication guide** ($1,000)
4. **Bug fixes and polish from audit findings** ($1,000)

PHOS is not a prototype. It is deployed, tested, and live. It has been built by one autistic engineer, for autistic users, with zero venture capital, zero institutional support, and zero safety net.

What I am asking for is not seed funding to start. It is validation funding to harden, audit, and document what already exists — so that other autistic adults can use it, fork it, and make it their own.

Because the best assistive technology is not built *for* disabled people. It is built *by* them.

---
*P31 Labs, Inc. | May 31, 2026*
