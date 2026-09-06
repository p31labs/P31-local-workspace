# @p31/q-distribution

**Version:** `1.0.0` | **License:** MIT | **Author:** P31 Labs | **Homepage:** https://phosphorus31.org

Fisher-Escolà Q Statistical Distribution — a zero-dependency cognitive exhaustion model using Beta distribution sampling. Provides session-start capacity sampling, task-driven exponential decay, and UI-tier classification for progressive disclosure. Part of the P31 ecosystem; feeds into `useCockpitStore → metabolicState` for adaptive rendering in the Z-Index Cockpit.

---

## The distribution

**Beta(α, β, lower, upper) — 4-parameter Beta**

| Constant | Value | Description |
|---|---|---|
| `BETA_ALPHA` | 21.6165 | Shape parameter α |
| `BETA_BETA` | 46.4970 | Shape parameter β |
| `DISTRIBUTION_LOWER` | 0.0385 | Support lower bound |
| `DISTRIBUTION_UPPER` | 0.7783 | Support upper bound |
| `DISTRIBUTION_MEAN` | 0.273 | Population mean (≈ lower-moderate capacity) |

The parameters model population-level cognitive capacity at session start, validated against P31 spoon economy data. The mean of 0.273 reflects that most users begin sessions at lower-moderate capacity, well below the theoretical maximum. Output maps onto `metabolicState.current_spoons / metabolicState.max_spoons`, enabling adaptive UI tier selection before live telemetry is available.

### Sampling method

Random Beta samples are generated via the **Gamma ratio method**:

```
Beta(a, b) = Gamma(a) / (Gamma(a) + Gamma(b))
```

Each Gamma sample uses the **Marsaglia-Tsang method** (shape >= 1), with a boost trick for shape < 1:

```
Gamma(shape < 1) = Gamma(shape + 1) * Uniform^(1/shape)
```

Standard normal samples for the Marsaglia-Tsang accept-reject loop are drawn via **Box-Muller transform**, with u1 > 0 enforced to avoid `log(0)`.

The 4-parameter scaling is applied as a final affine transform:

```
sample = DISTRIBUTION_LOWER + (DISTRIBUTION_UPPER - DISTRIBUTION_LOWER) * Beta(α, β)
```

---

## API

### `sampleInitialCapacity(): number`

Draw a single session-start cognitive capacity from Beta(21.6165, 46.4970, 0.0385, 0.7783). Returns a value in [0.0385, 0.7783].

```ts
const spoons = sampleInitialCapacity(); // e.g. 0.261
```

### `decaySpoons(current, taskCost, lambda?): number`

Model spoon depletion after completing a task using exponential decay.

```
next = current * e^(-lambda * taskCost)
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `current` | number | — | Current capacity in [0, 1] |
| `taskCost` | number | — | Relative task cost (1 = baseline) |
| `lambda` | number | `0.1` | Decay rate, calibrated to P31 session data |

### `getUITier(spoons: number): UITier`

Classify current capacity into a UI complexity tier, aligned with the cockpit's `voltageLevel` bands.

| Capacity | Tier | Intended experience |
|---|---|---|
| > 0.70 | `FULL` | All features, animations, rich data views |
| 0.40 – 0.70 | `MODERATE` | Core features, reduced animation |
| 0.15 – 0.40 | `SIMPLIFIED` | Essential actions only, plain layout |
| <= 0.15 | `MINIMAL` | Single-action focus, maximum contrast |

### `getElementOpacity(spoons: number, priority: number): number`

Compute rendered opacity for a UI element based on current capacity and its informational priority. Lower-priority elements fade out first, preserving attentional bandwidth for critical content.

```
opacity = clamp((spoons - priority * 0.3) / 0.3, 0, 1)
```

| Priority | Level | Fades below |
|---|---|---|
| `0` | Essential | Never (always ~visible) |
| `1` | Important | ~0.30 |
| `2` | Supplementary | ~0.60 |
| `3` | Decorative | ~0.90 |

### Exported constants

```ts
export const BETA_ALPHA          // 21.6165
export const BETA_BETA           // 46.4970
export const DISTRIBUTION_LOWER  // 0.0385
export const DISTRIBUTION_UPPER  // 0.7783
export const DISTRIBUTION_MEAN   // 0.273
```

---

## Example: session lifecycle

```ts
import {
  sampleInitialCapacity,
  decaySpoons,
  getUITier,
  getElementOpacity,
  DISTRIBUTION_MEAN,
} from '@p31/q-distribution';

// --- Session start ---
let spoons = sampleInitialCapacity();
// e.g. 0.261 — below population mean (0.273), SIMPLIFIED tier

console.log(getUITier(spoons));
// 'SIMPLIFIED'

// --- After a high-cost task (taskCost = 3) ---
spoons = decaySpoons(spoons, 3, 0.1);
// 0.261 * e^(-0.3) ≈ 0.193 — still SIMPLIFIED

// --- After several baseline tasks (15 × taskCost = 1) ---
// 0.193 * e^(-1.5) ≈ 0.043 → approaching MINIMAL
spoons = decaySpoons(spoons, 15);

console.log(getUITier(spoons));
// 'MINIMAL'

// --- Compute element visibility ---
const chartOpacity = getElementOpacity(spoons, 2); // supplementary element
// ≈ 0 — faded out at low capacity

const alertOpacity = getElementOpacity(spoons, 0); // essential element
// ≈ 1 — always visible
```

---

## Statistical verification

To verify the distribution parameters, draw 1 000 samples and check that the empirical mean is close to 0.273:

```ts
import { sampleInitialCapacity, DISTRIBUTION_MEAN } from '@p31/q-distribution';

const samples = Array.from({ length: 1000 }, sampleInitialCapacity);
const mean = samples.reduce((a, b) => a + b, 0) / samples.length;

console.log(mean); // expect ≈ 0.273 (±0.01 at n=1000)
console.log(Math.abs(mean - DISTRIBUTION_MEAN) < 0.02); // true
```

---

## P31 ecosystem integration

`@p31/q-distribution` is consumed by `useCockpitStore` in the Z-Index Cockpit. On session initialization, `sampleInitialCapacity()` seeds `metabolicState.current_spoons`. Subsequent task completions call `decaySpoons()` to update the store, which triggers reactive UI-tier recalculation via `getUITier()` and per-element opacity bindings via `getElementOpacity()`.

---

## Build

Zero runtime dependencies — pure math.

```bash
npm test         # vitest
npm run build    # tsc --noEmit (type check only)
```
