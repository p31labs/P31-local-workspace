# Prompt 3 — Deterministic Privacy-Preserving Identity

**Domain:** Cryptography / privacy engineering
**Complexity:** (Breadth: Moderate, Nesting: Intermediate, Exploration: Medium)

---

Design a naming system for a family app that generates stable, memorable
aliases ("pickle names") from a seed value. Requirements:

1. **Deterministic.** The same seed always produces the same name.
2. **Collision-resistant.** Within a family, no two members share a name.
   Provide the collision-probability bound.
3. **Privacy-preserving.** The name must not be reversible to the seed or
   to the user's real identity.
4. **Human-readable.** Names like "Dill·quiet" or "Bread·quick".
5. **Vocabulary-closed.** Generated names come only from a published set
   of prefixes and suffixes. No free-form strings.

Research and cite:

- Deterministic generation techniques (cyrb128, mulberry32, splitmix64,
  xorshift) and their statistical properties.
- Collision probability for a vocabulary of N prefixes × M suffixes.
- The privacy argument for one-way derivation: what an attacker can and
  cannot learn from a name.
- Existing approaches to pseudonymity in family or child-facing apps.

Produce the algorithm, the invariants (as testable assertions), and a
negative-rubric section: what a *broken* naming system looks like
(names that leak identity, non-deterministic generation, inadequate
collision bounds, a reversible "hash").