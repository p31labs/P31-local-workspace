# @p31/harmonic-linter

**Version:** `0.1.0-alpha.0` | **License:** MIT | **Author:** P31 Labs

Samson's Law V2 — a stateful PID feedback controller that measures JavaScript/TypeScript code entropy and steers it toward the **Mark 1 Attractor** (H = π/9 ≈ 0.349). Part of the P31 ecosystem; feeds correction signals into the Genesis Gate TelemetryModule for governance alerts.

---

## How it works

```
source string
    └─► Acorn AST parse (dynamic import, local or CDN fallback)
            └─► Single-pass AST walk
                    ├─ Halstead Volume  (operators + operands)
                    ├─ Cyclomatic Complexity  (branching nodes)
                    └─ LOC
                            └─► Weighted entropy normalization → [0, 1]
                                        └─► Module-level PID controller
                                                    └─► correction signal
```

### The math

**Halstead Volume**

```
V = (N1 + N2) * log2(n1 + n2)
```

where N1/N2 are total operator/operand occurrences and n1/n2 are distinct counts.

**Entropy normalization** (weights sum to 1.0)

```
H = (V / 2000) * 0.40
  + ((cyclomatic - 1) / 39) * 0.35
  + (LOC / 500) * 0.25

H = clamp(H, 0, 1)
```

**PID correction** (setpoint = π/9 ≈ 0.349)

```
error      = setpoint - H
integral   = clamp(integral + error * dt, -5, 5)
derivative = (error - prevError) / dt
correction = Kp * error + Ki * integral + Kd * derivative

Kp = 1.0   Ki = 0.05   Kd = 0.02
```

The integral is clamped to [-5, 5] to prevent wind-up across successive file analyses.

---

## Installation

```bash
npm install @p31/harmonic-linter
```

> `analyzeModule` loads Acorn dynamically. It attempts a local resolution first (`acorn` hoisted by the monorepo); if that fails it fetches from `cdn.jsdelivr.net`. No static peer dependency is required.

---

## API

### `analyzeModule(source: string): Promise<AnalysisResult>`

Parse and analyze a JS/TS source string. Uses the module-level `PIDController` instance, so successive calls accumulate integral state. Call `resetPID()` between unrelated files.

On parse error, returns a safe fallback: `{ halstead: 0, cyclomatic: 1, loc, entropy: 0, correction: π/9 }`.

```ts
type AnalysisResult = {
  halstead:   number;  // Halstead Volume V
  cyclomatic: number;  // McCabe complexity (baseline 1)
  loc:        number;  // line count
  entropy:    number;  // normalized score in [0, 1]
  correction: number;  // PID output — see interpretation below
};
```

### `class PIDController`

Stateful PID controller. Constructed with `(kp = 1.0, ki = 0.05, kd = 0.02, setpoint = π/9)`.

| Method | Description |
|---|---|
| `update(measured, dt?)` | Feed a measured entropy value, receive correction signal. `dt` defaults to 1. |
| `reset()` | Clear integral and derivative state. |
| `setpoint` | Read-only. π/9 ≈ 0.349. |

### `resetPID(): void`

Resets the shared module-level `PIDController` instance. Call this between independent file analyses to prevent integral accumulation across unrelated modules.

---

## Interpreting the correction signal

| `correction` | Meaning |
|---|---|
| `> 0` | Entropy below attractor — module has headroom for new features |
| `≈ 0` | At harmonic equilibrium (π/9); no action required |
| `< 0` | Entropy above attractor — refactor signal; reduce complexity |

**Expected ranges by module type:**

| Module | Typical entropy | Typical correction |
|---|---|---|
| Simple 10-line function | 0.05 – 0.15 | positive (headroom) |
| Mark 1 Attractor | ≈ 0.349 | ≈ 0 |
| 200-line complex module | 0.40 – 0.60 | negative (refactor) |

---

## Example usage

```ts
import { analyzeModule, resetPID } from '@p31/harmonic-linter';

const source = `
  export function clamp(value, min, max) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }
`;

// Analyze a single file
const result = await analyzeModule(source);

console.log(result);
// {
//   halstead:   42.3,
//   cyclomatic: 3,
//   loc:        7,
//   entropy:    0.041,
//   correction: 0.308   ← positive: well under attractor, headroom available
// }

// Reset before analyzing an unrelated file
resetPID();
const result2 = await analyzeModule(anotherSource);
```

### Using a custom PID instance

```ts
import { PIDController } from '@p31/harmonic-linter';

const pid = new PIDController(1.0, 0.05, 0.02); // defaults
console.log(pid.setpoint); // 0.3490658503988659

pid.update(0.45);  // entropy above attractor → negative correction
pid.reset();       // clear state before next batch
```

---

## P31 ecosystem integration

`@p31/harmonic-linter` is consumed by the **Genesis Gate TelemetryModule**, which aggregates correction signals across the codebase and emits governance alerts when the rolling mean correction falls below a configured threshold. See the Genesis Gate documentation for telemetry schema and alert routing.

---

## Build

```bash
npm run build    # tsc → dist/
npm test         # vitest run
```

`prepublishOnly` runs `clean → build → test` in sequence.
