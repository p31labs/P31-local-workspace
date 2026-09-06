# BrosPhase Specification v1.0

**Canonical architecture document for PHOS Bros Phase.**
**Date:** 2026-06-21
**Status:** Current

---

## 1. Personas

Personas are dynamic, user-determined, and have no fixed count. Every identity comes from Cognitive Passport enrollment JSON at registration time. The system stores zero hardcoded names, counts, or relationship types.

**Initial state (no Cognitive Passport):** Randomized placeholders labeled Alpha, Beta, Gamma, Delta with random colors and generic icons. These are prompts for personalization, not fixed identities.

**Personalization:** Users update identities via voice: "Call Alpha 'Bash'" → the system updates the persona id-to-name mapping stored in the Cognitive Passport sync layer. The Bros engine reads from that layer at every load.

**Relationship model:** The system is graph-agnostic. It supports parent/child, sibling, friend, caregiver, advocate, and any future relationship type without modification. Relationship context is stored as a string field (`relationshipType`) derived from the enrollment data. The Bros engine and UI label personas by their relationship context for accessibility, but never assume a nuclear-family default.

**Privacy rule:** Children are referenced by initials only (e.g., S.J., W.J.). Full names never appear in engine configs, UI labels, or event payloads.

---

## 2. Event Bus

The Bros phase uses the master runtime event bus. All events are relayed through `PHOSMasterRuntime.emit()` and `PHOSMasterRuntime.on()` at registration time.

**Canonical event names:**

| Event | Direction | Trigger | Payload |
|---|---|---|---|
| `bros.persona.changed` | engine → UI | Persona switch completes | `{ persona, from, switchCount }` |
| `bros.persona.switch` | UI → engine | User clicks or voice selects | `{ persona }` |
| `bros.error` | engine → master | Engine records an error | `{ message, errorCount }` |

**Event schema:**

```typescript
interface BrosEvent {
  type: string;            // Canonical event name
  payload: Record<string, unknown>;
  timestamp: number;       // Unix ms
  source: 'bros';          // Phase identifier
  persona?: string;        // Active persona id at time of event
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}
```

**Guarantee:** No persona data is ever hardcoded into event payloads. Persona references are always id strings looked up at runtime.

---

## 3. Convergence

Convergence is evaluated weekly from live phase state, not from hardcoded scores or week math.

**Week 1 gate — Core Runtime (Voice + Bros + Router):**
- All three phases report `status: 'active'`
- Bros phase has at least one persona loaded
- Bros phase has an active persona selected
- Bros phase has at least one voice trigger registered
- Bros phase `errorCount` is zero

**Confidence calculation:**
```
confidence = base_ready_score * max(0, 1 - errorCount * 0.15)
```
where `base_ready_score` is 0.7 at Week 1 if all gates pass, 0.25 otherwise.

**Deliverables and blockers** are enumerated dynamically from phase state, not from a static list.

---

## 4. Trust

Trust scoring uses the EigenTrust algorithm implemented in `packages/shared/src/trust/eigentrust`. The Bros phase does not implement trust internally — it registers as a trust-edge consumer and applies per-edge scores at persona interaction time.

**Per-edge trust:** Every persona-to-persona interaction generates a pre-trust and post-trust score. Scores are stored in the shared trust module, not locally in Bros phase.

**Thresholds:** Configurable via `PHOSConfig` or a separate trust policy file. No magic numbers in the Bros engine. Default threshold is 0.5 (votes below threshold fall back to default persona).

**Trust propagation:** When `bros.persona.changed` fires, the master runtime evaluates trust edges from the current context and may auto-revert to a trusted persona if confidence drops below threshold.

---

## 5. Deployment

**Versioning — single source of truth:**

- `PHOS_ENGINE_VERSION = '2.0.0'` defined in `PHOSConfig.ts`
- `getPHOSConfig(env)` returns the full config for the target environment
- Phase versions are `'1.0.0-beta.1'` (development/staging) or `'1.0.0'` (production)
- No `'0.1.0'` anywhere in phase configs
- The Bros engine reads `config.version` at `initialize()` and stores it as `this.version`

**Environment modes:**

| env | bridge | mocks | convergenceWeek |
|---|---|---|---|
| development | enabled | true | 1 |
| staging | disabled | true | 4 |
| production | disabled | false | 8 |

**Cognitive Passport alignment:** The engine reads `config.personas` at registration. If Cognitive Passport is not enrolled, the engine generates randomized placeholders and emits a `bros.error` advising enrollment. Persona data is never written to disk by the Bros phase — it is read from the master config populated by the adapter.

---

*This document is the canonical BrosPhase architecture reference. Any code change that introduces hardcoded identities, fixed persona counts, or hardcoded relationship types violates this specification.*
