# P31 Cognitive Safety – Spoon Economy & Operator Protection

**Version:** 1.0.0  
**Last Updated:** June 14, 2026

This document describes the **spoon economy** (energy budget), the **guardian phase** (cognitive shutdown prevention), somatic rate limiting, and all safety measures that protect the operator from burnout, hyperfocus, and sensory overload.

---

## 1. The Spoon Economy (0–5 Scale)

| Spoon Level | Name | Description | UI Adaptation |
|-------------|------|-------------|----------------|
| **5** | Quantum | Full capacity, complex reasoning | High animations, full UI, crystalline rendering |
| **4** | Flow | Normal sustained work | Standard UI, moderate animations |
| **3** | Bridge | Focused work only | Reduced animations, simplified choices |
| **2** | Sanctuary | Minimal interaction | Binary choices, high contrast, soft colours |
| **1** | Crisis | Extreme fatigue | No chat input, large breathing guide |
| **0** | Shutdown | No processing, immediate rest | Guardian overlay, 863 Hz tone, screen locked |

Spoons are **user‑reported** (via the PHOS HUD slider or equivalent UI) and optionally inferred from keystroke velocity and language abstraction (see Spoon Monitor, p31‑cortex).

---

## 2. Guardian Phase (Autonomic Override)

When spoons reach **0**, the system enters **Guardian Phase**:

- Chat input and all interactive UI are **locked**.
- A full‑screen overlay appears with a breathing guide (4‑7‑8 cycle).
- The **863 Hz Larmor tone** is played via native `cpal` (Rust) to physically ground the operator.
- All background tasks (CashPilot, mesh sync) continue but are muted from UI.

To recover:
- The overlay contains a **single button** ("Recover & Resume").
- Clicking it sets spoons back to **5** and restores the interface.

**Implementation:** The Guardian Phase is triggered **only in the PHOS desktop app** (Tauri) when the frontend detects `spoons === 0`. The CLI cannot set spoons or trigger Guardian Phase.

---

## 3. Somatic Rate Limiting (CLI)

The `p31` CLI tracks command frequency in `~/.p31/telemetry.db` (SQLite, CGO‑free). After **30 commands in 15 minutes**:

- A terminal beep is emitted (`\a`).
- A warning is printed: `⚠️ 30+ commands in 15 minutes – somatic check recommended`

**Purpose:** Prevents hyperfocus‑induced burnout. The operator can override with the global flag `p31 --rate-limit=false` or increase the limit by editing `cmd/rate_limit.go` (line 55) and rebuilding.

**Database Schema:**
```sql
CREATE TABLE commands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  command TEXT NOT NULL
);
CREATE INDEX idx_timestamp ON commands(timestamp);
```

---

## 4. Real‑Time Cognitive Telemetry (Spoon Monitor)

The **spoon monitor** service (p31‑cortex, port 5002) tracks:

- **Keystroke velocity** – drop >40% indicates fatigue.
- **Language abstraction** – shift from concrete to metaphorical language (dissociation).
- **Tool‑task mismatches** – same tool used 3+ times without output change.
- **Explicit shutdown signals** – "stop", "I’m done", "jitterbugging".

When any indicator triggers, a **Red Board alert** is raised and the `requires_intervention` flag is set. The frontend (PHOS) can then display a warning or automatically reduce spoon level.

**Endpoints:**
- `GET /api/state` – Current spoon level and alerts.
- `POST /api/event` – Inject telemetry (keystroke, message, tool_switch).
- `WS /ws` – Real‑time broadcasts (every 5 seconds).

---

## 5. UI Spoon Awareness

All surfaces in PHOS must declare `data-spoons={spoons}` on their root container. This attribute is used by CSS to adapt contrast, glow, and animations:

```css
[data-spoons="1"] {
  filter: grayscale(0.3);
  --glow-intensity: 0.2;
}
[data-spoons="0"] {
  filter: grayscale(0.8) blur(2px);
}
```

Additionally, `useSpoonCapabilities` hook exposes:

```tsx
const caps = useSpoonCapabilities();
if (caps.canAnimate) { /* enable animations */ }
if (caps.canInteract) { /* enable interactive widgets */ }
```

**Enforcement:** The `SurfaceContent.tsx` wrapper automatically passes `data-spoons` to every surface. Any new surface must use this wrapper.

---

## 6. Affective Chemistry (Voltage Scoring)

Before a user sends a message or starts a complex task, the system can run **affective chemistry** (p31‑cortex, port 5001) to compute a voltage score:

```
V = (0.4 × Urgency) + (0.3 × Emotional Load) + (0.3 × Cognitive Complexity)
```

Based on the voltage, the system recommends a **spoon budget** (FULL / MEDIUM / LOW) and adjusts token limits, temperature, and whether to buffer the response.

**Integration:** The ShakeStream library calls `/api/analyze` before every LLM request.

---

## 7. OQE Verification (Hallucination Prevention)

The **OQE Verification** service (p31‑cortex, port 5003) screens model outputs for:

- **[V:] tag validation** – claims must reference a source file.
- **Domain guardrails** – firmware must include loop semantics; legal must cite statute.
- **Token consistency** – detects inflated token counts.
- **Topology validation** – data flow must be acyclic.

Outputs that fail verification are **FLAGGED_FOR_REVIEW** and require manual signoff (WCD‑06) before being returned to the user.

---

## 8. Guardian Phase Override Commands

| Mechanism | Effect |
|-----------|--------|
| PHOS HUD slider | Set spoons to 0–5 in the desktop app UI |
| `p31 spoon` CLI | View current spoon level (read‑only; no `set` subcommand exists) |
| `p31 energy` CLI | Ask local LLM "how much energy do you have?" (novelty) |

> **Note:** There is no `p31 spoon set` command. Spoon setting is done exclusively through the PHOS desktop app interface.

---

## 9. Best Practices for Operators

- **Set spoon level truthfully** – the system adapts to your capacity.
- **Use `p31 doctor --fun`** – the joy line helps regulate mood.
- **If you feel the beep** – step away from the terminal for a few minutes.
- **Enable `--rate-limit=false`** only during critical debugging sessions, then re‑enable.

---

## 10. Implementation Summary

| Feature | Location | Language |
|---------|----------|----------|
| Spoon state propagation | `AtmosphereProvider.tsx`, `SurfaceContent.tsx` | TypeScript |
| Guardian Overlay | `TheGuardian.tsx`, `ArcadeMasterRuntime.tsx` | TSX |
| Somatic rate limiter | `cmd/rate_limit.go` | Go |
| Spoon Monitor service | `p31-cortex/spoon_monitor_app.py` | Python |
| Affective Chemistry | `p31-cortex/affective_chemistry_app.py` | Python |
| OQE Verification | `p31-cortex/oqe_verification_app.py` | Python |

---

**Next:** [HARDENING.md](./HARDENING.md) – Security posture, access control, zero‑trust defaults.
